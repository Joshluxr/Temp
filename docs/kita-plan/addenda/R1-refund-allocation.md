# R1 refund allocation freeze

Status: Frozen. This is the coding contract for T-LEDGER-02. No money-path coding may begin until this file exists.

## Allocation rule

This rule allocates actual FX cost and signed spread for partial refunds. It does not change customer entitlement, refund eligibility, or the principal amount owed to the customer.

Use integer minor units. For an original transaction, let:

- `P > 0` be the original refundable principal.
- `C >= 0` be the actual FX cost attributable to that principal.
- `S = P - C` be the signed spread; `S` may be negative.
- `R_i` be the cumulative principal refunded after step `i`, with `R_0 = 0`, `0 <= R_i <= P`, and `R_i >= R_(i-1)`.

At each step, compute the cumulative cost allocation with exactly one half-up rounding operation on actual FX cost:

```text
half_up(n / d) = floor((2*n + d) / (2*d))  # n >= 0, d > 0
cumulative_cost_i = half_up(C * R_i / P)
cumulative_spread_i = R_i - cumulative_cost_i

allocated_principal_i = R_i - R_(i-1)
allocated_cost_i = cumulative_cost_i - cumulative_cost_(i-1)
residual_spread_i = allocated_principal_i - allocated_cost_i
```

Perform the multiplication and rounding with exact integer arithmetic of sufficient width. Do not round each refund's cost independently. Do not round spread independently, clamp its sign, or apply an absolute value. Spread is the signed residual after allocating cost.

## Conservation proof

For every refund step, by construction:

```text
allocated_cost_i + residual_spread_i
  = allocated_cost_i + (allocated_principal_i - allocated_cost_i)
  = allocated_principal_i
```

The residual also equals the change in cumulative spread:

```text
cumulative_spread_i - cumulative_spread_(i-1)
  = (R_i - cumulative_cost_i) - (R_(i-1) - cumulative_cost_(i-1))
  = allocated_principal_i - allocated_cost_i
  = residual_spread_i
```

Thus the step allocations telescope: cumulative allocated cost plus cumulative signed spread equals `R_i` at every step. At the final remainder, `R_i = P`, so `cumulative_cost_i = half_up(C * P / P) = C` and `cumulative_spread_i = P - C = S`. The final refund receives exactly the remaining cost and signed spread. No rounding residue remains. These identities do not depend on spread being nonnegative and therefore also hold for negative spread.

## Required fixtures

### Original principal/cost/spread: 10000 / 9999 / 1

For a first refund of `5000`:

```text
allocated_principal = 5000
allocated_cost = half_up(9999 * 5000 / 10000) = half_up(4999.5) = 5000
residual_spread = 5000 - 5000 = 0
5000 + 0 = 5000
```

Independently rounding `1 * 5000 / 10000` to spread `1` is prohibited: it would produce `5000 + 1 != 5000`.

For the final refund of the remaining `5000`:

```text
cumulative_cost = 9999
allocated_cost = 9999 - 5000 = 4999
residual_spread = 5000 - 4999 = 1
4999 + 1 = 5000
```

Totals are principal `10000`, cost `9999`, and signed spread `1`.

### Negative spread: 10000 / 10001 / -1

For a first refund of `5000`:

```text
allocated_cost = half_up(10001 * 5000 / 10000) = half_up(5000.5) = 5001
residual_spread = 5000 - 5001 = -1
5001 + (-1) = 5000
```

For the final refund of the remaining `5000`:

```text
cumulative_cost = 10001
allocated_cost = 10001 - 5001 = 5000
residual_spread = 5000 - 5000 = 0
5000 + 0 = 5000
```

Totals are principal `10000`, cost `10001`, and signed spread `-1`. Customer entitlement remains the allocated principal at every step.
