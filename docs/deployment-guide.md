# Deployment Guide

Complete guide for deploying StackingDAO contracts to mainnet and testnet.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Contract Addresses](#contract-addresses)
- [Deployment Process](#deployment-process)
- [Post-Deployment](#post-deployment)
- [Verification](#verification)

---

## Prerequisites

### Tools Required

```bash
# Install Clarinet v2.11.2+
curl -L https://github.com/hirosystems/clarinet/releases/download/v2.11.2/clarinet-macos-x64.tar.gz | tar xz

# Install Stacks CLI
npm install -g @stacks/cli

# Verify installations
clarinet --version
stx --version
```

### Configuration

1. **Create deployment wallet**
   ```bash
   stx make_keychain -t > deployment-wallet.json
   ```

2. **Fund deployment wallet**
   - Mainnet: Acquire STX from exchange
   - Testnet: Use faucet at https://explorer.hiro.so/sandbox/faucet

3. **Set environment variables**
   ```bash
   export DEPLOYER_KEY="<private-key>"
   export NETWORK="mainnet" # or "testnet"
   ```

---

## Contract Addresses

### Mainnet (Production)

> ⚠️ **Important**: Always verify addresses on https://explorer.hiro.so

#### Core Contracts (v3)

| Contract | Address | Status |
|----------|---------|--------|
| DAO | `SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.dao` | ✅ Active |
| stSTX Token | `SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token` | ✅ Active |
| stSTXbtc Token v2 | `SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststxbtc-token-v2` | ✅ Active |
| Withdraw NFT v2 | `SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-withdraw-nft-v2` | ✅ Active |
| Core v6 | `SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.stacking-dao-core-v6` | ✅ Active |
| Core BTC v3 | `SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.stacking-dao-core-btc-v3` | ✅ Active |
| Reserve v1 | `SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.reserve-v1` | ✅ Active |
| Rewards v5 | `SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.rewards-v5` | ✅ Active |
| Data Core v3 | `SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.data-core-v3` | ✅ Active |

#### Helpers & Utilities

| Contract | Address | Status |
|----------|---------|--------|
| Direct Helpers v4 | `SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.direct-helpers-v4` | ✅ Active |
| Block Info v20 | `SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.block-info-v20` | ✅ Active |
| Commission v2 | `SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.commission-v2` | ✅ Active |
| Commission BTC v1 | `SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.commission-btc-v1` | ✅ Active |

> **Note**: Replace `SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG` with actual deployment address

### Testnet

#### Core Contracts (v3)

| Contract | Address |
|----------|---------|
| DAO | `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.dao` |
| stSTX Token | `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.ststx-token` |
| Core v6 | `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.stacking-dao-core-v6` |

> **Note**: Testnet addresses are for development only

### External Dependencies

| Protocol | Contract | Network |
|----------|----------|---------|
| PoX-4 | `SP000000000000000000002Q6VF78.pox-4` | Mainnet |
| sBTC Token | `TBD` | Mainnet |
| Arkadiko | `SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.*` | Mainnet |
| Velar | `SP1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A1.*` | Mainnet |

---

## Deployment Process

### 1. Prepare Deployment Plan

```bash
# Generate deployment plan
clarinet deployments generate --mainnet

# Review generated plan
cat deployments/default.mainnet-plan.yaml
```

### 2. Customize Deployment Plan

Edit `deployments/default.mainnet-plan.yaml`:

```yaml
---
id: 0
name: StackingDAO v3 Deployment
network: mainnet
stacks-node: https://stacks-node-api.mainnet.stacks.co
genesis:
  - contract-deploy: dao
    wallet: deployer
  - contract-deploy: ststx-token
    wallet: deployer
    after:
      - contract-deploy:dao
  # ... additional contracts
```

### 3. Deploy to Testnet First

```bash
# Switch to testnet
export NETWORK=testnet

# Generate testnet plan
clarinet deployments generate --testnet

# Deploy to testnet
clarinet deployments apply -p deployments/default.testnet-plan.yaml
```

### 4. Test Deployment

```bash
# Run integration tests against testnet
npm run test:integration

# Manually test key functions
stx call-contract ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.stacking-dao-core-v6 deposit ...
```

### 5. Deploy to Mainnet

```bash
# Switch to mainnet
export NETWORK=mainnet

# Final review of deployment plan
cat deployments/default.mainnet-plan.yaml

# ⚠️ IMPORTANT: Double-check all contract names and addresses

# Deploy (this will cost STX)
clarinet deployments apply -p deployments/default.mainnet-plan.yaml --confirm
```

### 6. Deployment Order

Contracts must be deployed in dependency order:

```
Phase 1: Foundation
  1. dao
  2. sip-010-trait-ft-standard
  3. nft-trait
  4. All trait contracts

Phase 2: Core Tokens
  5. ststx-token
  6. ststxbtc-token-v2
  7. ststx-withdraw-nft-v2

Phase 3: Data Layer
  8. data-core-v3
  9. data-pools-v1
  10. data-direct-stacking-v1

Phase 4: Logic Layer
  11. reserve-v1
  12. commission-v2
  13. commission-btc-v1
  14. rewards-v5

Phase 5: Main Contracts
  15. stacking-dao-core-v6
  16. stacking-dao-core-btc-v3

Phase 6: Supporting
  17. direct-helpers-v4
  18. block-info-v20
  19. Protocol integrations
  20. Stacking delegates
```

---

## Post-Deployment

### 1. Initialize Contracts

```clarity
;; Set critical parameters
(contract-call? .dao set-protocol .stacking-dao-core-v6 true)
(contract-call? .dao set-protocol .reserve-v1 true)
(contract-call? .dao set-protocol .rewards-v5 true)

;; Configure fees
(contract-call? .stacking-dao-core-v6 set-stack-fee u50) ;; 0.5%
(contract-call? .stacking-dao-core-v6 set-unstack-fee u25) ;; 0.25%

;; Set reward addresses
(contract-call? .commission-v2 set-commission-address .treasury)
```

### 2. Enable DAO Governance

```clarity
;; Transfer ownership to DAO
(contract-call? .dao set-executive-team 
  '(SP123... SP456... SP789...))

;; Enable proposals
(contract-call? .dao enable-proposals true)
```

### 3. Security Checklist

- [ ] All contracts deployed successfully
- [ ] DAO ownership transferred
- [ ] Fee parameters configured correctly
- [ ] Protocol integrations whitelisted
- [ ] Emergency shutdown tested
- [ ] Monitoring enabled
- [ ] Backup admin keys secured

---

## Verification

### 1. Contract Verification

```bash
# Verify contract on explorer
stx verify-contract \
  --contract-id SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.stacking-dao-core-v6 \
  --source-file contracts/version-3/stacking-dao-core-v6.clar

# Check contract status
curl https://api.mainnet.hiro.so/v2/contracts/interface/SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG/stacking-dao-core-v6
```

### 2. Functional Testing

```clarity
;; Test read-only functions
(contract-call? .stacking-dao-core-v6 get-stack-fee)
;; Expected: u50

;; Test deposit (with small amount)
(contract-call? .stacking-dao-core-v6 deposit
  .reserve-v1
  .commission-v2
  .staking-v1
  .direct-helpers-v4
  u1000000 ;; 1 STX
  none
  none
)
;; Expected: (ok uint)

;; Verify stSTX minted
(contract-call? .ststx-token get-balance tx-sender)
;; Expected: > u0
```

### 3. Integration Testing

```bash
# Test protocol integrations
npm run test:arkadiko
npm run test:velar
npm run test:bitflow

# Test stacking delegation
npm run test:delegates

# Test reward distribution
npm run test:rewards
```

---

## Monitoring

### Set Up Monitoring

1. **Contract Events**
   ```javascript
   // Subscribe to contract events
   const ws = new WebSocket('wss://api.mainnet.hiro.so/');
   ws.on('message', (data) => {
     // Monitor deposits, withdrawals, etc.
   });
   ```

2. **Balance Monitoring**
   - Reserve STX balance
   - stSTX total supply
   - Delegation amounts

3. **Alerts**
   - Low reserve balance
   - Failed delegations
   - Unusual withdraw volume

### Dashboard Metrics

- Total Value Locked (TVL)
- Active delegations
- Reward distribution rate
- Average deposit/withdrawal size
- Commission collected

---

## Rollback Procedure

In case of critical issues:

1. **Emergency Shutdown**
   ```clarity
   (contract-call? .dao emergency-shutdown true)
   ```

2. **Disable Deposits**
   ```clarity
   (contract-call? .stacking-dao-core-v6 set-shutdown-deposits true)
   ```

3. **Allow Withdrawals Only**
   - Users can still withdraw existing positions
   - No new deposits accepted

4. **Migration Path**
   - Deploy fixed version
   - Enable migration contract
   - User migration period

---

## Troubleshooting

### Common Issues

**Issue**: Contract deployment fails
- **Check**: Sufficient STX for gas fees
- **Check**: Contract name not already taken
- **Check**: All dependencies deployed first

**Issue**: Cannot call deployed contract
- **Check**: Contract is not in read-only mode
- **Check**: Caller has required permissions
- **Check**: Parameters types match signature

**Issue**: Integration with external protocol fails
- **Check**: External contract addresses correct
- **Check**: Network (mainnet vs testnet) matches
- **Check**: Protocol whitelist updated

---

## Resources

- **Clarinet Documentation**: https://docs.hiro.so/clarinet
- **Stacks Explorer**: https://explorer.hiro.so
- **API Documentation**: https://docs.hiro.so/api
- **Discord Support**: https://discord.gg/stackingdao

---

*Last updated: December 2025*
