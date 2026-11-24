import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CyberShield3D } from "./CyberShield3D";
import { NeuralNetwork3D } from "./NeuralNetwork3D";
import { CYBER, bindPointer } from "./palette";
import { storyFrame } from "./story";

export type Tier = "desktop" | "tablet" | "mobile";
const FOLLOW = 4; // how fast the scene eases toward the scroll target (1/s)
const THREAT_FAR = 9;
const BARRIER_R = 2.4;
const RED = new THREE.Color(CYBER.red);

function rng(seed: number) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }

function Rings({ level }: { level: MutableRefObject<{ rings: number; energy: number }> }) {
  const g = useRef<THREE.Group>(null);
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);
  useFrame((_, d) => {
    if (!g.current) return;
    const dt = Math.min(d, 0.05);
    g.current.children.forEach((c, i) => { c.rotation.z += dt * (0.4 + i * 0.25) * (i % 2 ? -1 : 1); });
    const s = 0.6 + level.current.rings * 0.4;
    g.current.scale.setScalar(s);
    mats.current.forEach((m, i) => (m.opacity = level.current.rings * (0.7 - i * 0.15)));
  });
  return (
    <group ref={g}>
      {[1.9, 2.25, 2.6].map((r, i) => (
        <mesh key={r} rotation={[Math.PI / 2.4 + i * 0.35, i * 0.6, 0]}>
          <torusGeometry args={[r, 0.015, 8, 96]} />
          <meshBasicMaterial ref={(m) => { if (m) mats.current[i] = m; }} color={i === 1 ? CYBER.red : i === 2 ? CYBER.glow : CYBER.blue} transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Energy({ count, level }: { count: number; level: MutableRefObject<{ energy: number; spread: number }> }) {
  const pts = useRef<THREE.Points>(null);
  const seeds = useMemo(() => { const r = rng(3); return Array.from({ length: count }, () => [r() * Math.PI * 2, 1.6 + r() * 1.3, (r() - 0.5) * 2, 0.5 + r()]); }, [count]);
  const pos = useMemo(() => new Float32Array(count * 3), [count]);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    seeds.forEach(([a = 0, r = 2, y = 0, s = 1], i) => {
      const ang = a + t * s;
      pos[i * 3] = Math.cos(ang) * r; pos[i * 3 + 1] = y + Math.sin(ang * 2) * 0.2; pos[i * 3 + 2] = Math.sin(ang) * r;
    });
    if (pts.current) {
      pts.current.geometry.attributes["position"]!.needsUpdate = true;
      const m = pts.current.material as THREE.PointsMaterial;
      m.opacity = Math.max(level.current.energy, level.current.spread) * 0.9;
      m.color.set(CYBER.glow).lerp(RED, level.current.spread * 0.5);
    }
  });
  return (
    <points ref={pts}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
      <pointsMaterial color={CYBER.blue} size={0.06} transparent opacity={0} depthWrite={false} toneMapped={false} />
    </points>
  );
}

function Threats({ count, level }: { count: number; level: MutableRefObject<{ threats: number; threatApproach: number; barrier: number }> }) {
  const pts = useRef<THREE.Points>(null);
  const barrier = useRef<THREE.MeshBasicMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);
  const { dirs, pos, col } = useMemo(() => {
    const r = rng(11);
    const dirs = Array.from({ length: count }, () => new THREE.Vector3(r() - 0.5, (r() - 0.5) * 0.7, r() - 0.5).normalize());
    const col = new Float32Array(count * 3);
    const red = new THREE.Color(CYBER.red), orange = new THREE.Color(CYBER.redGlow);
    dirs.forEach((_, i) => (i % 3 ? red : orange).toArray(col, i * 3));
    return { dirs, pos: new Float32Array(count * 3), col };
  }, [count]);
  useFrame((st) => {
    const { threats, threatApproach, barrier: b } = level.current;
    const t = st.clock.elapsedTime;
    dirs.forEach((d, i) => {
      // Particles slow and jitter once they reach the barrier: isolated, not passing through.
      const r = THREAT_FAR - (THREAT_FAR - BARRIER_R - 0.15) * threatApproach + Math.sin(t * 3 + i) * 0.05 * threatApproach;
      pos[i * 3] = d.x * r; pos[i * 3 + 1] = d.y * r; pos[i * 3 + 2] = d.z * r;
    });
    if (pts.current) {
      pts.current.geometry.attributes["position"]!.needsUpdate = true;
      const m = pts.current.material as THREE.PointsMaterial;
      m.opacity = threats; m.size = 0.12 + threatApproach * 0.08 * (1 + Math.sin(t * 6) * 0.5);
    }
    if (ring.current) { ring.current.rotation.z = t * 0.6; (ring.current.material as THREE.MeshBasicMaterial).opacity = threats * 0.8; }
    if (barrier.current) barrier.current.opacity = b * (0.12 + Math.sin(t * 2) * 0.03);
  });
  return (
    <group>
      <points ref={pts}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[col, 3]} />
        </bufferGeometry>
        <pointsMaterial vertexColors size={0.12} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </points>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BARRIER_R + 0.35, 0.02, 8, 128]} />
        <meshBasicMaterial color={CYBER.red} transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[BARRIER_R, 2]} />
        <meshBasicMaterial ref={barrier} color={CYBER.glow} wireframe transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Story({ progress, tier, animate }: { progress: MutableRefObject<number>; tier: Tier; animate: boolean }) {
  const { camera, viewport } = useThree();
  const shield = useRef<THREE.Group>(null);
  const world = useRef<THREE.Group>(null);
  const eased = useRef(progress.current);
  const level = useRef(storyFrame(progress.current));
  const wide = viewport.aspect > 1.1;
  const homeX = wide ? 2.2 : 0;
  const homeY = wide ? 0 : -1.4;
  useFrame((_, d) => {
    const dt = Math.min(d, 0.05);
    eased.current += (progress.current - eased.current) * (animate ? 1 - Math.exp(-FOLLOW * dt) : 1);
    const f = storyFrame(eased.current);
    level.current = f;
    const centre = Math.min(1, f.rings + f.barrier); // move to centre for rings/threat stages
    if (shield.current) {
      shield.current.position.set(homeX * (1 - centre * (1 - f.spread)), homeY * (1 - centre), f.shieldZ);
      shield.current.rotation.y = f.shieldRotY;
      shield.current.scale.setScalar(f.shieldScale * (wide ? 1.4 : 1));
    }
    if (world.current) world.current.scale.setScalar(1 + f.spread * 0.25);
    const simple = tier !== "desktop";
    camera.position.set(simple ? 0 : f.cameraX, 0, simple ? 7 - (7 - f.cameraZ) * 0.5 : f.cameraZ);
    camera.lookAt(0, 0, -2);
  });
  const n = { desktop: [150, 500, 40, 180, 140], tablet: [90, 250, 20, 100, 80], mobile: [50, 120, 10, 50, 40] }[tier];
  return (
    <>
      <ambientLight intensity={0.4} />
      <group ref={world}><NeuralNetwork3D nodes={n[0]!} dust={n[1]!} pulses={n[2]!} animate={animate} /></group>
      <group ref={shield}>
        <CyberShield3D animate={animate} />
        <Rings level={level} />
        <Energy count={n[3]!} level={level} />
      </group>
      <Threats count={n[4]!} level={level} />
    </>
  );
}

export default function ScrollStoryCanvas({ progress, tier, reduced }: { progress: MutableRefObject<number>; tier: Tier; reduced: boolean }) {
  const [visible, setVisible] = useState(true);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bindPointer();
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting));
    if (wrap.current) io.observe(wrap.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={wrap} className="h-full w-full">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={tier === "desktop" ? [1, 1.75] : [1, 1.25]}
        camera={{ position: [0, 0, 7], fov: 50 }}
        gl={{ antialias: tier === "desktop", alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => gl.domElement.parentElement?.setAttribute("data-scene-ready", "true")}
      >
        <Story progress={progress} tier={tier} animate={!reduced} />
      </Canvas>
    </div>
  );
}
