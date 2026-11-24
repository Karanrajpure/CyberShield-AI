import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, Line } from "@react-three/drei";
import * as THREE from "three";
import { CYBER, pointer } from "./palette";

const SPIN = 0.25; // rad/s around the vertical axis
const TILT = 0.25; // max mouse tilt in radians

function shieldShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 1.25);
  s.bezierCurveTo(0.45, 1.05, 0.85, 1.0, 1.05, 1.02);
  s.bezierCurveTo(1.08, 0.2, 0.95, -0.75, 0, -1.35);
  s.bezierCurveTo(-0.95, -0.75, -1.08, 0.2, -1.05, 1.02);
  s.bezierCurveTo(-0.85, 1.0, -0.45, 1.05, 0, 1.25);
  return s;
}

export function CyberShield3D({ position = [0, 0, 0], scale = 1, animate = true }: { position?: [number, number, number]; scale?: number; animate?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef(0);
  const { geometry, outline } = useMemo(() => {
    const shape = shieldShape();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3, curveSegments: 24 });
    g.center();
    const pts = shape.getPoints(64).map((p) => new THREE.Vector3(p.x, p.y + 0.05, 0.16));
    return { geometry: g, outline: pts };
  }, []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    if (animate) spin.current += dt * SPIN;
    const k = 1 - Math.exp(-3 * dt);
    g.rotation.y = spin.current + THREE.MathUtils.lerp(g.rotation.y - spin.current, pointer.x * TILT, k);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -pointer.y * TILT * 0.6, k);
    if (animate) g.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
  });

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial color={CYBER.metal} emissive={CYBER.blue} emissiveIntensity={0.03} transparent opacity={0.9} roughness={0.25} metalness={0.9} clearcoat={1} side={THREE.DoubleSide} depthWrite={false} />
        <Edges threshold={20} color={CYBER.blue} />
      </mesh>
      <Line points={outline} color={CYBER.blue} lineWidth={2.5} transparent opacity={0.95} />
      <Line points={outline.map((p) => p.clone().setZ(-0.16))} color={CYBER.glow} lineWidth={1.5} transparent opacity={0.7} />
      {/* Lock */}
      <group position={[0, -0.05, 0.2]}>
        <mesh position={[0, 0.3, 0]}>
          <torusGeometry args={[0.24, 0.055, 12, 32, Math.PI]} />
          <meshStandardMaterial color={CYBER.blue} emissive={CYBER.blue} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.08, 0]}>
          <boxGeometry args={[0.7, 0.56, 0.12]} />
          <meshStandardMaterial color={CYBER.red} emissive={CYBER.redGlow} emissiveIntensity={0.9} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.04, 0.07]}>
          <circleGeometry args={[0.07, 20]} />
          <meshBasicMaterial color={CYBER.bg} />
        </mesh>
        <mesh position={[0, -0.16, 0.07]}>
          <planeGeometry args={[0.05, 0.16]} />
          <meshBasicMaterial color={CYBER.bg} />
        </mesh>
      </group>
      <pointLight position={[1.5, 1, 2]} color={CYBER.blue} intensity={6} distance={6} />
      <pointLight position={[-1.5, -1, 2]} color={CYBER.red} intensity={4} distance={6} />
    </group>
  );
}
