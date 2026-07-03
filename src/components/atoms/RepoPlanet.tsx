import { useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { GitHubRepo } from "../../types/github";

export interface RepoPlanetProps {
  repo: GitHubRepo;
  position: [number, number, number];
  size: number;
  color: string;
  orbitSpeed: number;
  orbitCenter: [number, number, number];
  orbitRadius: number;
  initialAngle: number;
  onHover: (repo: GitHubRepo | null) => void;
  onClick: (repo: GitHubRepo) => void;
  isSelected: boolean;
}

const LANG_COLORS: Record<string, string> = {
  "Jupyter Notebook": "#DA5B0B",
  Java: "#B07219",
  TypeScript: "#3178C6",
  Kotlin: "#A97BFF",
  HTML: "#E34F26",
  Python: "#3572A5",
  JavaScript: "#F7DF1E",
  Astro: "#FF5A03",
  CSS: "#563D7C",
  Makefile: "#427819",
  Go: "#00ADD8",
  Rust: "#DEA584",
  Swift: "#F05138",
  Ruby: "#CC342D",
  "C++": "#F34B7D",
  C: "#555555",
  "C#": "#178600",
  PHP: "#4F5D95",
  Scala: "#C22D40",
  Shell: "#89E051",
};

export function getLangColor(lang: string | null): string {
  if (!lang) return "#6b7280";
  return LANG_COLORS[lang] ?? "#6b7280";
}

export default function RepoPlanet({
  repo,
  position,
  size,
  color,
  orbitSpeed,
  orbitCenter,
  orbitRadius,
  initialAngle,
  onHover,
  onClick,
  isSelected,
}: RepoPlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const [hovered, setHovered] = useState(false);
  const angleRef = useRef(initialAngle);
  const [pos, setPos] = useState<[number, number, number]>(position);

  useFrame((_, delta) => {
    if (orbitRadius > 0) {
      angleRef.current += orbitSpeed * delta;
      const x = orbitCenter[0] + Math.cos(angleRef.current) * orbitRadius;
      const z = orbitCenter[2] + Math.sin(angleRef.current) * orbitRadius;
      const y = orbitCenter[1] + Math.sin(angleRef.current * 0.5) * 0.2;

      if (meshRef.current) {
        meshRef.current.position.set(x, y, z);
      }
      if (ringRef.current) {
        ringRef.current.position.set(x, y, z);
        ringRef.current.rotation.z += delta * 0.5;
      }
      if (glowRef.current) {
        glowRef.current.position.set(x, y, z);
      }
      setPos([x, y, z]);
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    onHover(repo);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    setHovered(false);
    onHover(null);
    document.body.style.cursor = "auto";
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick(repo);
  };

  const emissiveIntensity = hovered || isSelected ? 0.6 : 0.15;
  const scale = hovered || isSelected ? size * 1.3 : size;

  return (
    <group>
      <mesh
        ref={meshRef}
        position={pos}
        scale={scale}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      <mesh ref={ringRef} position={pos} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 0.8, size * 0.9, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.6 : 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      <sprite ref={glowRef} position={pos} scale={[size * 2, size * 2, 1]}>
        <spriteMaterial
          color={color}
          transparent
          opacity={hovered ? 0.3 : 0.08}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      {(hovered || isSelected) && (
        <Html position={[pos[0], pos[1] + size + 0.8, pos[2]]} center distanceFactor={4}>
          <div className="px-3 py-1.5 rounded-lg backdrop-blur-md bg-black/60 border border-white/10 text-xs whitespace-nowrap pointer-events-none shadow-xl">
            <div className="font-semibold text-white">{repo.name}</div>
            <div className="flex items-center gap-2 mt-0.5 text-white/70">
              <span className="flex items-center gap-1">★ {repo.stars}</span>
              {repo.language && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  {repo.language}
                </span>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
