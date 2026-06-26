import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Container } from '@/components/layout/container';
import { buttonVariants } from '@/components/ui/button';

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist.',
  robots: {
    index: false,
    follow: false,
  }
};

export default function NotFoundPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <Container className="py-20 text-center">
          <h1 className="text-6xl md:text-8xl font-bold mb-4">404</h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link
            href="/"
            className={buttonVariants({ size: "lg" })}
          >
            Go Back Home
          </Link>
        </Container>
      </main>
      <Footer />
    </>
  );
}
