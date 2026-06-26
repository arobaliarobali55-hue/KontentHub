import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { BreadcrumbSchema } from "@/components/schema";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Learn how to use KontentHub effectively with our comprehensive documentation.",
  alternates: {
    canonical: "/docs",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Documentation · KontentHub",
    description: "Learn how to use KontentHub effectively with our comprehensive documentation.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Documentation · KontentHub",
    description: "Learn how to use KontentHub effectively with our comprehensive documentation.",
  },
};

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Container className="py-20">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Documentation</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to get started
            </p>
          </div>
          <div className="text-center py-20 text-muted-foreground">
            Documentation coming soon!
          </div>
        </Container>
      </main>
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "Documentation", url: "/docs" }
      ]} />
      <Footer />
    </>
  );
}
