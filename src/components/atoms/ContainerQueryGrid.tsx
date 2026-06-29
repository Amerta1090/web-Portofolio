import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function ContainerQueryGrid({ children, className = "" }: Props) {
  return (
    <div className={`container-query-grid ${className}`}>
      <div className="cq-grid-item grid gap-5">{children}</div>
    </div>
  );
}

export function CqCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`cq-card card bg-bg-secondary border border-border rounded-lg overflow-hidden transition-all duration-300 hover:border-brand/40 ${className}`}>
      {children}
    </div>
  );
}

export function CqCardMedia({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`cq-card-media ${className}`}>{children}</div>;
}

export function CqCardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`cq-card-body p-5 ${className}`}>{children}</div>;
}
