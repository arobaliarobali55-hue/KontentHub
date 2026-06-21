import Link from "next/link";
import { Button, type buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

/**
 * A navigation link styled as a Button.
 *
 * The base-nova (Base UI) Button uses the `render` prop for element
 * composition rather than Radix's `asChild`. This helper wraps that pattern
 * so call sites stay clean: `<ButtonLink href="/x">Go</ButtonLink>`.
 */
export function ButtonLink({
  href,
  className,
  variant,
  size,
  children,
  ...props
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
} & VariantProps<typeof buttonVariants>) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      nativeButton={false}
      render={<Link href={href} />}
      {...props}
    >
      {children}
    </Button>
  );
}
