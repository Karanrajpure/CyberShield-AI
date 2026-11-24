import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CYBER, pointer } from "./palette";

const DRIFT = 0.18; // node wobble amplitude
const PULSE_SPEED = 0.45; // edge lengths per second
const PARALLAX = 0.35;

function dotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.6)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// Deterministic pseudo-random so layouts are stable between renders.
function rng(seed: number) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }

export function NeuralNetwork3D({ nodes = 140, dust = 500, pulses = 40, intensity = 1, animate = true }: { nodes?: number; dust?: number; pulses?: number; intensity?: number; animate?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const data = useMemo(() => {
    const r = rng(7);
    const base = new Float32Array(nodes * 3);
    const phase = new Float32Array(nodes);
    for (let i = 0; i < nodes; i++) {
      base[i * 3] = (r() - 0.5) * 22;
      base[i * 3 + 1] = (r() - 0.5) * 12;
      base[i * 3 + 2] = -2 - r() * 9; // depth layers
      phase[i] = r() * Math.PI * 2;
    }
    const edges: [number, number][] = [];
    for (let i = 0; i < nodes; i++) {
      const near: [number, number][] = [];
      for (let j = i + 1; j < nodes; j++) {
        const at = (n: number) => base[n] ?? 0;
        const d = Math.hypot(at(i * 3) - at(j * 3), at(i * 3 + 1) - at(j * 3 + 1), at(i * 3 + 2) - at(j * 3 + 2));
        if (d < 3.2) near.push([d, j]);
      }
      near.sort((a, b) => a[0] - b[0]).slice(0, 3).forEach(([, j]) => edges.push([i, j]));
    }
    const pos = new Float32Array(base);
    const nodeColors = new Float32Array(nodes * 3);
    const blue = new THREE.Color(CYBER.blue), red = new THREE.Color(CYBER.red), glow = new THREE.Color(CYBER.glow);
    for (let i = 0; i < nodes; i++) (r() > 0.82 ? red : r() > 0.5 ? glow : blue).toArray(nodeColors, i * 3);
    const linePos = new Float32Array(edges.length * 6);
    const lineCol = new Float32Array(edges.length * 6);
    edges.forEach(([a, b], k) => { blue.toArray(lineCol, k * 6); (k % 5 === 0 ? red : glow).toArray(lineCol, k * 6 + 3); });
    const dustPos = new Float32Array(dust * 3);
    for (let i = 0; i < dust; i++) { dustPos[i * 3] = (r() - 0.5) * 30; dustPos[i * 3 + 1] = (r() - 0.5) * 18; dustPos[i * 3 + 2] = -1 - r() * 14; }
    const pulseState = Array.from({ length: Math.min(pulses, edges.length) }, () => ({ e: Math.floor(r() * edges.length), t: r() }));
    const pulsePos = new Float32Array(pulseState.length * 3);
    return { base, phase, edges, pos, nodeColors, linePos, lineCol, dustPos, pulseState, pulsePos, tex: dotTexture() };
  }, [nodes, dust, pulses]);

  const nodeGeo = useRef<THREE.BufferGeometry>(null);
  const lineGeo = useRef<THREE.BufferGeometry>(null);
  const pulseGeo = useRef<THREE.BufferGeometry>(null);
  const dustRef = useRef<THREE.Points>(null);
  const time = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (animate) time.current += dt;
    const t = time.current;
    const { base, phase, pos, edges, linePos, pulseState, pulsePos } = data;
    for (let i = 0; i < phase.length; i++) {
      pos[i * 3] = (base[i * 3] ?? 0) + Math.sin(t * 0.3 + (phase[i] ?? 0)) * DRIFT;
      pos[i * 3 + 1] = (base[i * 3 + 1] ?? 0) + Math.cos(t * 0.25 + (phase[i] ?? 0)) * DRIFT;
    }
    edges.forEach(([a, b], k) => {
      linePos.set(pos.subarray(a * 3, a * 3 + 3), k * 6);
      linePos.set(pos.subarray(b * 3, b * 3 + 3), k * 6 + 3);
    });
    pulseState.forEach((p, k) => {
      if (animate) p.t += dt * PULSE_SPEED;
      if (p.t > 1) { p.t = 0; const b = edges[p.e]?.[1]; const next = edges.findIndex(([x], idx) => x === b && idx !== p.e); p.e = next >= 0 ? next : (p.e * 7 + 13) % edges.length; }
      const edge = edges[p.e]; if (!edge) return;
      const [a, b] = edge;
      for (let c = 0; c < 3; c++) { const from = pos[a * 3 + c] ?? 0; pulsePos[k * 3 + c] = from + ((pos[b * 3 + c] ?? 0) - from) * p.t; }
    });
    { const a = nodeGeo.current?.getAttribute("position"); if (a) a.needsUpdate = true; }
    { const a = lineGeo.current?.getAttribute("position"); if (a) a.needsUpdate = true; }
    { const a = pulseGeo.current?.getAttribute("position"); if (a) a.needsUpdate = true; }
    if (dustRef.current && animate) dustRef.current.rotation.z += dt * 0.01;
    const g = group.current;
    if (g) {
      const k = 1 - Math.exp(-2 * dt);
      g.position.x += (pointer.x * PARALLAX - g.position.x) * k;
      g.position.y += (pointer.y * PARALLAX * 0.6 - g.position.y) * k;
    }
  });

  return (
    <group ref={group}>
      <lineSegments>
        <bufferGeometry ref={lineGeo}>
          <bufferAttribute attach="attributes-position" args={[data.linePos, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.lineCol, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.22 * intensity} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <points>
        <bufferGeometry ref={nodeGeo}>
          <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.nodeColors, 3]} />
        </bufferGeometry>
        <pointsMaterial map={data.tex} vertexColors size={0.32} sizeAttenuation transparent opacity={0.9 * intensity} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <points>
        <bufferGeometry ref={pulseGeo}>
          <bufferAttribute attach="attributes-position" args={[data.pulsePos, 3]} />
        </bufferGeometry>
        <pointsMaterial map={data.tex} color={CYBER.blue} size={0.45} sizeAttenuation transparent opacity={intensity} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.dustPos, 3]} />
        </bufferGeometry>
        <pointsMaterial map={data.tex} color={CYBER.glow} size={0.09} sizeAttenuation transparent opacity={0.55 * intensity} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}
