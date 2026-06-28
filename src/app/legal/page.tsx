import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { BreadcrumbSchema } from "@/components/schema";

export const metadata: Metadata = {
  title: "Legal",
  description: "Legal information and resources for KontentHub.",
  alternates: {
    canonical: "/legal",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Legal · KontentHub",
    description: "Legal information and resources for KontentHub.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Legal · KontentHub",
    description: "Legal information and resources for KontentHub.",
  },
};

export default function LegalPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Container className="py-20">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">Legal</h1>
            <div className="space-y-6 text-lg text-muted-foreground">
              <p>
                Find legal information and resources related to KontentHub here.
              </p>
              <div className="grid gap-4 mt-8">
                <a href="/privacy" className="text-primary hover:underline font-medium">
                  Privacy Policy →
                </a>
                <a href="/terms" className="text-primary hover:underline font-medium">
                  Terms of Service →
                </a>
                <a href="/security" className="text-primary hover:underline font-medium">
                  Security →
                </a>
              </div>
              <div className="text-center py-12 text-muted-foreground">
                <p>For additional legal questions, contact us at help.kontenthub@gmail.com</p>
              </div>
            </div>
          </div>
        </Container>
      </main>
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "Legal", url: "/legal" }
      ]} />
      <Footer />
    </>
  );
}
