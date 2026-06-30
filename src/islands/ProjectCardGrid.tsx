import TiltCard from "../islands/TiltCard";
import ProjectThumbnail from "../components/atoms/ProjectThumbnail";

interface Project {
  title: string;
  period?: string;
  description: string;
  category?: string;
  featured?: boolean;
  skills: string[];
  image?: string;
}

interface Props {
  projects: Project[];
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export default function ProjectCardGrid({ projects }: Props) {
  return (
    <div className="container-query-grid">
      <div className="cq-grid-item grid gap-5">
        {projects.map((project) => (
          <TiltCard key={project.title} maxTilt={3} perspective={1000} scale={1.02} glare={false}>
            <a
              href={`/projects/${slugify(project.title)}`}
              className="card group block bg-bg-secondary border border-border rounded-lg overflow-hidden transition-all duration-300"
            >
              <ProjectThumbnail
                src={project.image}
                alt={project.title}
              />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">{project.category}</span>
                  </div>
                  {project.featured && (
                    <span className="text-[10px] text-brand border border-brand/30 px-1.5 py-0.5 rounded">
                      Featured
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-text-primary group-hover:text-brand transition-colors leading-tight mb-2">
                  {project.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed line-clamp-2 mb-3">
                  {project.description}
                </p>
                {project.period && (
                  <p className="text-xs text-text-secondary/50 mb-3">{project.period}</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {project.skills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="text-[10px] px-1.5 py-0.5 border border-border text-text-secondary rounded"
                    >
                      {skill.length > 15 ? skill.slice(0, 15) + "…" : skill}
                    </span>
                  ))}
                  {project.skills.length > 4 && (
                    <span className="text-[10px] px-1.5 py-0.5 border border-border text-text-secondary rounded">
                      +{project.skills.length - 4}
                    </span>
                  )}
                </div>
              </div>
            </a>
          </TiltCard>
        ))}
      </div>
    </div>
  );
}
