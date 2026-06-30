import {
  Brain,
  Code,
  Cloud,
  Database,
  type LucideIcon,
  Network,
  Smartphone,
  Terminal,
  Wrench,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  brain: Brain,
  code: Code,
  cloud: Cloud,
  database: Database,
  network: Network,
  smartphone: Smartphone,
  terminal: Terminal,
  wrench: Wrench,
  default: Code,
};

interface SkillIconProps {
  name: string;
  className?: string;
  size?: number;
}

export default function SkillIcon({ name, className = "", size = 16 }: SkillIconProps) {
  const Icon = iconMap[name.toLowerCase()] ?? iconMap.default;
  return <Icon className={className} size={size} aria-hidden="true" />;
}
