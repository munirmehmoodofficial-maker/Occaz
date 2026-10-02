import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function Section({
  title,
  subtitle,
  actionLabel,
  actionTo,
  children,
  className,
  style,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionTo?: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section className={className} style={style}>
      <div className="section-header">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
        {actionLabel && actionTo && (
          <Link to={actionTo} className="link-arrow">
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
