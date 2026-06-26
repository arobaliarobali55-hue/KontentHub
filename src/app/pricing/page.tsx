import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Pricing } from "@/components/marketing/pricing";
import { Container } from "@/components/layout/container";
import { BreadcrumbSchema, FAQSchema } from "@/components/schema";

const faqs = [
  {
    question: "Is there a free plan?",
    answer: "Yes, we offer a free plan that includes basic features to get you started with LinkedIn content creation."
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer: "Absolutely! You can upgrade or downgrade your plan at any time directly from your account settings."
  },
  {
    question: "Do you offer a refund policy?",
    answer: "We offer a 14-day money-back guarantee on all paid plans. If you're not satisfied, contact our support team for a full refund."
  }
];

export const metadata: Metadata = {
  title: "Pricing",
  description: "Choose the perfect plan for your LinkedIn content creation needs.",
  alternates: {
    canonical: "/pricing",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Pricing · KontentHub",
    description: "Choose the perfect plan for your LinkedIn content creation needs.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing · KontentHub",
    description: "Choose the perfect plan for your LinkedIn content creation needs.",
  },
};

export default function PricingPage() {

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Container className="py-20">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple Pricing</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start for free, upgrade when you are ready
            </p>
          </div>
          <Pricing />
        </Container>
      </main>
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: "Pricing", url: "/pricing" }
      ]} />
      <FAQSchema faqs={faqs} />
      <Footer />
    </>
  );
}
