import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { BreadcrumbSchema } from "@/components/schema";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the KontentHub team and help build the future of AI-powered content creation.",
  alternates: {
    canonical: "/careers",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Careers · KontentHub",
    description: "Join the KontentHub team and help build the future of AI-powered content creation.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Careers · KontentHub",
    description: "Join the KontentHub team and help build the future of AI-powered content creation.",
  },
};

export default function CareersPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Container className="py-20">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">Careers at KontentHub</h1>
            
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground">
                We're building the future of AI-powered content creation.
              </p>
              
              <p className="text-lg text-muted-foreground">
                Although we are not actively hiring at the moment, we're always interested in meeting talented people who are passionate about AI, design, software engineering, product development, and marketing.
              </p>
              
              <p className="text-lg text-muted-foreground">
                If you'd like to work with us in the future, send your resume and portfolio to:
              </p>
              
              <p className="text-lg font-medium text-primary">
                help.kontenthub@gmail.com
              </p>
              
              <p className="text-lg text-muted-foreground">
                We'll reach out if a suitable opportunity becomes available.
              </p>
            </div>
          </div>
        </Container>
      </main>
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "Careers", url: "/careers" }
      ]} />
      <Footer />
    </>
  );
}
