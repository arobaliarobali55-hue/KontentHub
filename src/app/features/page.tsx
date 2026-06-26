import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Features } from "@/components/marketing/features";
import { Container } from "@/components/layout/container";
import { BreadcrumbSchema } from "@/components/schema";

export const metadata: Metadata = {
  title: "Features",
  description: "Discover all the powerful features KontentHub offers to help you create authentic LinkedIn content.",
  alternates: {
    canonical: "/features",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Features · KontentHub",
    description: "Discover all the powerful features KontentHub offers to help you create authentic LinkedIn content.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Features · KontentHub",
    description: "Discover all the powerful features KontentHub offers to help you create authentic LinkedIn content.",
  },
};

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Container className="py-20">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create amazing LinkedIn content in minutes
            </p>
          </div>
          <Features />
        </Container>
      </main>
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "Features", url: "/features" }
      ]} />
      <Footer />
    </>
  );
}
