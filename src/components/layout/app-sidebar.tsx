"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, PenTool, History, Settings, Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const NAV_ITEMS = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/generate", label: "Generate", icon: PenTool },
  { href: "/app/history", label: "History", icon: History },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [plan, setPlan] = useState<string>("free");
  const [loadingPlan, setLoadingPlan] = useState<boolean>(true);
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/usage")
      .then((res) => res.json())
      .then((data) => {
        if (data.usage) {
          setPlan(data.usage.plan);
        }
      })
      .catch((err) => console.error("Error fetching plan:", err))
      .finally(() => setLoadingPlan(false));
  }, [pathname]); // Refresh plan if path changes

  const handleUpgrade = async () => {
    if (isUpgrading) return;
    setIsUpgrading(true);

    try {
      const res = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(data.error || "Failed to create checkout session.");
        setIsUpgrading(false);
      }
    } catch (error) {
      console.error("Upgrade request failed:", error);
      toast.error("An error occurred. Please try again.");
      setIsUpgrading(false);
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-background">
      <div className="flex items-center px-5 py-4 border-b border-border">
        <Logo href="/app" />
      </div>

      <nav className="flex-1 flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/app"
            ? pathname === "/app"
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {!loadingPlan && plan !== "pro" && (
        <div className="p-4 border-t border-border animate-in fade-in duration-300">
          <div className="rounded-lg bg-primary/5 p-4">
            <p className="text-sm font-medium text-foreground">Upgrade to Pro</p>
            <p className="text-xs text-muted-foreground mt-1">Unlimited posts, AI images & more.</p>
            <button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="mt-3 w-full inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70 cursor-pointer"
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Upgrading...
                </>
              ) : (
                "Upgrade"
              )}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
