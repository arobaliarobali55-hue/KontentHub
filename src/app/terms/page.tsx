import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { BreadcrumbSchema } from "@/components/schema";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the terms and conditions for using KontentHub.",
  alternates: {
    canonical: "/terms",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Terms of Service · KontentHub",
    description: "Read the terms and conditions for using KontentHub.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service · KontentHub",
    description: "Read the terms and conditions for using KontentHub.",
  },
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Container className="py-20">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">Terms of Service</h1>
            <div className="space-y-6 text-lg text-muted-foreground">
              <p>
                Welcome to KontentHub! By using our platform, you agree to these Terms of Service. Please read them carefully.
              </p>
              {/* Add your full terms content here */}
              <div className="text-center py-12 text-muted-foreground">
                <p>Full terms of service content coming soon!</p>
                <p className="mt-2">For questions, contact us at help.kontenthub@gmail.com</p>
              </div>
            </div>
          </div>
        </Container>
      </main>
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "Terms", url: "/terms" }
      ]} />
      <Footer />
    </>
  );
}
