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
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Security</h1>
            <p className="text-sm text-muted-foreground mb-8">Last Updated: June 28, 2026</p>
            
            <div className="space-y-8 text-muted-foreground">
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">Our Commitment to Security</h2>
                <p>
                  At KontentHub, protecting your data is one of our highest priorities. We implement modern security practices to help keep your account and information safe.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">Account Security</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>Secure authentication powered by Clerk.</li>
                  <li>Passwords are never stored by KontentHub.</li>
                  <li>Support for secure OAuth sign-in providers.</li>
                  <li>Session protection and secure account management.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">Data Encryption</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>All data transmitted between your browser and our servers is encrypted using HTTPS (TLS).</li>
                  <li>Sensitive information is encrypted while in transit.</li>
                  <li>API credentials and secrets are stored securely as environment variables.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">LinkedIn Security</h2>
                <p>When you connect your LinkedIn account:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>We only request the permissions required for approved features.</li>
                  <li>Access tokens are stored securely on the server.</li>
                  <li>We never ask for or store your LinkedIn password.</li>
                  <li>You can disconnect your LinkedIn account at any time.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">AI & Third-Party Services</h2>
                <p>KontentHub integrates with trusted third-party providers, including:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Clerk (Authentication)</li>
                  <li>Firebase</li>
                  <li>Cloudinary</li>
                  <li>NVIDIA AI</li>
                  <li>LinkedIn API</li>
                  <li>Google Analytics</li>
                  <li>Vercel</li>
                  <li>Pexels</li>
                </ul>
                <p className="mt-2">Each provider maintains its own security practices and privacy policies.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">Infrastructure Security</h2>
                <p>We use modern cloud infrastructure designed to provide:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Secure hosting</li>
                  <li>Encrypted connections</li>
                  <li>Continuous monitoring</li>
                  <li>Regular software updates</li>
                  <li>Access controls for sensitive services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">Data Protection</h2>
                <p>We work to protect user information by:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Limiting access to sensitive data.</li>
                  <li>Following the principle of least privilege.</li>
                  <li>Monitoring for suspicious activity.</li>
                  <li>Regularly updating dependencies and security patches.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">Responsible Disclosure</h2>
                <p>
                  If you discover a security vulnerability in KontentHub, please report it responsibly.
                </p>
                <p className="mt-2">Please include:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>A description of the issue</li>
                  <li>Steps to reproduce</li>
                  <li>Screenshots (if applicable)</li>
                  <li>Potential impact</li>
                </ul>
                <p className="mt-2">
                  We appreciate responsible disclosure and will investigate reported issues as quickly as possible.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">Security Best Practices</h2>
                <p>To help protect your account, we recommend that you:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Use a strong, unique password for your authentication provider.</li>
                  <li>Keep your email account secure.</li>
                  <li>Do not share your login credentials.</li>
                  <li>Sign out when using shared devices.</li>
                  <li>Be cautious of phishing attempts.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-3">Contact</h2>
                <p>
                  If you believe you've found a security issue or have security-related questions, please contact us:
                </p>
                <p className="mt-4">
                  <strong>Email:</strong> <a href="mailto:help.kontenthub@gmail.com" className="text-primary hover:underline">help.kontenthub@gmail.com</a>
                </p>
                <p className="mt-2">
                  <strong>Website:</strong> <a href="https://www.kontenthub.xyz" className="text-primary hover:underline">https://www.kontenthub.xyz</a>
                </p>
              </section>

              <div className="mt-12 pt-6 border-t text-center text-muted-foreground">
                <p>We continuously improve our security practices to provide a safe and reliable experience for all KontentHub users.</p>
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
