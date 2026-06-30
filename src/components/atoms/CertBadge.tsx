interface CertBadgeProps {
  src?: string;
  title: string;
  issuer: string;
  className?: string;
}

export default function CertBadge({ src, title, issuer, className = "" }: CertBadgeProps) {
  const imageSrc = src || "/images/placeholder/badge.svg";

  return (
    <div className={`relative group ${className}`}>
      <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-tertiary mx-auto border-2 border-border group-hover:border-brand/40 transition-colors duration-300">
        <img
          src={imageSrc}
          alt={title}
          className="w-full h-full object-contain p-1"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/placeholder/badge.svg";
          }}
        />
        {!src && <span className="sr-only">{/* ASSET NEEDED: certification badge */}</span>}
      </div>
      <p className="text-xs text-text-primary text-center mt-2 font-medium leading-tight line-clamp-2">{title}</p>
      <p className="text-[10px] text-text-secondary/60 text-center">{issuer}</p>
    </div>
  );
}
