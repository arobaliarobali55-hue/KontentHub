import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";

/**
 * Early Access Announcement Banner
 *
 * Configured for KontentHub's pre-launch phase (10–15 day window).
 * Easy to update, customize, or remove once the next launch is live.
 */
export const EARLY_ACCESS_CONFIG = {
  badge: "EARLY ACCESS",
  title: "Early Access — We're Preparing Something Better!",
  description:
    "KontentHub is currently being improved with new features and a smoother experience. We're preparing for our next launch. Stay tuned for updates!",
  paymentSuspension: {
    title: "⚠️ Payments Temporarily Unavailable",
    description:
      "We're sorry for the inconvenience! Our payment system is currently under maintenance. Please do not make any payments or purchase a subscription for the time being. We're working hard to fix the issue and will restore payments as soon as possible. Thank you for your patience and understanding.",
  },
  // Valid social media URL configured in schema / organization metadata:
  cta: {
    label: "Follow Us for Updates",
    href: "https://www.linkedin.com/company/kontenthub-ai/",
  },
};

export function EarlyAccessBanner() {
  return (
    <aside
      role="region"
      aria-label="Early Access Announcement"
      className="relative z-40 border-b border-border bg-gradient-to-r from-brand-soft/50 via-background to-brand-soft/40 py-3 sm:py-3.5"
    >
      <Container>
        <div className="flex flex-col gap-3">
          {/* Main banner row */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Badge & copy */}
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand ring-1 ring-inset ring-brand/25 dark:bg-brand/20">
                <span className="size-1.5 rounded-full bg-brand animate-pulse" />
                {EARLY_ACCESS_CONFIG.badge}
              </span>

              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-left">
                <span className="text-xs sm:text-sm font-semibold text-foreground">
                  {EARLY_ACCESS_CONFIG.title}
                </span>
                <span className="hidden text-muted-foreground/60 sm:inline">·</span>
                <p className="text-xs sm:text-sm text-muted-foreground leading-normal">
                  {EARLY_ACCESS_CONFIG.description}
                </p>
              </div>
            </div>

            {/* Social CTA (uses verified LinkedIn organization URL) */}
            {EARLY_ACCESS_CONFIG.cta.href && (
              <div className="flex shrink-0 items-center pt-1 md:pt-0">
                <a
                  href={EARLY_ACCESS_CONFIG.cta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-premium-sm transition-all hover:bg-muted hover:border-brand/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span>{EARLY_ACCESS_CONFIG.cta.label}</span>
                  <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </a>
              </div>
            )}
          </div>

          {/* Payment Suspension Notice Callout */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 sm:px-4 sm:py-3 dark:border-amber-400/25 dark:bg-amber-400/10">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
              <span className="text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-200 shrink-0">
                {EARLY_ACCESS_CONFIG.paymentSuspension.title}
              </span>
              <p className="text-xs sm:text-sm leading-relaxed text-foreground/90 dark:text-amber-100/90">
                {EARLY_ACCESS_CONFIG.paymentSuspension.description}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </aside>
  );
}
