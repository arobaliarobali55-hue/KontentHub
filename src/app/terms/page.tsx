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
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Terms of Service</h1>
            <p className="text-sm text-muted-foreground mb-8">Last Updated: June 28, 2026</p>
            
            <div className="space-y-8 text-muted-foreground">
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
                <p>
                  Welcome to <strong>KontentHub</strong>. By accessing or using <strong>https://www.kontenthub.xyz</strong>, you agree to be bound by these Terms of Service. If you do not agree with these terms, please do not use our platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">2. About KontentHub</h2>
                <p>
                  KontentHub is an AI-powered platform that helps users create, manage, and publish LinkedIn content. Features may include AI-generated posts, AI-generated images, article importing, scheduling, analytics, and LinkedIn integration.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">3. Eligibility</h2>
                <p>You must be at least <strong>13 years old</strong> to use KontentHub.</p>
                <p className="mt-2">
                  By using our services, you confirm that you have the legal authority to enter into these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">4. User Accounts</h2>
                <p>You are responsible for:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Keeping your account secure.</li>
                  <li>Maintaining the confidentiality of your login credentials.</li>
                  <li>All activities that occur under your account.</li>
                  <li>Providing accurate information.</li>
                </ul>
                <p className="mt-2">Notify us immediately if you believe your account has been compromised.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">5. Subscription & Payments</h2>
                <p>Some features are available only through a paid <strong>Pro</strong> subscription.</p>
                <p className="mt-2">By purchasing a subscription, you agree to:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Pay all applicable fees.</li>
                  <li>Allow recurring billing where applicable.</li>
                  <li>Understand that subscription fees are non-refundable unless required by law.</li>
                </ul>
                <p className="mt-2">
                  We may change pricing at any time. Existing subscribers will be notified before any pricing changes take effect.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">6. AI-Generated Content</h2>
                <p>KontentHub uses artificial intelligence to generate content and images.</p>
                <p className="mt-2">You acknowledge that:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>AI-generated content may contain inaccuracies.</li>
                  <li>You are responsible for reviewing all content before publishing.</li>
                  <li>We do not guarantee factual accuracy or originality.</li>
                  <li>You are responsible for ensuring compliance with LinkedIn's policies and applicable laws.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">7. LinkedIn Integration</h2>
                <p>If you connect your LinkedIn account:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>You authorize KontentHub to access your LinkedIn account as permitted by you.</li>
                  <li>We only perform actions you explicitly authorize.</li>
                  <li>You may disconnect your LinkedIn account at any time.</li>
                </ul>
                <p className="mt-2">You remain solely responsible for anything published through your LinkedIn account.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">8. Acceptable Use</h2>
                <p>You agree not to:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Violate any applicable laws.</li>
                  <li>Upload malicious software or harmful code.</li>
                  <li>Attempt unauthorized access to our systems.</li>
                  <li>Abuse or interfere with our services.</li>
                  <li>Generate illegal, fraudulent, defamatory, or harmful content.</li>
                  <li>Infringe on intellectual property rights.</li>
                  <li>Reverse engineer or misuse the platform.</li>
                </ul>
                <p className="mt-2">Violation of these rules may result in account suspension or termination.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">9. Intellectual Property</h2>
                <p>
                  KontentHub, including its software, branding, logos, and website content, is owned by KontentHub and protected by applicable intellectual property laws.
                </p>
                <p className="mt-2">You retain ownership of the content you create using the platform.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">10. Service Availability</h2>
                <p>
                  We strive to keep KontentHub available at all times, but we do not guarantee uninterrupted service.
                </p>
                <p className="mt-2">
                  We may update, modify, suspend, or discontinue features without prior notice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">11. Disclaimer of Warranties</h2>
                <p>
                  KontentHub is provided <strong>"as is"</strong> and <strong>"as available."</strong>
                </p>
                <p className="mt-2">We make no warranties regarding:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Continuous availability</li>
                  <li>Accuracy of AI-generated content</li>
                  <li>Fitness for a particular purpose</li>
                  <li>Error-free operation</li>
                  <li>Compatibility with all devices or browsers</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">12. Limitation of Liability</h2>
                <p>
                  To the fullest extent permitted by law, KontentHub and its owners shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform.
                </p>
                <p className="mt-2">
                  Our total liability shall not exceed the amount you paid for the service during the twelve (12) months preceding the claim.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">13. Termination</h2>
                <p>We reserve the right to suspend or terminate your account if you:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Violate these Terms.</li>
                  <li>Abuse the platform.</li>
                  <li>Engage in fraudulent or illegal activities.</li>
                </ul>
                <p className="mt-2">You may stop using the service and delete your account at any time.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">14. Changes to These Terms</h2>
                <p>We may update these Terms of Service from time to time.</p>
                <p className="mt-2">
                  When changes are made, the updated version will be published on this page with a revised <strong>Last Updated</strong> date.
                </p>
                <p className="mt-2">
                  Your continued use of KontentHub after changes become effective constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">15. Governing Law</h2>
                <p>
                  These Terms shall be governed by and interpreted in accordance with the applicable laws of your jurisdiction, without regard to conflict of law principles.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">16. Contact Us</h2>
                <p>If you have any questions regarding these Terms of Service, please contact us:</p>
                <p className="mt-4">
                  <strong>Email:</strong> <a href="mailto:help.kontenthub@gmail.com" className="text-primary hover:underline">help.kontenthub@gmail.com</a>
                </p>
                <p className="mt-2">
                  <strong>Website:</strong> <a href="https://www.kontenthub.xyz" className="text-primary hover:underline">https://www.kontenthub.xyz</a>
                </p>
              </section>

              <div className="mt-12 pt-6 border-t text-center text-muted-foreground">
                <p>By using <strong>KontentHub</strong>, you acknowledge that you have read, understood, and agreed to these Terms of Service.</p>
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
