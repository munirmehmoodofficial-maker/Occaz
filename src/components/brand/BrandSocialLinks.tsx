import {
  Twitter,
  Instagram,
  Linkedin,
  Facebook,
  Music2,
  Youtube,
  Github,
  MessageCircle,
  Send,
  AtSign,
  MessageSquare,
  Link2,
  Globe,
} from "lucide-react";
import { useBranding, type SocialLinks } from "../../hooks/useBranding";
import clsx from "clsx";

export const SOCIAL_PLATFORMS: {
  key: keyof SocialLinks;
  label: string;
  Icon: any;
  placeholder: string;
  /** Base URL used to turn a bare handle into a full link */
  base?: string;
}[] = [
  { key: "instagram", label: "Instagram", Icon: Instagram, placeholder: "https://instagram.com/occaz", base: "https://instagram.com/" },
  { key: "twitter", label: "X / Twitter", Icon: Twitter, placeholder: "https://x.com/occaz", base: "https://x.com/" },
  { key: "facebook", label: "Facebook", Icon: Facebook, placeholder: "https://facebook.com/occaz", base: "https://facebook.com/" },
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin, placeholder: "https://linkedin.com/company/occaz", base: "https://linkedin.com/company/" },
  { key: "tiktok", label: "TikTok", Icon: Music2, placeholder: "https://tiktok.com/@occaz", base: "https://tiktok.com/@" },
  { key: "youtube", label: "YouTube", Icon: Youtube, placeholder: "https://youtube.com/@occaz", base: "https://youtube.com/@" },
  { key: "whatsapp", label: "WhatsApp", Icon: MessageCircle, placeholder: "https://wa.me/923001234567", base: "https://wa.me/" },
  { key: "telegram", label: "Telegram", Icon: Send, placeholder: "https://t.me/occaz", base: "https://t.me/" },
  { key: "threads", label: "Threads", Icon: AtSign, placeholder: "https://threads.net/@occaz", base: "https://threads.net/@" },
  { key: "discord", label: "Discord", Icon: MessageSquare, placeholder: "https://discord.gg/occaz" },
  { key: "github", label: "GitHub", Icon: Github, placeholder: "https://github.com/occaz" },
  { key: "website", label: "Website", Icon: Globe, placeholder: "https://occaz.app" },
];

/**
 * Turn a raw user-entered value into a full URL.
 * - "https://x.com/foo"  -> unchanged
 * - "x.com/foo"          -> "https://x.com/foo"
 * - "@occaz"             -> "https://x.com/occaz" (using the platform base)
 * - "occaz"              -> "https://x.com/occaz"
 */
export function normalizeSocialUrl(
  raw: string,
  base?: string,
): string {
  const v = raw.trim();
  if (!v) return "";
  if (/^(https?:)?\/\//i.test(v) || v.startsWith("mailto:") || v.startsWith("tel:")) {
    return v.startsWith("http") ? v : `https:${v}`;
  }
  if (base) {
    if (v.startsWith("@")) return base + v.slice(1);
    return base + v;
  }
  return `https://${v}`;
}

/**
 * Renders the brand's social links as icon buttons.
 * Only renders links that are actually set — no dead "#" placeholders.
 */
export function BrandSocialLinks({
  size = "md",
  className = "",
  showLabel = false,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}) {
  const brand = useBranding();
  const links = brand.social_links || {};

  const active = SOCIAL_PLATFORMS.filter((p) => {
    const v = (links as any)[p.key];
    return typeof v === "string" && v.trim().length > 0;
  });

  if (active.length === 0) return null;

  const box =
    size === "lg"
      ? "h-11 w-11"
      : size === "sm"
      ? "h-8 w-8"
      : "h-9 w-9";
  const icon = size === "lg" ? "h-5 w-5" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className={clsx("flex flex-wrap items-center gap-3", className)}>
      {active.map((p) => {
        const href = normalizeSocialUrl((links as any)[p.key], p.base);
        return (
          <a
            key={p.key}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            title={p.label}
            aria-label={p.label}
            className={clsx(
              "grid place-items-center rounded-full bg-[var(--bg-card-hover)] text-[var(--text-secondary)] ring-1 ring-[var(--border-default)] transition hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]",
              box,
            )}
          >
            <p.Icon className={icon} />
          </a>
        );
      })}
    </div>
  );
}
