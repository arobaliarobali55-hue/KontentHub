import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import GoogleAnalytics from "@/components/google-analytics";
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
          <Toaster />
          <GoogleAnalytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
