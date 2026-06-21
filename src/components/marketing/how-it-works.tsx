import { Container } from "@/components/layout/container";

const STEPS = [
  {
    number: "01",
    title: "Create your account",
    description:
      "Sign up in seconds with email or Google. Free forever — no credit card required to start.",
  },
  {
    number: "02",
    title: "Connect your LinkedIn",
    description:
      "Paste your profile URL. Our AI analyzes your background, industry, and personal brand.",
  },
  {
    number: "03",
    title: "Generate content",
    description:
      "Pick a topic and tone. Get a polished post with a hook, CTA, and hashtags in seconds.",
  },
  {
    number: "04",
    title: "Edit and publish",
    description:
      "Tweak anything, copy to clipboard, save it for later, or export. Stay consistent without the grind.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-b border-border bg-surface-page py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            From idea to post in four steps
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Set up once, then create authentic content in minutes — every time.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div key={step.number} className="relative">
              <div className="rounded-xl border border-border bg-background p-6 shadow-premium-sm">
                <div className="text-sm font-bold text-brand">{step.number}</div>
                <h3 className="mt-3 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
              {index < STEPS.length - 1 && (
                <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-border lg:block">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
