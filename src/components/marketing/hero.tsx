import Link from "next/link";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      {/* Restrained grid backdrop fading into white */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />

      <Container className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-premium-sm">
            <Sparkles className="size-3.5 text-brand" />
            Trained on your LinkedIn profile — not a generic prompt
          </div>

          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-6xl">
            LinkedIn content that
            <br className="hidden sm:block" /> sounds like{" "}
            <span className="text-brand">you</span>.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            KontentHub learns your professional brand and generates posts
            tailored to your voice, industry, and goals — no prompting required.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}
            >
              Start free
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#how"
              className={buttonVariants({ size: "lg", variant: "outline", className: "w-full sm:w-auto" })}
            >
              See how it works
            </Link>
          </div>

          <p className="mt-5 text-sm text-muted-foreground">
            Free forever · No credit card · {`4 free posts every week`}
          </p>
        </div>

        {/* Mock preview card */}
        <HeroPreview />
      </Container>
    </section>
  );
}

/** A tasteful product mock — no fake screenshots, just a styled representation. */
function HeroPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-3xl">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-premium-lg sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="size-10 rounded-full bg-brand/15 ring-2 ring-brand/20" />
          <div>
            <div className="h-3 w-28 rounded-full bg-foreground/80" />
            <div className="mt-1.5 h-2 w-40 rounded-full bg-muted-foreground/40" />
          </div>
        </div>
        <div className="space-y-2.5">
          <div className="h-3 w-full rounded-full bg-foreground/70" />
          <div className="h-3 w-[95%] rounded-full bg-foreground/30" />
          <div className="h-3 w-[88%] rounded-full bg-foreground/30" />
          <div className="h-3 w-[92%] rounded-full bg-foreground/30" />
          <div className="h-3 w-[60%] rounded-full bg-foreground/30" />
        </div>
        <div className="mt-5 flex gap-2">
          {["#leadership", "#startups", "#building"].map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-brand-soft px-2 py-1 text-xs font-medium text-brand"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      {/* Floating "generated" badge */}
      <div className="absolute -right-3 -top-3 hidden rounded-xl border border-border bg-background px-3 py-2 shadow-premium sm:block">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-success" />
          Generated in 4.2s
        </div>
      </div>
    </div>
  );
}
