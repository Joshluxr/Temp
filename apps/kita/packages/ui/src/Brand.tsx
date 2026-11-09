/**
 * Faithful port of docs/kita-sources/kimi-archive/app/src/components/Brand.tsx.
 * Only change: react-router <Link> replaced with a plain <a href> so the package
 * is router-agnostic (href prop instead of `to`).
 */
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export function Brand({ inverse = false, href = "/" }: { inverse?: boolean; href?: string }) {
  return (
    <a href={href} aria-label="Kita home" className={`inline-flex items-center gap-2 rounded-md font-bold tracking-[-0.055em] ${inverse ? "text-[#f5f5f0]" : "text-foreground"}`}>
      <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-accent text-accent-foreground">
        <ArrowDownLeft className="h-4 w-4" strokeWidth={2.5} />
        <ArrowUpRight className="-ml-2 h-4 w-4" strokeWidth={2.5} />
      </span>
      <span className="text-[1.8rem] leading-none">kita</span>
    </a>
  );
}
