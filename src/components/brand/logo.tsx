import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * KontentHub brand logo — uses the official KH mark image.
 */
function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="KontentHub"
      width={32}
      height={32}
      className={cn("size-8 rounded-lg", className)}
      priority
    />
  );
}

export function Logo({
  className,
  href = "/",
  showWordmark = true,
}: {
  className?: string;
  href?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 font-semibold tracking-tight",
        className,
      )}
    >
      <LogoMark />
      {showWordmark && (
        <span className="text-base text-foreground">KontentHub</span>
      )}
    </Link>
  );
}
