import { useState } from "react";
import CertBadge from "./CertBadge";

interface Certification {
  title: string;
  issuer: string;
  badge?: string;
}

interface BadgeGridProps {
  certifications: Certification[];
  className?: string;
}

export default function BadgeGrid({ certifications, className = "" }: BadgeGridProps) {
  const [filterIssuer, setFilterIssuer] = useState<string | null>(null);

  const issuers = [...new Set(certifications.map((c) => c.issuer))];
  const filtered = filterIssuer
    ? certifications.filter((c) => c.issuer === filterIssuer)
    : certifications;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setFilterIssuer(null)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            !filterIssuer
              ? "bg-brand text-bg-primary border-brand"
              : "border-border text-text-secondary hover:border-brand/40"
          }`}
        >
          All ({certifications.length})
        </button>
        {issuers.map((issuer) => (
          <button
            key={issuer}
            type="button"
            onClick={() => setFilterIssuer(issuer)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filterIssuer === issuer
                ? "bg-brand text-bg-primary border-brand"
                : "border-border text-text-secondary hover:border-brand/40"
            }`}
          >
            {issuer} ({certifications.filter((c) => c.issuer === issuer).length})
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {filtered.map((cert) => (
          <CertBadge
            key={cert.title}
            src={cert.badge}
            title={cert.title}
            issuer={cert.issuer}
          />
        ))}
      </div>
    </div>
  );
}
