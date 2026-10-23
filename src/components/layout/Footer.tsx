import { Link } from "react-router-dom";
import { OccazLogo } from "../brand/OccazLogo";
import { BrandSocialLinks } from "../brand/BrandSocialLinks";
import { useBranding } from "../../hooks/useBranding";

export function Footer() {
  const brand = useBranding();
  return (
    <footer className="mt-auto border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40">
      <div className="container py-12">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3">
              <OccazLogo size={44} />
              <span className="text-xl font-bold tracking-tight">{brand.wordmark}</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-[var(--text-tertiary)]">
              {brand.tagline
                ? brand.tagline
                : "Discover events, tickets and life-changing opportunities — all in one beautiful place."}
            </p>
            <BrandSocialLinks className="mt-5" />
            {(brand.contact_email || brand.contact_phone || brand.address) && (
              <div className="mt-5 space-y-1 text-xs text-[var(--text-tertiary)]">
                {brand.contact_email && (
                  <div>
                    <a href={`mailto:${brand.contact_email}`} className="hover:text-[var(--text-primary)]">
                      {brand.contact_email}
                    </a>
                  </div>
                )}
                {brand.contact_phone && (
                  <div>
                    <a href={`tel:${brand.contact_phone}`} className="hover:text-[var(--text-primary)]">
                      {brand.contact_phone}
                    </a>
                  </div>
                )}
                {brand.address && <div>{brand.address}</div>}
              </div>
            )}
          </div>
          {[
            {
              title: "Discover",
              links: [
                { label: "Events", to: "/events" },
                { label: "Opportunities", to: "/opportunities" },
                { label: "Explore", to: "/explore" },
                { label: "Saved", to: "/saved" },
              ],
            },
            {
              title: "Account",
              links: [
                { label: "Tickets", to: "/tickets" },
                { label: "Profile", to: "/profile" },
                { label: "Preferences", to: "/profile" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About", to: "#" },
                { label: "Careers", to: "#" },
                { label: "Press", to: "#" },
                { label: "Admin", to: "/admin" },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-sm text-[var(--text-tertiary)] transition hover:text-[var(--text-primary)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-[var(--border-subtle)] pt-6 text-xs text-[var(--text-tertiary)] md:flex-row md:items-center">
          <p>© 2026 {brand.wordmark}. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-[var(--text-primary)]">Privacy</a>
            <a href="#" className="hover:text-[var(--text-primary)]">Terms</a>
            <a href="#" className="hover:text-[var(--text-primary)]">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
