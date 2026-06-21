import Link from "next/link";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="bg-surface-page py-20 sm:py-24">
      <Container size="narrow">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-background px-6 py-14 text-center shadow-premium sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Start posting like the best creators do
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
            Join the professionals turning their expertise into content that
            grows their brand — without the writer&rsquo;s block.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/sign-up"
              className={buttonVariants({ size: "lg" })}
            >
              Get started free
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
