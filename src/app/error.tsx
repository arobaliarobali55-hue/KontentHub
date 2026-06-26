'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Container } from '@/components/layout/container';
import { buttonVariants } from '@/components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <Container className="py-20 text-center">
          <h1 className="text-6xl md:text-8xl font-bold mb-4">500</h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Something went wrong</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
            We apologize for the inconvenience. Please try again later.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={reset}
              className={buttonVariants({ size: "lg" })}
            >
              Try Again
            </button>
            <Link
              href="/"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Go Back Home
            </Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
