import { useState } from "react";

interface Props {
  skills: string[];
}

const TECH_DESCRIPTIONS: Record<string, string> = {
  python: "Core language for ML pipelines, data processing, and automation.",
  javascript: "Frontend and backend web development across the stack.",
  typescript: "Type-safe JavaScript for scalable application development.",
  django: "High-level Python web framework for rapid development.",
  postgresql: "Relational database for production data storage and analytics.",
  docker: "Containerization platform for consistent deployment environments.",
  tensorflow: "Deep learning framework for building and training neural networks.",
  pytorch: "Flexible deep learning framework with dynamic computation graphs.",
  scikit: "Machine learning library for classification, regression, and clustering.",
  airflow: "Workflow orchestration for complex data pipelines and scheduling.",
  fastapi: "Modern Python web framework for building high-performance APIs.",
  react: "JavaScript library for building interactive user interfaces.",
  node: "JavaScript runtime for server-side applications and tooling.",
  mongodb: "NoSQL document database for flexible data modeling.",
  redis: "In-memory data store for caching and real-time applications.",
};

export default function TechExplorer({ skills }: Props) {
  const [activeTech, setActiveTech] = useState<string | null>(null);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {skills.map((skill) => {
          const key = skill.toLowerCase().replace(/[^a-z]/g, "");
          const isActive = activeTech === skill;
          return (
            <button
              key={skill}
              type="button"
              onClick={() => setActiveTech(isActive ? null : skill)}
              className={`px-3 py-1.5 text-sm rounded-full transition-all duration-200 ${
                isActive
                  ? "bg-brand text-bg-primary shadow-lg shadow-brand/20"
                  : "bg-bg-tertiary text-text-secondary hover:bg-brand/10 hover:text-brand"
              }`}
            >
              {skill}
            </button>
          );
        })}
      </div>
      {activeTech && (
        <div className="p-4 bg-bg-secondary border border-border rounded-xl animate-fadeIn">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-semibold text-brand">How it was used</span>
          </div>
          <p className="text-text-secondary text-sm">
            {TECH_DESCRIPTIONS[activeTech.toLowerCase().replace(/[^a-z]/g, "")]
              ? `${activeTech}: ${TECH_DESCRIPTIONS[activeTech.toLowerCase().replace(/[^a-z]/g, "")]}`
              : `${activeTech} was used in this project. Click again to close.`}
          </p>
        </div>
      )}
    </div>
  );
}
