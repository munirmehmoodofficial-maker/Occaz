import { Link } from "react-router-dom";
import { Twitter, Instagram, Linkedin, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40">
      <div className="container py-12">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent-500 to-pink-500">
                <span className="text-sm font-bold text-[var(--text-primary)]">O</span>
              </div>
              <span className="text-lg font-bold tracking-tight">Occaz</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-[var(--text-tertiary)]">
              Discover events, tickets and life-changing opportunities — all in
              one beautiful place.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[
                { Icon: Twitter, href: "#" },
                { Icon: Instagram, href: "#" },
                { Icon: Linkedin, href: "#" },
                { Icon: Github, href: "#" },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-card-hover)] text-[var(--text-secondary)] ring-1 ring-[var(--border-default)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
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
          <p>© 2026 Occaz. All rights reserved.</p>
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
