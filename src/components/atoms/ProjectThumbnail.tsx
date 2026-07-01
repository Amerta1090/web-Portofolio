interface ProjectThumbnailProps {
  src?: string;
  alt: string;
  className?: string;
}

export default function ProjectThumbnail({ src, alt, className = "" }: ProjectThumbnailProps) {
  const imageSrc = src || "/images/placeholder/project.svg";

  return (
    <div className={`relative overflow-hidden aspect-video bg-surface-tertiary rounded-t-lg ${className}`}>
        <img
          src={imageSrc}
          alt={alt}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/placeholder/project.svg";
          }}
        />
      {!src && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-text-secondary/40">{/* ASSET NEEDED */}</span>
        </div>
      )}
    </div>
  );
}
