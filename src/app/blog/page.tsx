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
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Learn how to grow your LinkedIn presence
            </p>
          </div>
          <div className="text-center py-20 text-muted-foreground">
            Blog content coming soon!
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
