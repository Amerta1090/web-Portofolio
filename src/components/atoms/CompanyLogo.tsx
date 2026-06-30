interface CompanyLogoProps {
  src?: string;
  alt: string;
  className?: string;
}

export default function CompanyLogo({ src, alt, className = "" }: CompanyLogoProps) {
  const imageSrc = src || "/images/placeholder/company.svg";

  return (
    <div className={`w-12 h-12 rounded-full overflow-hidden bg-surface-tertiary flex items-center justify-center flex-shrink-0 ${className}`}>
      <img
        src={imageSrc}
        alt={alt}
        className="w-8 h-8 object-contain"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/images/placeholder/company.svg";
        }}
      />
      {!src && <span className="sr-only">{/* ASSET NEEDED: company logo */}</span>}
    </div>
  );
}
