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

function DotRating({ level }: { level: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${level} out of 5`}>
      {[1, 2, 3, 4, 5].map((dot) => (
        <span
          key={dot}
          className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
            dot <= level ? "bg-accent" : "bg-bg-tertiary"
          }`}
        />
      ))}
    </span>
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
        <input
          type="text"
          value={activeSkill ?? ""}
          onChange={(e) => setActiveSkill(e.target.value || null)}
          placeholder="Search or select a skill..."
          className="w-full max-w-md px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((category) => (
          <div key={category.name}>
            <h3 className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">
              {category.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              {category.skills.map((skill) => {
                const isActive = activeSkill === skill.name;
                return (
                  <button
                    type="button"
                    key={skill.name}
                    onClick={() => setActiveSkill(isActive ? null : skill.name)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full transition-all duration-200 ${
                      isActive
                        ? "bg-accent text-bg-primary"
                        : "bg-bg-tertiary text-text-secondary hover:bg-accent-muted/20 hover:text-accent"
                    }`}
                  >
                    <span>{skill.name}</span>
                    <DotRating level={skill.proficiency} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {activeSkill && (
        <div className="mt-8 p-4 bg-bg-secondary border border-border rounded-xl">
          <p className="text-sm text-text-secondary">
            Showing projects related to{" "}
            <span className="text-accent font-medium">{activeSkill}</span> (skill-to-project
            filtering coming with data enrichment).
          </p>
        </div>
      )}
    </div>
  );
}
