import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * KontentHub wordmark + mark.
 * The mark is a simple indigo "stack of content layers" glyph —
 * deliberate, geometric, no AI-design clichés.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-grid size-8 place-items-center rounded-lg bg-brand text-brand-foreground shadow-premium-sm",
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="size-5"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 7h12" />
        <path d="M4 12h16" opacity={0.9} />
        <path d="M4 17h9" opacity={0.7} />
      </svg>
    </span>
  );
}

export function Logo({
  className,
  href = "/",
  showWordmark = true,
}: {
  className?: string;
  href?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 font-semibold tracking-tight",
        className,
      )}
    >
      <LogoMark />
      {showWordmark && (
        <span className="text-base text-foreground">KontentHub</span>
      )}
    </Link>
  );
}
