import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import GoogleAnalytics from "@/components/google-analytics";
import { OrganizationSchema, SoftwareApplicationSchema } from "@/components/schema";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "KontentHub — LinkedIn content that sounds like you",
    template: "%s · KontentHub",
  },
  description:
    "KontentHub learns your professional brand from your LinkedIn profile and generates authentic, high-performing posts in your voice.",
  keywords: [
    "LinkedIn",
    "content creation",
    "AI writer",
    "personal brand",
    "social media",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "KontentHub — LinkedIn content that sounds like you",
    description:
      "Generate authentic LinkedIn posts tailored to your professional brand. No prompts required.",
    type: "website",
    siteName: "KontentHub",
    images: [{ url: "/logo.png", width: 800, height: 800, alt: "KontentHub Logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KontentHub — LinkedIn content that sounds like you",
    description:
      "Generate authentic LinkedIn posts tailored to your professional brand.",
  },
  verification: {
    google: "iFpLdksMdNqu7iTmoX5GRRFu2WyrUjdf64mVMoizG_g",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} h-full antialiased`} data-scroll-behavior="smooth" suppressHydrationWarning>
        <body className="min-h-full flex flex-col">
          {children}
          <OrganizationSchema />
          <SoftwareApplicationSchema />
          <Toaster />
          <GoogleAnalytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
