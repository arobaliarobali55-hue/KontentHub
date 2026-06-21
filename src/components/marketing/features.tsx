import { Container } from "@/components/layout/container";
import {
  UserCheck,
  Wand2,
  Image as ImageIcon,
  History,
  Hash,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: UserCheck,
    title: "Profile-based personalization",
    description:
      "We analyze your LinkedIn profile to understand your industry, experience, and unique voice — so every post is unmistakably yours.",
  },
  {
    icon: Wand2,
    title: "One-click generation",
    description:
      "Give a topic and pick a tone. Get a complete post with a hook, body, CTA, title, and hashtags — ready in seconds.",
  },
  {
    icon: Hash,
    title: "Six writing styles",
    description:
      "Professional, Founder, Storytelling, Educational, Corporate, or Thought Leadership. Match the style to the moment.",
  },
  {
    icon: ImageIcon,
    title: "AI cover images",
    description:
      "Generate a professional, on-brand cover image for any post and download it as a PNG. Pro feature.",
  },
  {
    icon: History,
    title: "Full post history",
    description:
      "Every post is saved automatically. Search, filter, duplicate, or export anything you've created.",
  },
  {
    icon: Zap,
    title: "Built for speed",
    description:
      "Pages load in under two seconds. AI responses in under fifteen. No friction between idea and publish.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-b border-border bg-background py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Everything you need to post with confidence
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A focused toolkit that removes every excuse for not posting.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-premium"
            >
              <div className="grid size-11 place-items-center rounded-lg bg-brand-soft text-brand">
                <feature.icon className="size-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
