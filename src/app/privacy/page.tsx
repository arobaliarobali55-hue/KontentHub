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
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground mb-8">Last Updated: June 28, 2026</p>
            
            <div className="space-y-8 text-muted-foreground">
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">1. Introduction</h2>
                <p>
                  Welcome to <strong>KontentHub</strong> ("KontentHub", "we", "our", or "us").
                </p>
                <p className="mt-2">
                  Your privacy is important to us. This Privacy Policy explains what information we collect, how we use it, and the choices you have regarding your data when using <strong>https://www.kontenthub.xyz</strong>.
                </p>
                <p className="mt-2">
                  By using KontentHub, you agree to this Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">2. Information We Collect</h2>
                <p>We may collect the following information:</p>
                <div className="mt-4 space-y-6">
                  <div>
                    <h3 className="font-semibold text-foreground">Account Information</h3>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Name</li>
                      <li>Email address</li>
                      <li>Profile picture</li>
                      <li>Authentication information provided through Clerk</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground">Connected Accounts</h3>
                    <p className="mt-2">If you connect your LinkedIn account, we may collect:</p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      <li>LinkedIn profile information</li>
                      <li>LinkedIn user ID</li>
                      <li>Access tokens (stored securely)</li>
                      <li>Permissions required to publish content</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground">Content You Create</h3>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Generated posts</li>
                      <li>Drafts</li>
                      <li>AI-generated images</li>
                      <li>Imported article URLs</li>
                      <li>Uploaded images</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground">Usage Information</h3>
                    <p className="mt-2">We automatically collect:</p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      <li>Device information</li>
                      <li>Browser type</li>
                      <li>IP address</li>
                      <li>Pages visited</li>
                      <li>Feature usage</li>
                      <li>Error logs</li>
                      <li>Analytics</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">3. How We Use Your Information</h2>
                <p>We use your information to:</p>
                <ul className="list-disc list-inside space-y-1 mt-3">
                  <li>Provide our services</li>
                  <li>Generate AI content</li>
                  <li>Publish posts to LinkedIn (with your permission)</li>
                  <li>Improve our AI features</li>
                  <li>Provide customer support</li>
                  <li>Detect fraud and abuse</li>
                  <li>Improve platform performance</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">4. AI Services</h2>
                <p>When you use AI features:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Your prompts may be processed by third-party AI providers.</li>
                  <li>AI-generated responses may not always be accurate.</li>
                  <li>You are responsible for reviewing generated content before publishing.</li>
                </ul>
                <p className="mt-2">These services have their own privacy policies.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">6. Cookies</h2>
                <p>We use cookies and similar technologies to:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Keep you signed in</li>
                  <li>Remember your preferences</li>
                  <li>Improve performance</li>
                  <li>Measure analytics</li>
                  <li>Enhance security</li>
                </ul>
                <p className="mt-2">
                  You can disable cookies through your browser settings, although some features may not function properly.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">7. Data Security</h2>
                <p>We use industry-standard security practices to protect your information.</p>
                <p className="mt-2">
                  While we strive to safeguard your data, no internet transmission or electronic storage method is completely secure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">8. Data Retention</h2>
                <p>We retain your information only for as long as necessary to:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Provide our services</li>
                  <li>Meet legal obligations</li>
                  <li>Resolve disputes</li>
                  <li>Enforce our agreements</li>
                </ul>
                <p className="mt-2">You may request deletion of your account at any time.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">9. Your Rights</h2>
                <p>Depending on your location, you may have the right to:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Access your data</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your account</li>
                  <li>Export your data</li>
                  <li>Withdraw consent</li>
                  <li>Request information about how your data is used</li>
                </ul>
                <p className="mt-2">To exercise these rights, contact us.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">10. Children's Privacy</h2>
                <p>KontentHub is not intended for children under 13 years of age.</p>
                <p className="mt-2">We do not knowingly collect personal information from children.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">11. Changes to This Policy</h2>
                <p>We may update this Privacy Policy from time to time.</p>
                <p className="mt-2">
                  When changes are made, the updated version will be posted on this page with a revised "Last Updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">12. Contact Us</h2>
                <p>If you have any questions about this Privacy Policy or your personal data, please contact us:</p>
                <p className="mt-4">
                  <strong>Email:</strong> <a href="mailto:help.kontenthub@gmail.com" className="text-primary hover:underline">help.kontenthub@gmail.com</a>
                </p>
                <p className="mt-2">
                  <strong>Website:</strong> <a href="https://www.kontenthub.xyz" className="text-primary hover:underline">https://www.kontenthub.xyz</a>
                </p>
              </section>

              <div className="mt-12 pt-6 border-t text-center text-muted-foreground">
                <p><strong>Thank you for trusting KontentHub. We are committed to protecting your privacy and providing a secure experience.</strong></p>
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
