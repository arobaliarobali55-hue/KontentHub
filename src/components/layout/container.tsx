import { cn } from "@/lib/utils";

/**
 * Centered max-width wrapper used across marketing and app surfaces.
 * Matches Stripe's airy, generously-contained layout rhythm.
 */
export function Container({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & {
  size?: "default" | "narrow" | "wide";
}) {
  return (
    <div
      data-slot="container"
      className={cn(
        "mx-auto w-full px-5 sm:px-6 lg:px-8",
        size === "narrow" && "max-w-3xl",
        size === "default" && "max-w-6xl",
        size === "wide" && "max-w-7xl",
        className,
      )}
      {...props}
    />
  );
}
