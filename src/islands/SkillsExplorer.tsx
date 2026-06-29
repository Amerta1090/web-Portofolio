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

function ProficiencyBar({ level }: { level: number }) {
  return (
    <div className="w-full h-1 bg-bg-primary/50 mt-1.5 overflow-hidden rounded-full">
      <div
        className="h-full bg-brand transition-all duration-500 ease-out rounded-full"
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
          <input
            type="text"
            value={activeSkill ?? ""}
            onChange={(e) => setActiveSkill(e.target.value || null)}
            placeholder="Search skills..."
            className="w-full px-4 py-3 bg-bg-secondary/50 border border-border text-text-primary placeholder:text-text-secondary/30 focus:outline-none focus:border-brand rounded-lg transition-colors text-sm"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((category) => (
          <div
            key={category.name}
            className="border border-border rounded-lg p-5 hover:border-brand/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-semibold text-text-primary">{category.name}</h3>
              <span className="text-[10px] text-text-secondary/40 ml-auto">
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
                    className={`group flex items-center justify-between px-3 py-2 text-left rounded transition-all duration-200 ${
                      isActive
                        ? "bg-brand/10 border-l-2 border-brand"
                        : "hover:bg-brand/5 border-l-2 border-transparent"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-xs ${
                          isActive
                            ? "text-brand font-medium"
                            : "text-text-secondary group-hover:text-text-primary"
                        }`}
                      >
                        {skill.name}
                      </span>
                      <ProficiencyBar level={skill.proficiency} />
                    </div>
                    <span
                      className={`text-[9px] ml-2 ${
                        skill.proficiency >= 5
                          ? "text-brand"
                          : skill.proficiency >= 3
                            ? "text-text-secondary/60"
                            : "text-text-secondary/30"
                      }`}
                    >
                      {skill.proficiency}/5
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {activeSkill && (
        <div className="mt-6 border border-border rounded-lg bg-brand/5 p-4">
          <p className="text-xs text-text-secondary">
            Filtering by: <span className="text-brand font-medium">{activeSkill}</span>
          </p>
        </div>
      )}
    </div>
  );
}
