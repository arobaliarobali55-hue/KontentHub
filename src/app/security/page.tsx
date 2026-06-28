import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { BreadcrumbSchema } from "@/components/schema";

export const metadata: Metadata = {
  title: "Security",
  description: "Learn about KontentHub's security practices and how we protect your data.",
  alternates: {
    canonical: "/security",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Security · KontentHub",
    description: "Learn about KontentHub's security practices and how we protect your data.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Security · KontentHub",
    description: "Learn about KontentHub's security practices and how we protect your data.",
  },
};

export default function SecurityPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Container className="py-20">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">Security</h1>
            <div className="space-y-6 text-lg text-muted-foreground">
              <p>
                At KontentHub, we take security seriously. Your data is protected using industry-standard security practices and protocols.
              </p>
              {/* Add your full security content here */}
              <div className="text-center py-12 text-muted-foreground">
                <p>Full security information coming soon!</p>
                <p className="mt-2">For questions, contact us at help.kontenthub@gmail.com</p>
              </div>
            </div>
          </div>
        </Container>
      </main>
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "Security", url: "/security" }
      ]} />
      <Footer />
    </>
  );
}
