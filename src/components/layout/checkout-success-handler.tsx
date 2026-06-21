"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "@clerk/nextjs";
import { toast } from "sonner";

export function CheckoutSuccessHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session } = useSession();
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const status = searchParams.get("status");
    const subscriptionId = searchParams.get("subscription_id");

    const isSuccess = checkout === "success" || status === "active" || status === "succeeded" || !!subscriptionId;
    if (!isSuccess || isPolling) return;

    setIsPolling(true);
    let attempts = 0;
    const maxAttempts = 15; // Poll for up to 15 seconds (15 x 1000ms)

    const toastId = toast.loading("Confirming your premium upgrade...", {
      description: "Verifying payment with Dodo Payments.",
    });

    const pollPlanStatus = async () => {
      try {
        const queryUrl = subscriptionId 
          ? `/api/usage?subscription_id=${subscriptionId}` 
          : "/api/usage";
          
        const res = await fetch(queryUrl);
        if (!res.ok) {
          throw new Error(`Failed to fetch usage: ${res.status}`);
        }
        
        const data = await res.json();
        if (data.usage && data.usage.plan === "pro") {
          // Upgrade detected! Update UI and stop polling
          toast.success("Thank you! Your upgrade to Pro was successful.", {
            id: toastId,
            description: "Your unlimited content generation is now active.",
            duration: 5000,
          });

          // 1. Force Clerk to refresh token in case claims/metadata are cached
          if (session) {
            try {
              await session.getToken({ skipCache: true });
              console.log("Clerk token refreshed successfully.");
            } catch (clerkError) {
              console.error("Clerk token refresh error:", clerkError);
            }
          }

          // 2. Clean up search parameters from the URL bar
          const url = new URL(window.location.href);
          url.searchParams.delete("checkout");
          url.searchParams.delete("status");
          url.searchParams.delete("subscription_id");
          url.searchParams.delete("email");
          window.history.replaceState({}, "", url.pathname + url.search);

          // 3. Force Next.js Router Cache clear & page refresh
          router.refresh();
          setIsPolling(false);
          return;
        }
      } catch (err) {
        console.error("Error polling subscription status:", err);
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(pollPlanStatus, 1000); // Poll again in 1 second
      } else {
        // Timeout reached before webhook/sync finished
        toast.info("Your upgrade is taking a bit longer to process.", {
          id: toastId,
          description: "Your plan will update in the background shortly. Feel free to refresh the page.",
          duration: 6000,
        });

        // Clean up URL parameters anyway to stop repeated polling
        const url = new URL(window.location.href);
        url.searchParams.delete("checkout");
        url.searchParams.delete("status");
        url.searchParams.delete("subscription_id");
        url.searchParams.delete("email");
        window.history.replaceState({}, "", url.pathname + url.search);
        
        setIsPolling(false);
      }
    };

    pollPlanStatus();
  }, [searchParams, router, session, isPolling]);

  return null;
}

