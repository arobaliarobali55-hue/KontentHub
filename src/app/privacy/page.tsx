import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { BreadcrumbSchema } from "@/components/schema";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn about how KontentHub collects, uses, and protects your data.",
  alternates: {
    canonical: "/privacy",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Privacy Policy · KontentHub",
    description: "Learn about how KontentHub collects, uses, and protects your data.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy · KontentHub",
    description: "Learn about how KontentHub collects, uses, and protects your data.",
  },
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Container className="py-20">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">Privacy Policy</h1>
            <div className="space-y-6 text-lg text-muted-foreground">
              <p>
                Your privacy is important to us. This Privacy Policy explains how KontentHub collects, uses, and protects your personal information when you use our platform.
              </p>
              {/* Add your full privacy policy content here */}
              <div className="text-center py-12 text-muted-foreground">
                <p>Full privacy policy content coming soon!</p>
                <p className="mt-2">For questions, contact us at help.kontenthub@gmail.com</p>
              </div>
            </div>
          </div>
        </Container>
      </main>
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "Privacy", url: "/privacy" }
      ]} />
      <Footer />
    </>
  );
}
