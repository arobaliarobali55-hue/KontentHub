import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { BreadcrumbSchema } from "@/components/schema";

export const metadata: Metadata = {
  title: "Blog",
  description: "Tips, tricks, and insights for creating better LinkedIn content.",
  alternates: {
    canonical: "/blog",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Blog · KontentHub",
    description: "Tips, tricks, and insights for creating better LinkedIn content.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog · KontentHub",
    description: "Tips, tricks, and insights for creating better LinkedIn content.",
  },
};

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Container className="py-20">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to the KontentHub Blog</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Discover practical guides, AI writing tips, LinkedIn growth strategies, product updates, and tutorials designed to help you build your personal brand.
              </p>
            </div>
            
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Topics include:</h2>
              <ul className="list-disc list-inside space-y-2 text-lg text-muted-foreground">
                <li>LinkedIn Growth</li>
                <li>AI Content Creation</li>
                <li>Personal Branding</li>
                <li>Marketing Tips</li>
                <li>Product Updates</li>
                <li>Tutorials</li>
              </ul>
              <p className="text-lg text-muted-foreground mt-4">
                New articles are published regularly.
              </p>
            </section>
            
            <div className="text-center py-12 text-muted-foreground">
              Stay tuned for new content!
            </div>
          </div>
        </Container>
      </main>
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "Blog", url: "/blog" }
      ]} />
      <Footer />
    </>
  );
}
