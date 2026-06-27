import { AdaptiveDpr, Float, PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useState } from "react";

function SceneObjects() {
  return (
    <group>
      <Float speed={0.8} rotationIntensity={0.2} floatIntensity={0.4}>
        <mesh position={[-3, -1, -5]} rotation={[0.3, 0.5, 0]}>
          <torusGeometry args={[0.8, 0.15, 16, 32]} />
          <meshBasicMaterial color="#7A8C6F" transparent opacity={0.15} />
        </mesh>
      </Float>
      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.6}>
        <mesh position={[4, 2, -8]} rotation={[0.8, 0.2, 0.5]}>
          <torusKnotGeometry args={[0.6, 0.2, 64, 8]} />
          <meshBasicMaterial color="#C17F59" transparent opacity={0.12} />
        </mesh>
      </Float>
      <Float speed={0.6} rotationIntensity={0.15} floatIntensity={0.3}>
        <mesh position={[-2, 3, -10]} rotation={[0.1, 0.8, 0.2]}>
          <icosahedronGeometry args={[0.5]} />
          <meshBasicMaterial color="#7A8C6F" transparent opacity={0.08} wireframe />
        </mesh>
      </Float>
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh position={[3, -2, -12]} rotation={[0.6, 0.3, 0.7]}>
          <dodecahedronGeometry args={[0.4]} />
          <meshBasicMaterial color="#C17F59" transparent opacity={0.1} wireframe />
        </mesh>
      </Float>
    </group>
  );
}

function SceneContentInner() {
  const [fps, setFps] = useState<"high" | "medium" | "low">("high");

  return (
    <>
      <PerformanceMonitor
        factor={1}
        flipflops={3}
        onDecline={() => setFps("medium")}
        onFallback={() => setFps("low")}
      />
      {fps !== "low" && <SceneObjects />}
    </>
  );
}

export default function SceneContent() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 60 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: "low-power",
      }}
      style={{ opacity: 0.4 }}
    >
      <SceneContentInner />
      <AdaptiveDpr pixelated />
    </Canvas>
  );
}
