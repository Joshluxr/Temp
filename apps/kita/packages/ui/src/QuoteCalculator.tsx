/**
 * Ported from docs/kita-sources/kimi-archive/app/src/components/QuoteCalculator.tsx.
 *
 * CRITICAL — this is now a PURE PRESENTATION component. Removed vs source:
 *  - `import { trpc } from "@/providers/trpc"` and ALL tRPC usage:
 *      trpc.remittance.currentRate.useQuery()   -> static demo fee table below
 *      trpc.remittance.createQuote.useMutation() + debounced .mutate() call
 *        (server quote creation / balance-touching path) -> removed; the host app
 *        owns pricing and receives input via onSubmit/onChange callbacks
 *  - `useNavigate()` react-router and the `/send?quote=` redirect -> optional callback
 *  - server-provided Quote object, expiresAt countdown and mutation error banner
 *      -> purely local, clearly-labelled DEMO arithmetic (midMarketRate prop)
 * NO backend, NO sandbox minting, NO addSandboxFunds/simulatePartnerCompletion.
 */
import { useState } from "react";
import { ArrowDown, ArrowRight, Check, Tag } from "lucide-react";
import { paymentLabel, php, payoutLabel, usd } from "./lib/format";

export type PaymentMethod = "bank" | "debit" | "credit" | "wallet";
export type PayoutMethod = "bank" | "gcash" | "maya" | "cash_pickup";

export type QuoteInput = {
  amount: string;
  direction: "send" | "receive";
  paymentMethod: PaymentMethod;
  payoutMethod: PayoutMethod;
  promoCode?: string;
};

/** Static demo fee table (USD). Replaces trpc.remittance.currentRate query data. */
const demoFees: Record<PaymentMethod, number> = {
  bank: 0,
  debit: 2.5,
  credit: 3.5,
  wallet: 0,
};

export function QuoteCalculator({
  onSubmit,
  onChange,
  actionLabel = "Continue with this rate",
  showWallet = false,
  initialAmount = "500",
  midMarketRate = 58.0,
}: {
  /** Host-app hook: receives the user's selection. Nothing here calls a server. */
  onSubmit?: (input: QuoteInput) => void;
  /** Optional change notifier for host-side quoting. */
  onChange?: (input: QuoteInput) => void;
  actionLabel?: string;
  showWallet?: boolean;
  initialAmount?: string;
  /** Demo FX rate used ONLY for local display math; real pricing lives in the host app. */
  midMarketRate?: number;
}) {
  const [amount, setAmount] = useState(initialAmount);
  const [direction, setDirection] = useState<"send" | "receive">("send");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank");
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>("gcash");
  const [promoOpen, setPromoOpen] = useState(false);
  const [promo, setPromo] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | undefined>();

  const invalid = !Number.isFinite(Number(amount)) || Number(amount) < 10 || Number(amount) > 10000;
  const methods: PaymentMethod[] = ["bank", "debit", "credit", ...(showWallet ? ["wallet" as const] : [])];

  // Purely local demo math — mirrors the kimi layout without any server quote.
  const numeric = invalid ? 0 : Number(amount);
  const sendUsd = direction === "send" ? numeric : numeric / midMarketRate;
  const receivePhp = direction === "send" ? numeric * midMarketRate : numeric;
  const fee = demoFees[paymentMethod];
  const feeDiscount = appliedPromo?.toUpperCase() === "WELCOME" ? fee : 0;
  const total = sendUsd + fee - feeDiscount;

  const currentInput = (): QuoteInput => ({ amount, direction, paymentMethod, payoutMethod, promoCode: appliedPromo });

  return (
    <div className="surface w-full min-w-0 overflow-hidden">
      <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6">
        <div>
          <p className="font-semibold">Build your transfer</p>
          <p className="text-xs text-muted-foreground">Transparent pricing, before you commit</p>
        </div>
        <span className="rounded-full bg-[#eff2df] px-3 py-1 text-[11px] font-bold text-[#425314]">USD → PHP</span>
      </div>
      <div className="p-5 sm:p-6">
        <div className="mb-5 grid grid-cols-2 rounded-full bg-muted p-1" aria-label="Amount direction">
          <button onClick={() => setDirection("send")} className={`min-h-10 rounded-full text-sm font-semibold transition-colors ${direction === "send" ? "bg-card" : "text-muted-foreground"}`}>You send</button>
          <button onClick={() => setDirection("receive")} className={`min-h-10 rounded-full text-sm font-semibold transition-colors ${direction === "receive" ? "bg-card" : "text-muted-foreground"}`}>Recipient gets</button>
        </div>

        <label htmlFor="quote-amount" className="data-label">{direction === "send" ? "Amount in USD" : "Amount in PHP"}</label>
        <div className="mt-2 flex items-end gap-3 border-b border-foreground/20 pb-3 focus-within:border-foreground">
          <span className="pb-1 text-lg font-semibold text-muted-foreground">{direction === "send" ? "$" : "₱"}</span>
          <input id="quote-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))} className="numeric min-w-0 flex-1 bg-transparent text-4xl font-semibold tracking-[-0.04em] outline-none sm:text-5xl" aria-describedby="amount-help" />
          <span className="pb-1 text-sm font-semibold">{direction === "send" ? "USD" : "PHP"}</span>
        </div>
        <p id="amount-help" className={`mt-2 text-xs ${invalid ? "text-destructive" : "text-muted-foreground"}`}>{invalid ? "Enter an amount from $10 to $10,000 (or the PHP equivalent)." : "Demo figures only — final quotes are provided by the app."}</p>

        <div className="mt-6">
          <p className="data-label mb-2">Pay with</p>
          <div className={`grid gap-2 ${showWallet ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
            {methods.map((method) => (
              <button key={method} onClick={() => setPaymentMethod(method)} className={`min-h-14 rounded-xl border px-2 py-2 text-center transition-colors ${paymentMethod === method ? "border-foreground bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>
                <span className="block text-xs font-semibold sm:text-sm">{paymentLabel[method]}</span>
                <span className="block text-[11px] opacity-70">{demoFees[method] === 0 ? "No fee" : `${usd(demoFees[method])} fee`}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="data-label mb-2">Delivery method</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["gcash", "bank", "maya", "cash_pickup"] as const).map((method) => (
              <button key={method} onClick={() => setPayoutMethod(method)} className={`min-h-11 rounded-xl border px-2 text-sm font-semibold transition-colors ${payoutMethod === method ? "border-foreground bg-accent" : "bg-card hover:bg-muted"}`}>{payoutLabel[method]}</button>
            ))}
          </div>
        </div>

        <div className="my-6 flex justify-center"><ArrowDown className="h-4 w-4 text-muted-foreground" /></div>

        <div className="rounded-xl bg-primary p-5 text-primary-foreground">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-70">Recipient gets</p>
          {!invalid && numeric > 0 ? <p className="numeric mt-1 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{php(receivePhp)}</p> : <p className="mt-2 text-2xl opacity-60">Enter an amount…</p>}
          <div className="mt-4 space-y-2 border-t border-white/15 pt-4 text-sm">
            <div className="flex justify-between gap-4"><span className="opacity-70">Customer rate</span><span className="numeric font-medium">1 USD = {midMarketRate.toFixed(4)} PHP</span></div>
            <div className="flex justify-between gap-4"><span className="opacity-70">Transfer fee</span><span className="numeric font-medium">{fee === 0 ? "Free" : usd(fee)}</span></div>
            {feeDiscount > 0 && <div className="flex justify-between gap-4 text-accent"><span>Promotion savings</span><span className="numeric">−{usd(feeDiscount)}</span></div>}
            <div className="flex justify-between gap-4 border-t border-white/15 pt-2 font-semibold"><span>Total to pay</span><span className="numeric">{invalid ? "—" : usd(total)}</span></div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Tag className="h-4 w-4" />Demo quote — presentation only, not a binding rate</span>
        </div>

        <button
          className="control-dark mt-5 w-full"
          disabled={invalid || !onSubmit}
          onClick={() => { if (onSubmit) onSubmit(currentInput()); }}
        >
          {actionLabel}<ArrowRight className="h-4 w-4" />
        </button>

        <button onClick={() => setPromoOpen(!promoOpen)} className="mx-auto mt-4 flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-muted-foreground hover:text-foreground"><Tag className="h-4 w-4" />{promoOpen ? "Hide promotion code" : "Have a promotion code?"}</button>
        {promoOpen && (
          <div className="mt-2 flex gap-2">
            <input className="field" placeholder="Try WELCOME" value={promo} onChange={(event) => setPromo(event.target.value)} />
            <button className="control-outline shrink-0" onClick={() => {
              const next = { ...currentInput(), promoCode: promo };
              setAppliedPromo(promo);
              onChange?.(next);
            }}>Apply{appliedPromo && <Check className="h-4 w-4" />}</button>
          </div>
        )}
      </div>
    </div>
  );
}
