import { useState } from "react";

interface Skill {
  name: string;
  proficiency: number;
}

interface SkillCategory {
  name: string;
  icon: string;
  skills: Skill[];
}

interface SkillsData {
  categories: SkillCategory[];
}

interface Props {
  skills: SkillsData;
}

const categoryIcons: Record<string, string> = {
  "Machine Learning & AI": "◆",
  "Data Science & Analytics": "■",
  "Web Development": "▲",
  "IoT & Embedded Systems": "●",
  "DevOps & MLOps": "★",
  "Programming Languages": "⚡",
  "Cloud & Infrastructure": "◉",
  "Productivity & Automation": "▣",
};

function ProficiencyBar({ level }: { level: number }) {
  return (
    <div className="w-full h-1 bg-bg-primary/50 mt-1.5 overflow-hidden">
      <div
        className="h-full bg-accent transition-all duration-500 ease-out"
        style={{ width: `${(level / 5) * 100}%` }}
      />
    </div>
  );
}

export default function SkillsExplorer({ skills }: Props) {
  const [activeSkill, setActiveSkill] = useState<string | null>(null);

  const filtered = activeSkill
    ? skills.categories
        .map((cat) => ({
          ...cat,
          skills: cat.skills.filter((s) =>
            s.name.toLowerCase().includes(activeSkill.toLowerCase()),
          ),
        }))
        .filter((cat) => cat.skills.length > 0)
    : skills.categories;

  return (
    <div>
      <div className="mb-6">
        <div className="relative max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent text-sm">◆</span>
          <input
            type="text"
            value={activeSkill ?? ""}
            onChange={(e) => setActiveSkill(e.target.value || null)}
            placeholder="SEARCH SKILLS..."
            className="w-full pl-10 pr-4 py-3 bg-bg-secondary/50 border border-accent/20 text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:border-accent transition-colors font-mono text-sm uppercase tracking-wider"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((category) => (
          <div
            key={category.name}
            className="border border-accent/10 p-5 hover:border-accent/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-accent text-lg">{categoryIcons[category.name] || "◇"}</span>
              <h3 className="text-xs font-black uppercase tracking-wider text-text-primary">
                {category.name}
              </h3>
              <span className="text-[10px] font-mono text-text-secondary/40 ml-auto">
                {category.skills.length}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {category.skills.map((skill) => {
                const isActive = activeSkill === skill.name;
                return (
                  <button
                    type="button"
                    key={skill.name}
                    onClick={() => setActiveSkill(isActive ? null : skill.name)}
                    className={`group flex items-center justify-between px-3 py-2 text-left transition-all duration-200 ${
                      isActive
                        ? "bg-accent/10 border-l-2 border-accent"
                        : "hover:bg-accent/5 border-l-2 border-transparent"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-xs font-mono tracking-wider ${
                          isActive
                            ? "text-accent"
                            : "text-text-secondary group-hover:text-text-primary"
                        }`}
                      >
                        {skill.name}
                      </span>
                      <ProficiencyBar level={skill.proficiency} />
                    </div>
                    <span
                      className={`text-[9px] font-mono ml-2 ${
                        skill.proficiency >= 5
                          ? "text-accent"
                          : skill.proficiency >= 3
                            ? "text-text-secondary/60"
                            : "text-text-secondary/30"
                      }`}
                    >
                      Lv.{skill.proficiency}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {activeSkill && (
        <div className="mt-6 border border-accent/20 bg-accent/5 p-4">
          <p className="text-xs font-mono text-text-secondary">
            <span className="text-accent">◆</span> Filtering by:{" "}
            <span className="text-accent font-bold uppercase tracking-wider">{activeSkill}</span>
          </p>
        </div>
      )}
    </div>
  );
}
