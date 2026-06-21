import { UserButton } from "@clerk/nextjs";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CheckoutSuccessHandler } from "@/components/layout/checkout-success-handler";
import { Suspense } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh bg-surface-page">
      <Suspense fallback={null}>
        <CheckoutSuccessHandler />
      </Suspense>

      {/* Desktop Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
          <MobileNav />
          <div className="flex-1" />
          <UserButton />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
