import { Container } from "@/components/layout/container";
import { Check, X } from "lucide-react";

const PROBLEMS = [
  "Not knowing what to write",
  "Spending hours drafting a single post",
  "Inconsistent voice across posts",
  "Losing reach from posting irregularly",
];

export function ProblemSolution() {
  return (
    <section className="border-b border-border bg-surface-page py-20 sm:py-24">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Problem */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand">
              The problem
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Creating quality LinkedIn content consistently is hard.
            </h2>
            <ul className="mt-8 space-y-4">
              {PROBLEMS.map((problem) => (
                <li
                  key={problem}
                  className="flex items-start gap-3 text-muted-foreground"
                >
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
                    <X className="size-3" />
                  </span>
                  <span className="text-base">{problem}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 rounded-xl border border-border bg-background p-5 text-sm leading-relaxed text-muted-foreground">
              Generic AI writers make it worse — they ask for detailed prompts
              and produce content that doesn&rsquo;t reflect your personal
              brand.
            </p>
          </div>

          {/* Solution */}
          <div className="rounded-2xl border border-border bg-background p-8 shadow-premium sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand">
              The KontentHub way
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              We learn about you first. Then we write like you.
            </h3>
            <p className="mt-4 text-muted-foreground">
              Connect your LinkedIn profile once. KontentHub studies your
              industry, experience, and voice — then every post feels like you
              wrote it yourself.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "No prompts — just a topic",
                "Content matched to your tone and goals",
                "Hooks, CTAs, and hashtags included",
                "Optional AI cover images",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-foreground"
                >
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/15 text-success">
                    <Check className="size-3" />
                  </span>
                  <span className="text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
