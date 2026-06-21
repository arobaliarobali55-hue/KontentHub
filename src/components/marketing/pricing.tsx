import Link from "next/link";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section id="pricing" className="border-b border-border bg-background py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free. Upgrade when you&rsquo;re ready to go all in.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 lg:grid-cols-2">
          {Object.values(PLANS).map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-8",
                plan.highlighted
                  ? "border-brand/40 shadow-premium-lg ring-1 ring-brand/20"
                  : "border-border shadow-premium-sm",
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-8 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground">
                  Most popular
                </span>
              )}

              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-4xl font-semibold tracking-tight text-foreground">
                    ${plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    /{plan.cadence}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-foreground"
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
                        plan.highlighted
                          ? "bg-brand text-brand-foreground"
                          : "bg-success/15 text-success",
                      )}
                    >
                      <Check className="size-3" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={buttonVariants({ 
                  size: "lg", 
                  variant: plan.highlighted ? "default" : "outline",
                  className: "mt-8 w-full"
                })}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Plans include secure checkout. Cancel anytime.
        </p>
      </Container>
    </section>
  );
}
