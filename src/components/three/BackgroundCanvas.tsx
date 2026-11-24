import { useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { CyberShield3D } from "./CyberShield3D";
import { NeuralNetwork3D } from "./NeuralNetwork3D";
import { bindPointer } from "./palette";

export type Variant = "hero" | "auth" | "subtle" | "mini";

function HeroShield({ animate }: { animate: boolean }) {
  const { viewport } = useThree();
  const wide = viewport.aspect > 1.1;
  // Desktop: centre-right beside the heading. Narrow screens: below the text.
  const pos: [number, number, number] = wide ? [viewport.width * 0.22, 0, 0] : [0, -viewport.height * 0.3, -1];
  return <CyberShield3D position={pos} scale={wide ? 1.55 : 1.05} animate={animate} />;
}

export default function BackgroundCanvas({ variant }: { variant: Variant }) {
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    bindPointer();
    const onVis = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onMq = () => setReduced(mq.matches);
    mq.addEventListener("change", onMq);
    setMobile(window.innerWidth < 768);
    return () => { document.removeEventListener("visibilitychange", onVis); mq.removeEventListener("change", onMq); };
  }, []);
  const animate = !reduced;
  const counts = {
    hero: { nodes: mobile ? 60 : 150, dust: mobile ? 150 : 500, pulses: mobile ? 15 : 40, intensity: 1 },
    auth: { nodes: mobile ? 45 : 90, dust: mobile ? 100 : 250, pulses: mobile ? 10 : 20, intensity: 0.7 },
    subtle: { nodes: mobile ? 35 : 80, dust: mobile ? 80 : 200, pulses: mobile ? 8 : 16, intensity: 0.4 },
    mini: null,
  }[variant];
  return (
    <Canvas
      frameloop={!visible ? "never" : reduced ? "demand" : "always"}
      dpr={variant === "subtle" ? 1 : mobile ? [1, 1.25] : [1, 1.5]}
      camera={{ position: [0, 0, variant === "mini" ? 3.6 : 7], fov: 50 }}
      gl={{ antialias: !mobile, alpha: true, powerPreference: "low-power" }}
      onCreated={({ gl }) => gl.domElement.parentElement?.setAttribute("data-scene-ready", "true")}
    >
      <ambientLight intensity={0.4} />
      {counts && <NeuralNetwork3D {...counts} animate={animate} />}
      {variant === "hero" && <HeroShield animate={animate} />}
      {variant === "auth" && <CyberShield3D position={[0, 3.4, -4]} scale={0.8} animate={animate} />}
      {variant === "mini" && <CyberShield3D scale={1.1} animate={animate} />}
    </Canvas>
  );
}
