/**
 * Ported from docs/kita-sources/kimi-archive/app/src/components/AppShell.tsx.
 * STRIPPED (Sol CONDITIONAL-PASS: presentation batch must not touch auth/session):
 *  - useAuth() hook (which itself wraps trpc session queries) — removed entirely
 *  - loading / unauthenticated redirects and admin-role gate — removed
 *  - logout button — removed; replaced by optional onSignOut callback prop
 *  - react-router NavLink/Link — replaced with plain anchors + isActive prop
 * Nav items, user badge and sandbox note are now static props. NO backend calls.
 */
import { useState, type ReactNode } from "react";
import {
  ArrowLeftRight, ArrowUpRight, BookOpenCheck, ChevronRight, CircleDollarSign,
  FileClock, Gauge, LogOut, Menu, ReceiptText, Send, Settings2, ShieldCheck,
  UsersRound, WalletCards, X,
} from "lucide-react";
import { Brand } from "./Brand";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof Gauge;
};

const customerNav: NavItem[] = [
  { href: "/app", label: "Overview", icon: Gauge },
  { href: "/send", label: "Send money", icon: Send },
  { href: "/recipients", label: "Recipients", icon: UsersRound },
  { href: "/wallet", label: "Wallet & rewards", icon: WalletCards },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Operations", icon: Gauge },
  { href: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/admin/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/admin/configuration", label: "Configuration", icon: Settings2 },
  { href: "/admin/audit", label: "Audit & ledger", icon: FileClock },
];

export type AppShellUser = {
  name?: string;
  email?: string;
  role?: "customer" | "admin";
};

export function AppShell({
  children,
  admin = false,
  title,
  nav,
  activeHref,
  user,
  onSignOut,
}: {
  children: ReactNode;
  admin?: boolean;
  title: string;
  /** Static nav model; defaults to the demo customer/admin lists. No routing library required. */
  nav?: NavItem[];
  /** Which nav item renders as active (host app resolves routing; this component is pure presentation). */
  activeHref?: string;
  /** Static display-only identity. The port performs NO authentication or session checks. */
  user?: AppShellUser;
  /** Optional host-provided sign-out handler; the shell itself calls nothing. */
  onSignOut?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const items = nav ?? (admin ? adminNav : customerNav);

  const navContent = (
    <>
      <div className="px-5 pb-8 pt-6"><Brand href={admin ? "/admin" : "/app"} /></div>
      <div className="px-5 pb-5">
        <p className="data-label">{admin ? "Control room" : "My Kita"}</p>
      </div>
      <nav aria-label={admin ? "Administration" : "Customer"} className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => {
          const isActive = item.href === activeHref;
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-colors ${isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              <span>{item.label}</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-40" />
            </a>
          );
        })}
      </nav>
      <div className="mt-6 px-5 pb-6">
        <div className="mb-5 rounded-xl bg-[#eff2df] p-4 text-sm">
          <div className="mb-1 flex items-center gap-2 font-semibold"><span className="h-2 w-2 rounded-full bg-[#557018]" />Sandbox environment</div>
          <p className="text-muted-foreground">Simulated partners. No real funds move.</p>
        </div>
        {!admin && user?.role === "admin" && <a href="/admin" className="mb-3 flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold hover:bg-muted"><BookOpenCheck className="h-4 w-4" />Open control room</a>}
        {admin && <a href="/app" className="mb-3 flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold hover:bg-muted"><CircleDollarSign className="h-4 w-4" />Customer view</a>}
        {user && (
          <div className="flex items-center gap-3 border-t pt-5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary font-semibold">{user.name?.slice(0, 1) ?? "K"}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{user.name}</p><p className="truncate text-xs text-muted-foreground">{user.email}</p></div>
            {onSignOut && (
              <button onClick={onSignOut} aria-label="Sign out" className="grid h-11 w-11 place-items-center rounded-full hover:bg-muted"><LogOut className="h-4 w-4" /></button>
            )}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-card lg:flex">{navContent}</aside>
      <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-card/95 px-4 backdrop-blur lg:ml-64 lg:px-8">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuOpen(true)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-muted lg:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
          <div><p className="text-sm font-semibold lg:hidden">{title}</p><p className="hidden text-sm text-muted-foreground lg:block">{admin ? "Kita Operations" : "Kita Remittance"} <span className="mx-2">/</span> <span className="text-foreground">{title}</span></p></div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border px-3 py-1 text-[11px] font-bold tracking-[0.12em] sm:inline-flex">SANDBOX</span>
          <a href="/" className="hidden min-h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold hover:bg-muted sm:flex">Website <ArrowUpRight className="h-4 w-4" /></a>
        </div>
      </div>
      <main className="px-4 py-6 sm:px-6 md:py-8 lg:ml-64 lg:px-10 lg:py-10">{children}</main>
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button className="absolute inset-0 bg-black/45" onClick={() => setMenuOpen(false)} aria-label="Close navigation overlay" />
          <div className="absolute inset-y-0 left-0 flex w-[min(86vw,320px)] flex-col bg-card shadow-xl">
            <button onClick={() => setMenuOpen(false)} className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full hover:bg-muted" aria-label="Close navigation"><X className="h-5 w-5" /></button>
            {navContent}
          </div>
        </div>
      )}
    </div>
  );
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && <p className="data-label mb-2">{eyebrow}</p>}
        <h1 className="font-display text-4xl leading-tight tracking-[-0.035em] md:text-5xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon = ReceiptText, title, description, action }: { icon?: typeof ReceiptText; title: string; description: string; action?: ReactNode }) {
  return <div className="surface flex flex-col items-center px-6 py-14 text-center"><Icon className="mb-4 h-8 w-8 text-muted-foreground" strokeWidth={1.5} /><h2 className="font-display text-3xl">{title}</h2><p className="mt-2 max-w-md text-muted-foreground">{description}</p>{action && <div className="mt-6">{action}</div>}</div>;
}
