import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Container } from "@/components/layout/container";
import { BreadcrumbSchema } from "@/components/schema";

export const metadata: Metadata = {
  title: "How it works",
  description: "Learn how KontentHub helps you create authentic LinkedIn content in four simple steps.",
  alternates: {
    canonical: "/how-it-works",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "How it works · KontentHub",
    description: "Learn how KontentHub helps you create authentic LinkedIn content in four simple steps.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "How it works · KontentHub",
    description: "Learn how KontentHub helps you create authentic LinkedIn content in four simple steps.",
  },
};

export default function HowItWorksPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Container className="py-20">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">How it works</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From idea to post in four simple steps
            </p>
          </div>
          <HowItWorks />
        </Container>
      </main>
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "How it works", url: "/how-it-works" }
      ]} />
      <Footer />
    </>
  );
}
