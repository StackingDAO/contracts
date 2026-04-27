# Integration Guide

Complete guide for integrating with StackingDAO contracts.

## Table of Contents

- [Quick Start](#quick-start)
- [Core Integration](#core-integration)
- [Token Integration](#token-integration)
- [Advanced Features](#advanced-features)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## Quick Start

### Basic Deposit Integration

```clarity
;; Simple deposit example
(define-public (deposit-to-stackingdao (amount uint))
  (contract-call? 
    'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.stacking-dao-core-v6
    deposit
    'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.reserve-v1
    'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.commission-v2
    'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.staking-v1
    'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.direct-helpers-v4
    amount
    none    ;; referrer (optional)
    none    ;; pool (optional)
  )
)
```

### Check stSTX Balance

```clarity
(define-read-only (get-ststx-balance (user principal))
  (contract-call?
    'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token
    get-balance
    user
  )
)
```

---

## Core Integration

### 1. Deposit Flow

#### Complete Example

```clarity
(define-public (deposit-with-validation 
  (stx-amount uint)
  (min-ststx-output uint)
)
  (let (
    (core-contract 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.stacking-dao-core-v6)
    (reserve 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.reserve-v1)
    (commission 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.commission-v2)
    (staking 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.staking-v1)
    (helpers 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.direct-helpers-v4)
    
    ;; Preview exchange rate first
    (stx-per-ststx (unwrap! 
      (contract-call? helpers get-stx-per-ststx-helper reserve)
      (err u1000)
    ))
    
    ;; Calculate expected stSTX (accounting for fees)
    (fee-rate (unwrap!
      (contract-call? core-contract get-stack-fee)
      (err u1001)
    ))
    (stx-after-fee (- stx-amount (/ (* stx-amount fee-rate) u10000)))
    (expected-ststx (/ (* stx-after-fee u1000000) stx-per-ststx))
  )
    ;; Validate minimum output
    (asserts! (>= expected-ststx min-ststx-output) (err u2000))
    
    ;; Execute deposit
    (match (contract-call? core-contract deposit
      reserve
      commission
      staking
      helpers
      stx-amount
      none
      none
    )
      success (ok success)
      error (err error)
    )
  )
)
```

#### Error Handling

```clarity
;; Handle all possible errors
(match (deposit-with-validation u1000000 u950000)
  success (begin
    (print {event: "deposit-success", amount: success})
    (ok success)
  )
  error (begin
    (print {event: "deposit-failed", error: error})
    (match error
      u1   (err "ERR_DEPOSITS_DISABLED")
      u100 (err "ERR_AMOUNT_TOO_LOW")
      u200 (err "ERR_TRANSFER_FAILED")
      u2000 (err "ERR_SLIPPAGE_TOO_HIGH")
      (err "ERR_UNKNOWN")
    )
  )
)
```

### 2. Withdrawal Flow

#### Initiate Withdrawal

```clarity
(define-public (initiate-withdrawal (ststx-amount uint))
  (let (
    (core 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.stacking-dao-core-v6)
    (reserve 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.reserve-v1)
    (helpers 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.direct-helpers-v4)
  )
    ;; Get withdrawal unlock period
    (let (
      (unlock-height (unwrap!
        (contract-call? core get-withdraw-unlock-burn-height)
        (err u1000)
      ))
    )
      (print {
        event: "withdrawal-initiated",
        unlock-height: unlock-height,
        current-height: block-height
      })
      
      ;; Initiate withdrawal (returns NFT ID)
      (contract-call? core init-withdraw
        reserve
        helpers
        ststx-amount
      )
    )
  )
)
```

#### Complete Withdrawal

```clarity
(define-public (complete-withdrawal (nft-id uint))
  (let (
    (core 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.stacking-dao-core-v6)
    (reserve 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.reserve-v1)
    (commission 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.commission-v2)
    (staking 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.staking-v1)
    
    ;; Verify NFT ownership
    (nft-owner (unwrap!
      (contract-call?
        'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-withdraw-nft-v2
        get-owner
        nft-id
      )
      (err u1000)
    ))
  )
    ;; Ensure caller owns the NFT
    (asserts! (is-eq nft-owner tx-sender) (err u2000))
    
    ;; Complete withdrawal
    (contract-call? core withdraw
      reserve
      commission
      staking
      nft-id
    )
  )
)
```

---

## Token Integration

### stSTX Token (SIP-010)

#### Basic Operations

```clarity
;; Transfer stSTX
(define-public (transfer-ststx 
  (amount uint)
  (sender principal)
  (recipient principal)
  (memo (optional (buff 34)))
)
  (contract-call?
    'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token
    transfer
    amount
    sender
    recipient
    memo
  )
)

;; Get balance
(define-read-only (get-ststx-balance (account principal))
  (contract-call?
    'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token
    get-balance
    account
  )
)

;; Get total supply
(define-read-only (get-ststx-supply)
  (contract-call?
    'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token
    get-total-supply
  )
)

;; Get token metadata
(define-read-only (get-token-info)
  {
    name: (contract-call? ...ststx-token get-name),
    symbol: (contract-call? ...ststx-token get-symbol),
    decimals: (contract-call? ...ststx-token get-decimals),
    uri: (contract-call? ...ststx-token get-token-uri)
  }
)
```

#### DEX Integration Example

```clarity
;; Example: AMM pool using stSTX
(define-public (add-liquidity-ststx-usdc
  (ststx-amount uint)
  (usdc-amount uint)
)
  (let (
    (ststx-token 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token)
    (usdc-token 'SP...usdc-token)
  )
    ;; Transfer stSTX to pool
    (try! (contract-call? ststx-token transfer
      ststx-amount
      tx-sender
      (as-contract tx-sender)
      none
    ))
    
    ;; Transfer USDC to pool
    (try! (contract-call? usdc-token transfer
      usdc-amount
      tx-sender
      (as-contract tx-sender)
      none
    ))
    
    ;; Mint LP tokens, etc.
    (ok true)
  )
)
```

### stSTXbtc Token (BTC Rewards)

```clarity
;; Get stSTXbtc balance
(define-read-only (get-ststxbtc-balance (account principal))
  (contract-call?
    'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststxbtc-token-v2
    get-balance
    account
  )
)

;; Swap stSTX for stSTXbtc
(define-public (swap-ststx-to-btc (amount uint))
  (contract-call?
    'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.swap-ststx-ststxbtc-v2
    swap-ststx-for-ststxbtc
    amount
    u0 ;; min-output
  )
)
```

---

## Advanced Features

### 1. Referral System

```clarity
;; Deposit with referral code
(define-public (deposit-with-referral
  (amount uint)
  (referrer principal)
)
  (contract-call?
    'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.stacking-dao-core-v6
    deposit
    'SP...reserve-v1
    'SP...commission-v2
    'SP...staking-v1
    'SP...helpers
    amount
    (some referrer)  ;; Referrer gets commission
    none
  )
)

;; Track referrals
(define-map referral-stats
  principal
  {
    total-referred: uint,
    total-volume: uint,
    earned-commission: uint
  }
)
```

### 2. Auto-Compounding

```clarity
;; Claim rewards and auto-compound
(define-public (auto-compound)
  (let (
    (rewards (try! (claim-my-rewards)))
  )
    ;; Immediately re-deposit rewards
    (deposit-to-stackingdao rewards)
  )
)
```

### 3. Batch Operations

```clarity
;; Batch deposit for multiple users
(define-public (batch-deposit
  (amounts (list 10 uint))
  (users (list 10 principal))
)
  (ok (map deposit-for-user
    amounts
    users
  ))
)

(define-private (deposit-for-user
  (amount uint)
  (user principal)
)
  ;; Deposit on behalf of user
  ;; (requires pre-approval)
  (contract-call? ...deposit amount user)
)
```

### 4. Oracle Integration

```clarity
;; Get stSTX price in USD
(define-read-only (get-ststx-price-usd)
  (let (
    (stx-per-ststx (get-exchange-rate))
    (stx-price-usd (get-stx-oracle-price))
  )
    (/ (* stx-per-ststx stx-price-usd) u1000000)
  )
)

;; Helper: Get current exchange rate
(define-read-only (get-exchange-rate)
  (contract-call?
    'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.direct-helpers-v4
    get-stx-per-ststx-helper
    'SP...reserve-v1
  )
)
```

---

## Best Practices

### 1. Slippage Protection

```clarity
;; Always check exchange rate before deposit
(define-public (deposit-with-slippage-check
  (stx-amount uint)
  (max-slippage-bps uint) ;; in basis points (100 = 1%)
)
  (let (
    (current-rate (get-exchange-rate))
    (expected-rate u1000000) ;; 1:1 baseline
    (rate-diff (if (> current-rate expected-rate)
      (- current-rate expected-rate)
      (- expected-rate current-rate)
    ))
    (slippage-bps (/ (* rate-diff u10000) expected-rate))
  )
    ;; Check slippage tolerance
    (asserts! (<= slippage-bps max-slippage-bps) (err u3000))
    
    ;; Proceed with deposit
    (deposit-to-stackingdao stx-amount)
  )
)
```

### 2. Event Monitoring

```clarity
;; Emit events for tracking
(define-public (monitored-deposit (amount uint))
  (match (deposit-to-stackingdao amount)
    success (begin
      (print {
        event: "deposit-success",
        user: tx-sender,
        amount: amount,
        ststx-received: success,
        timestamp: block-height
      })
      (ok success)
    )
    error (begin
      (print {
        event: "deposit-failed",
        user: tx-sender,
        amount: amount,
        error: error,
        timestamp: block-height
      })
      (err error)
    )
  )
)
```

### 3. Gas Optimization

```clarity
;; Cache frequently-accessed data
(define-data-var cached-exchange-rate uint u1000000)
(define-data-var cache-block uint u0)

(define-read-only (get-cached-exchange-rate)
  (if (is-eq (var-get cache-block) block-height)
    (var-get cached-exchange-rate)
    (let (
      (fresh-rate (get-exchange-rate))
    )
      (var-set cached-exchange-rate fresh-rate)
      (var-set cache-block block-height)
      fresh-rate
    )
  )
)
```

### 4. Error Handling

```clarity
;; Comprehensive error handling
(define-constant ERR_DEPOSIT_FAILED u1000)
(define-constant ERR_WITHDRAWAL_LOCKED u1001)
(define-constant ERR_INSUFFICIENT_BALANCE u1002)
(define-constant ERR_SLIPPAGE_EXCEEDED u1003)

(define-public (safe-deposit (amount uint))
  (match (deposit-to-stackingdao amount)
    success (ok {
      success: true,
      ststx-minted: success,
      message: "Deposit successful"
    })
    error (ok {
      success: false,
      ststx-minted: u0,
      message: (error-to-message error)
    })
  )
)

(define-read-only (error-to-message (error-code uint))
  (if (is-eq error-code u1) "Deposits are currently disabled"
  (if (is-eq error-code u100) "Amount below minimum"
  (if (is-eq error-code u200) "Transfer failed"
  "Unknown error")))
)
```

---

## Examples

### Frontend Integration (JavaScript)

```javascript
import { makeContractCall, broadcastTransaction } from '@stacks/transactions';

// Deposit STX
async function depositSTX(amount, network) {
  const txOptions = {
    contractAddress: 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG',
    contractName: 'stacking-dao-core-v6',
    functionName: 'deposit',
    functionArgs: [
      contractPrincipalCV('SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG', 'reserve-v1'),
      contractPrincipalCV('SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG', 'commission-v2'),
      contractPrincipalCV('SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG', 'staking-v1'),
      contractPrincipalCV('SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG', 'direct-helpers-v4'),
      uintCV(amount),
      noneCV(),
      noneCV()
    ],
    network,
    anchorMode: AnchorMode.Any,
  };
  
  const transaction = await makeContractCall(txOptions);
  const broadcastResponse = await broadcastTransaction(transaction, network);
  
  return broadcastResponse.txid;
}

// Get stSTX balance
async function getStSTXBalance(address, network) {
  const result = await callReadOnlyFunction({
    contractAddress: 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG',
    contractName: 'ststx-token',
    functionName: 'get-balance',
    functionArgs: [principalCV(address)],
    network
  });
  
  return cvToValue(result);
}
```

### Backend Integration (Node.js)

```javascript
const { StacksTestnet, StacksMainnet } = require('@stacks/network');
const { makeContractCall, broadcastTransaction } = require('@stacks/transactions');

class StackingDAOClient {
  constructor(network = 'mainnet') {
    this.network = network === 'mainnet' 
      ? new StacksMainnet() 
      : new StacksTestnet();
    
    this.coreContract = {
      address: 'SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG',
      name: 'stacking-dao-core-v6'
    };
  }
  
  async deposit(privateKey, amount) {
    // Implementation
  }
  
  async withdraw(privateKey, nftId) {
    // Implementation
  }
  
  async getBalance(address) {
    // Implementation
  }
}
```

---

## Testing Integration

### Unit Tests

```typescript
import { Cl } from '@stacks/transactions';

Clarinet.test({
  name: "Integration: Deposit and withdraw flow",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const user = accounts.get('wallet_1')!;
    
    // 1. Deposit
    let block = chain.mineBlock([
      Tx.contractCall(
        'stacking-dao-core-v6',
        'deposit',
        [
          Cl.contractPrincipal(deployer, 'reserve-v1'),
          Cl.contractPrincipal(deployer, 'commission-v2'),
          Cl.contractPrincipal(deployer, 'staking-v1'),
          Cl.contractPrincipal(deployer, 'direct-helpers-v4'),
          Cl.uint(1000000),
          Cl.none(),
          Cl.none()
        ],
        user.address
      )
    ]);
    
    block.receipts[0].result.expectOk();
    
    // 2. Verify stSTX minted
    // 3. Initiate withdrawal
    // 4. Complete withdrawal after unlock
  }
});
```

---

## Support

- **Documentation**: [docs/](https://github.com/StackingDAO/contracts/tree/main/docs)
- **Discord**: https://discord.gg/stackingdao
- **GitHub Issues**: https://github.com/StackingDAO/contracts/issues

---

*Last updated: December 2025*
