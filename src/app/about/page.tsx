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
            
            <div className="space-y-8">
              <section className="space-y-4">
                <p className="text-lg text-muted-foreground">
                  KontentHub is an AI-powered platform that helps professionals, founders, creators, and marketers create high-quality LinkedIn content faster.
                </p>
                <p className="text-lg text-muted-foreground">
                  Our mission is simple: make consistent LinkedIn content creation effortless without sacrificing authenticity.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-bold">With KontentHub you can:</h2>
                <ul className="list-disc list-inside space-y-2 text-lg text-muted-foreground">
                  <li>Generate professional LinkedIn posts</li>
                  <li>Create AI-powered cover images</li>
                  <li>Import articles and turn them into engaging posts</li>
                  <li>Organize your content history</li>
                  <li>Publish directly to LinkedIn</li>
                  <li>Improve your personal brand with AI assistance</li>
                </ul>
                <p className="text-lg text-muted-foreground">
                  We believe creating valuable content should take minutes—not hours.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-bold">Our Mission</h2>
                <p className="text-lg text-muted-foreground">
                  Help professionals grow their personal brand through high-quality AI-assisted content.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-bold">Contact</h2>
                <p className="text-lg text-muted-foreground">
                  Email: help.kontenthub@gmail.com
                </p>
                <p className="text-lg text-muted-foreground">
                  Website: <a href="https://www.kontenthub.xyz" className="text-primary hover:underline" target="_blank" rel="noreferrer">https://www.kontenthub.xyz</a>
                </p>
              </section>
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
