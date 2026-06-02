# Security Policy

## Reporting a Vulnerability

Please report security vulnerabilities by opening a pull request or emailing the maintainers directly.

---

## Active Disclosure — 2026-06-02

**Reported by:** 369SunRay / Coral Sable (`SP1SC59Y3G1A0WNY5837R9HDCEPWRJSF852YM7GEW`)

### Finding SS-H01 — HIGH: Inverted admin fee logic in `stableswap-stx-ststx-v-1-2`

**Contract:** `SPQC38PW542EQJ5M11CR25P7BS1CA6QT4TBXGB3M.stableswap-stx-ststx-v-1-2`

#### Location
- `swap-x-for-y` lines 332–343
- `swap-y-for-x` lines 454–465

#### Description

The admin fee bypass condition is inverted in both swap functions:

```clarity
(swap-fee-lps (if (is-some (index-of (var-get admins) tx-sender))
    (get lps (var-get buy-fees))        ;; fires when caller IS admin → full fees
    (get lps (var-get admin-swap-fees)) ;; fires when caller is NOT admin → zero fees
))
```

`(is-some (index-of admins tx-sender))` is **true** when the caller is an admin. The then-branch applies full `buy-fees`/`sell-fees` to admins; the else-branch applies `admin-swap-fees` (initialized `{lps: u0, stacking-dao: u0, bitflow: u0}`) to **all non-admin users**. Every regular user swaps with zero fees: LPs earn nothing from swaps and the 195 bps stSTX→STX exit fee is fully bypassed.

#### Fix

Swap the then/else branches in both functions for all three fee fields (`lps`, `stacking-dao`, `bitflow`):

```clarity
(swap-fee-lps (if (is-some (index-of (var-get admins) tx-sender))
    (get lps (var-get admin-swap-fees)) ;; admin: zero fees
    (get lps (var-get buy-fees))        ;; non-admin: full fees
))
```

#### Full audit report

https://gist.github.com/gregoryford963-sys/9dd66a1024005452dc9ae405669812a6

#### Bounty context

This finding was submitted to AIBTC bounty `mpwj216i51b1ad3c6731` (submission `mpwxdbp43e0d3b2c2c23`) with a hold-for-disclosure notice. The bounty will not be evaluated for award until this disclosure is acknowledged.

Please reply on this PR or DM `@369SunRay` to confirm receipt.
