# StackingDAO Contracts - API Reference

Complete reference for all public contract functions and read-only methods.

## Table of Contents

- [Core Contracts](#core-contracts)
  - [stacking-dao-core-v6](#stacking-dao-core-v6)
  - [stacking-dao-core-btc-v3](#stacking-dao-core-btc-v3)
- [Token Contracts](#token-contracts)
  - [ststx-token](#ststx-token)
  - [ststxbtc-token-v2](#ststxbtc-token-v2)
- [Supporting Contracts](#supporting-contracts)
  - [direct-helpers-v4](#direct-helpers-v4)

---

## Core Contracts

### stacking-dao-core-v6

Main entry point for user interactions with deposits and withdrawals.

#### Public Functions

##### `deposit`

Deposit STX and receive stSTX tokens.

**Signature:**
```clarity
(define-public (deposit
  (reserve <reserve-trait>)
  (commission-contract <commission-trait>)
  (staking-contract <staking-trait>)
  (direct-helpers <direct-helpers-trait>)
  (stx-amount uint)
  (referrer (optional principal))
  (pool (optional principal))
) (response uint uint))
```

**Parameters:**
- `reserve`: Reserve contract implementing reserve-trait
- `commission-contract`: Commission contract for fee handling
- `staking-contract`: Staking contract
- `direct-helpers`: Helper contract for calculations
- `stx-amount`: Amount of STX to deposit (micro-STX)
- `referrer`: Optional referrer address for commission
- `pool`: Optional pool address for allocation

**Returns:**
- `(ok uint)`: Amount of stSTX minted
- `(err uint)`: Error code

**Errors:**
- `u1`: Deposits are disabled
- `u100`: Amount too low
- `u200`: Transfer failed

**Example:**
```clarity
(contract-call? .stacking-dao-core-v6 deposit
  .reserve-v1
  .commission-v2
  .staking-v1
  .direct-helpers-v4
  u1000000 ;; 1 STX
  none
  none
)
```

---

##### `init-withdraw`

Initiate a withdrawal request. Returns an NFT representing the withdrawal claim.

**Signature:**
```clarity
(define-public (init-withdraw
  (reserve <reserve-trait>)
  (direct-helpers <direct-helpers-trait>)
  (ststx-amount uint)
) (response uint uint))
```

**Parameters:**
- `reserve`: Reserve contract
- `direct-helpers`: Helper contract
- `ststx-amount`: Amount of stSTX to withdraw

**Returns:**
- `(ok uint)`: NFT ID for the withdrawal
- `(err uint)`: Error code

**Errors:**
- `u1`: DAO not enabled
- `u100`: Amount too low
- `u200`: Transfer failed

**Example:**
```clarity
(contract-call? .stacking-dao-core-v6 init-withdraw
  .reserve-v1
  .direct-helpers-v4
  u1000000 ;; 1 stSTX
)
;; Returns: (ok u1) - NFT ID 1
```

---

##### `cancel-withdraw`

Cancel a pending withdrawal and receive stSTX back.

**Signature:**
```clarity
(define-public (cancel-withdraw
  (reserve <reserve-trait>)
  (direct-helpers <direct-helpers-trait>)
  (nft-id uint)
  (pool (optional principal))
) (response uint uint))
```

**Parameters:**
- `reserve`: Reserve contract
- `direct-helpers`: Helper contract
- `nft-id`: Withdrawal NFT ID
- `pool`: Optional pool address

**Returns:**
- `(ok uint)`: STX amount refunded
- `(err uint)`: Error code

---

##### `withdraw`

Complete withdrawal after unlock period.

**Signature:**
```clarity
(define-public (withdraw
  (reserve <reserve-trait>)
  (commission-contract <commission-trait>)
  (staking-contract <staking-trait>)
  (nft-id uint)
) (response {stx-user-amount: uint, stx-fee-amount: uint} uint))
```

**Parameters:**
- `reserve`: Reserve contract
- `commission-contract`: Commission contract
- `staking-contract`: Staking contract
- `nft-id`: Withdrawal NFT ID

**Returns:**
- `(ok {stx-user-amount: uint, stx-fee-amount: uint})`: Withdrawal details
- `(err uint)`: Error code

**Example:**
```clarity
(contract-call? .stacking-dao-core-v6 withdraw
  .reserve-v1
  .commission-v2
  .staking-v1
  u1 ;; NFT ID
)
;; Returns: (ok {stx-user-amount: u989770, stx-fee-amount: u2480})
```

---

#### Read-Only Functions

##### `get-stack-fee`

Get the deposit fee in basis points.

**Signature:**
```clarity
(define-read-only (get-stack-fee) (response uint uint))
```

**Returns:**
- Fee in basis points (100 = 1%)

**Example:**
```clarity
(contract-call? .stacking-dao-core-v6 get-stack-fee)
;; Returns: u50 (0.5%)
```

---

##### `get-unstack-fee`

Get the withdrawal fee in basis points.

**Signature:**
```clarity
(define-read-only (get-unstack-fee) (response uint uint))
```

---

##### `get-withdraw-unlock-burn-height`

Calculate when a withdrawal will unlock.

**Signature:**
```clarity
(define-read-only (get-withdraw-unlock-burn-height) (response (optional uint) uint))
```

**Returns:**
- Block height when withdrawal unlocks

---

## Token Contracts

### ststx-token

SIP-010 fungible token representing liquid stacked STX.

#### Public Functions

##### `transfer`

Transfer stSTX tokens.

**Signature:**
```clarity
(define-public (transfer
  (amount uint)
  (sender principal)
  (recipient principal)
  (memo (optional (buff 34)))
) (response bool uint))
```

**Parameters:**
- `amount`: Amount to transfer (micro-stSTX)
- `sender`: Sender address
- `recipient`: Recipient address
- `memo`: Optional memo

**Returns:**
- `(ok true)`: Transfer successful
- `(err uint)`: Error code

---

#### Read-Only Functions

##### `get-balance`

Get token balance for an account.

**Signature:**
```clarity
(define-read-only (get-balance (account principal)) (response uint uint))
```

**Example:**
```clarity
(contract-call? .ststx-token get-balance 'SP123...)
;; Returns: (ok u1000000)
```

---

##### `get-total-supply`

Get total token supply.

**Signature:**
```clarity
(define-read-only (get-total-supply) (response uint uint))
```

---

##### `get-name`

Get token name.

**Signature:**
```clarity
(define-read-only (get-name) (response (string-ascii 32) uint))
```

**Returns:**
- `(ok "stSTX")`

---

##### `get-symbol`

Get token symbol.

**Signature:**
```clarity
(define-read-only (get-symbol) (response (string-ascii 10) uint))
```

**Returns:**
- `(ok "stSTX")`

---

##### `get-decimals`

Get token decimals.

**Signature:**
```clarity
(define-read-only (get-decimals) (response uint uint))
```

**Returns:**
- `(ok u6)`

---

##### `get-token-uri`

Get token metadata URI.

**Signature:**
```clarity
(define-read-only (get-token-uri) (response (optional (string-utf8 256)) uint))
```

---

## Supporting Contracts

### direct-helpers-v4

Helper contract for UI and off-chain queries.

#### Read-Only Functions

##### `get-stx-per-ststx-helper`

Get current exchange rate between STX and stSTX.

**Signature:**
```clarity
(define-read-only (get-stx-per-ststx-helper
  (reserve <reserve-trait>)
) (response uint uint))
```

**Returns:**
- Exchange rate (6 decimals)

**Example:**
```clarity
(contract-call? .direct-helpers-v4 get-stx-per-ststx-helper .reserve-v1)
;; Returns: (ok u1050000) - 1 stSTX = 1.05 STX
```

---

##### `get-total-stacked`

Get total STX currently stacked.

**Signature:**
```clarity
(define-read-only (get-total-stacked) (response uint uint))
```

---

##### `get-user-deposit-info`

Get user's deposit statistics.

**Signature:**
```clarity
(define-read-only (get-user-deposit-info
  (user principal)
) (response {
  total-deposited: uint,
  referrer: (optional principal),
  first-deposit-height: uint
} uint))
```

---

## Error Codes

### Common Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| u1 | ERR_DISABLED | Contract or feature is disabled |
| u100 | ERR_AMOUNT_TOO_LOW | Amount below minimum threshold |
| u200 | ERR_TRANSFER_FAILED | Token transfer failed |
| u300 | ERR_UNAUTHORIZED | Caller not authorized |
| u400 | ERR_NOT_FOUND | Resource not found |
| u500 | ERR_INVALID_PARAMS | Invalid parameters |
| u1000 | ERR_GET_OWNER | Failed to get NFT owner |
| u2000 | ERR_UNLOCK_NOT_REACHED | Withdrawal still locked |

---

## Events

### Deposit Event

```clarity
{
  action: "deposit",
  stacker: principal,
  stx-amount: uint,
  ststx-amount: uint,
  referrer: (optional principal),
  pool: (optional principal),
  block-height: uint
}
```

### Withdraw Event

```clarity
{
  action: "withdraw",
  stacker: principal,
  ststx-amount: uint,
  stx-amount: uint,
  block-height: uint
}
```

---

## Type Definitions

### Traits

```clarity
;; Reserve Trait
(define-trait reserve-trait
  (
    (request-stx-for-payout (uint principal) (response bool uint))
    (request-stx-for-withdrawal (uint principal) (response bool uint))
    (request-stx-to-stack (uint principal uint) (response bool uint))
  )
)

;; Commission Trait
(define-trait commission-trait
  (
    (pay (uint (optional principal) (optional principal)) (response bool uint))
  )
)
```

---

## Usage Patterns

### Query User Balance

```clarity
;; Get user's stSTX balance
(contract-call? .ststx-token get-balance 'SP...)

;; Get user's equivalent STX value
(let (
  (ststx-balance (unwrap-panic 
    (contract-call? .ststx-token get-balance 'SP...)))
  (exchange-rate (unwrap-panic
    (contract-call? .direct-helpers-v4 get-stx-per-ststx-helper .reserve-v1)))
)
  (/ (* ststx-balance exchange-rate) u1000000)
)
```

### Calculate Expected Output

```clarity
;; Calculate expected stSTX from STX deposit
(define-read-only (calculate-deposit-output (stx-amount uint))
  (let (
    (fee-rate (unwrap-panic (contract-call? .stacking-dao-core-v6 get-stack-fee)))
    (stx-after-fee (- stx-amount (/ (* stx-amount fee-rate) u10000)))
    (exchange-rate (unwrap-panic 
      (contract-call? .direct-helpers-v4 get-stx-per-ststx-helper .reserve-v1)))
  )
    (/ (* stx-after-fee u1000000) exchange-rate)
  )
)
```

---

*For integration examples, see [integration-guide.md](integration-guide.md)*  
*For architecture details, see [architecture.md](architecture.md)*

---

*Last updated: December 2025*
