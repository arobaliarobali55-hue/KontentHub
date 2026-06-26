import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { BreadcrumbSchema } from "@/components/schema";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about KontentHub and our mission to help professionals build their personal brand on LinkedIn.",
  alternates: {
    canonical: "/about",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "About · KontentHub",
    description: "Learn about KontentHub and our mission to help professionals build their personal brand on LinkedIn.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About · KontentHub",
    description: "Learn about KontentHub and our mission to help professionals build their personal brand on LinkedIn.",
  },
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Container className="py-20">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">About KontentHub</h1>
            <div className="space-y-6 text-lg text-muted-foreground">
              <p>
                KontentHub was born from a simple idea: professionals should focus on their expertise, not on writing social media posts.
              </p>
              <p>
                We believe that everyone has unique insights to share, and AI should help amplify that voice, not replace it.
              </p>
              <p>
                Our mission is to make LinkedIn content creation effortless, authentic, and effective for every professional.
              </p>
            </div>
          </div>
        </Container>
      </main>
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "About", url: "/about" }
      ]} />
      <Footer />
    </>
  );
}
