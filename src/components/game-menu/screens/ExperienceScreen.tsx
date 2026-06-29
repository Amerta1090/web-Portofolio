import { motion } from "framer-motion";
import type React from "react";
import experienceData from "../../../../data/experience.json";
import { duration, easing, stagger, distance } from "../../../lib/motion";

const typeColors: Record<string, string> = {
  "full-time": "bg-brand",
  "full-time contract": "bg-brand",
  "part-time": "bg-brand-muted",
  contract: "bg-brand-muted",
  internship: "bg-brand/60",
};

export const ExperienceScreen: React.FC = () => {
  const experiences = experienceData as any[];

  return (
    <div className="w-full h-full px-16 py-8 relative overflow-y-auto">
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, x: -distance.moderate }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: duration.fast }}
      >
        <span className="text-xs text-text-secondary">Work History / Experience</span>
      </motion.div>

      <div className="flex flex-col gap-4 relative">
        <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border" />

        {experiences.map((exp: any, idx: number) => (
          <motion.div
            key={exp.id || idx}
            className="flex items-start gap-6 relative pl-12"
            initial={{ opacity: 0, x: -distance.moderate }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: duration.fast + idx * stagger.relaxed,
              ...easing["ease-spring-gentle"],
            }}
          >
            <div
              className={`absolute left-[10px] top-2 w-[18px] h-[18px] rounded-full border-2 border-bg-primary ${typeColors[exp.type] || "bg-brand"} z-10`}
            />

            <motion.div
              className="flex-1 border border-border rounded-lg bg-bg-secondary/50 p-5 hover:border-brand/30 transition-colors"
              whileHover={{ x: distance.micro }}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">{exp.role}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-brand text-sm font-medium">{exp.company}</span>
                    <span className="text-text-secondary/40">&middot;</span>
                    <span className="text-text-secondary text-xs">{exp.location || "Remote"}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-brand">
                    {exp.start_date} &mdash; {exp.end_date || "Present"}
                  </div>
                  <div className="text-xs text-text-secondary/50 mt-0.5">{exp.type}</div>
                </div>
              </div>

              {exp.highlights && exp.highlights.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {exp.highlights.slice(0, 3).map((h: string, i: number) => (
                    <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                      <span className="mt-1.5 block w-1 h-1 bg-brand rounded-full flex-shrink-0" />
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
                      className="text-xs px-2 py-0.5 border border-border text-text-secondary rounded"
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
