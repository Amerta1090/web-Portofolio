import React from "react";
import { motion } from "framer-motion";
import experienceData from "../../../../data/experience.json";

const typeColors: Record<string, string> = {
  "full-time": "bg-accent",
  "full-time contract": "bg-accent",
  "part-time": "bg-accent-muted",
  contract: "bg-accent-muted",
  internship: "bg-accent/60",
};

export const ExperienceScreen: React.FC = () => {
  const experiences = experienceData as any[];

  return (
    <div className="w-full h-full px-16 py-8 relative overflow-y-auto">
      <motion.div
        className="flex items-center gap-3 mb-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05 }}
      >
        <span className="w-2 h-2 bg-accent pulse-ring" />
        <span className="text-xs font-mono text-accent tracking-[0.2em] uppercase">
          Work History // Experience
        </span>
      </motion.div>

      <div className="flex flex-col gap-4 relative">
        {/* Vertical line */}
        <div className="absolute left-[18px] top-0 bottom-0 w-px bg-accent/20" />

        {experiences.map((exp: any, idx: number) => (
          <motion.div
            key={exp.id || idx}
            className="flex items-start gap-6 relative pl-12"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + idx * 0.08, type: "spring", stiffness: 100 }}
          >
            {/* Timeline dot */}
            <div className={`absolute left-[10px] top-2 w-[18px] h-[18px] rounded-full border-2 border-bg-primary ${typeColors[exp.type] || "bg-accent"} z-10`} />

            {/* Content card */}
            <motion.div
              className="flex-1 border border-accent/15 bg-bg-secondary/50 p-5 hover:border-accent/40 transition-colors"
              whileHover={{ x: 4, borderColor: "var(--accent)" }}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-wider text-text-primary">
                    {exp.role}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-accent font-bold font-mono text-sm">{exp.company}</span>
                    <span className="text-text-secondary/40">//</span>
                    <span className="text-text-secondary text-xs font-mono">{exp.location || "Remote"}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-mono text-accent tracking-wider">
                    {exp.start_date} — {exp.end_date || "Present"}
                  </div>
                  <div className="text-[10px] font-mono text-text-secondary/40 uppercase mt-0.5">
                    {exp.type}
                  </div>
                </div>
              </div>

              {exp.highlights && exp.highlights.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {exp.highlights.slice(0, 3).map((h: string, i: number) => (
                    <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                      <span className="text-accent mt-1.5 block w-1 h-1 bg-accent rounded-full flex-shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}

              {exp.technologies && exp.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {exp.technologies.slice(0, 5).map((tech: string) => (
                    <span
                      key={tech}
                      className="text-[10px] font-mono px-2 py-0.5 border border-accent/20 text-accent/80 tracking-wider uppercase"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
