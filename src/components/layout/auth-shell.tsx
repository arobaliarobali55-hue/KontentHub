import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/layout/container";

/**
 * Centered split layout for auth pages (sign-in / sign-up).
 * Keeps Clerk's hosted form focused while reinforcing the brand.
 */
export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-svh flex-1 flex-col bg-surface-page">
      <header className="border-b border-border bg-background">
        <Container>
          <div className="flex h-16 items-center">
            {/* Logo already renders its own <Link href="/"> internally */}
            <Logo />
          </div>
        </Container>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-premium">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
