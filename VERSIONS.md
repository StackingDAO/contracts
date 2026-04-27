# Contract Versions

This document provides an overview of all contract versions in the StackingDAO protocol, their status, and migration paths.

## Version Status

| Version | Status | Recommended Use | Documentation |
|---------|--------|----------------|---------------|
| **v3** | ✅ Production | **Recommended** - Latest features | [Details](#version-3) |
| **v2** | ⚠️ Maintenance | Stable, no new features | [Details](#version-2) |
| **v1** | ❌ Deprecated | Not recommended | [Details](#version-1) |

---

## Version 3

**Status**: ✅ **Production Ready** (Current)  
**Release**: 2025-06  
**Audit**: Clarity Alliance (June 2025)

### Key Features

- **BTC Rewards**: Earn BTC rewards via stSTXbtc token
- **Nakamoto Support**: Full compatibility with Nakamoto upgrade
- **POX-4**: Updated for latest Stacks protocol
- **Enhanced Protocols**: Hermetica, Arkadiko, Velar, Bitflow integrations
- **Position Architecture**: Flexible protocol integration system
- **Advanced Rewards**: Multi-asset reward distribution

### Core Contracts

- `stacking-dao-core-v4.clar` - Main user-facing contract (STX stacking)
- `stacking-dao-core-v6.clar` - Latest core with optimizations
- `stacking-dao-core-btc-v3.clar` - BTC rewards handling
- `rewards-v5.clar` - Enhanced reward distribution
- `direct-helpers-v4.clar` - Improved helper functions
- `data-core-v3.clar` - Advanced data management
- `swap-ststx-ststxbtc-v2.clar` - Token swapping functionality

### Tokens

- `ststx-token` - Liquid stacking token (STX rewards)
- `ststxbtc-token-v2` - BTC rewards token
- `ststx-withdraw-nft-v2` - Withdrawal NFT

### Integrations

- Hermetica (BTC rewards)
- Arkadiko (Collateral/Vaults)
- Velar (DEX)
- Bitflow (Liquidity)

### Migration from v2

See [Migration Guide: v2 → v3](#migration-v2-to-v3)

---

## Version 2

**Status**: ⚠️ **Maintenance Mode**  
**Release**: 2024-11  
**Audit**: Clarity Alliance (Nov 2024, Jan 2025)

### Key Features

- **Delegated Stacking**: Pool-based stacking with delegates
- **Protocol Integrations**: Arkadiko, Velar, Bitflow
- **Enhanced Architecture**: Modular design with traits
- **Improved Withdrawals**: NFT-based withdrawal system v2
- **Commission System**: Flexible fee management

### Core Contracts

- `stacking-dao-core-v2.clar` - Main user contract
- `stacking-dao-core-v3.clar` - Improved version
- `stacking-pool-v1.clar` - Pool management
- `native-stacking-pool-v1.clar` - Native stacking support
- `rewards-v2.clar` - Reward distribution
- `direct-helpers-v1.clar` / `v2.clar` - Helper utilities

### Delegates

- 6 delegate contracts (`stacking-delegate-1-1` through `stacking-delegate-2-3`)
- Managed via `delegates-handler-v1.clar`

### When to Use v2

- Existing integrations not yet migrated to v3
- Stable production environments requiring minimal changes
- Projects avoiding Nakamoto-specific features

---

## Version 1

**Status**: ❌ **Deprecated**  
**Release**: 2023-11  
**Audit**: CoinFabrik (Nov 2023)

### Overview

Initial StackingDAO implementation with basic stacking pool functionality.

### Core Contracts

- `stacking-dao-core-v1.clar` - Original implementation
- `reserve-v1.clar` - STX reserve management
- `commission-v1.clar` - Basic fee system
- `strategy-v0.clar` - Initial strategy
- `staking-v0.clar` - Basic staking

### Stackers

- 10 stacker contracts (`stacker-1` through `stacker-10`)

### Why Deprecated

- Limited scalability compared to v2/v3
- No delegated stacking support
- Missing modern protocol integrations
- Superseded by more efficient architectures

### Migration from v1

⚠️ **Direct migration to v3 recommended** - See [Migration Guide: v1 → v3](#migration-v1-to-v3)

---

## Helper Contracts

### Block Info Helpers

Multiple versions for different network states:

| Contract | Purpose | Status |
|----------|---------|--------|
| `block-info-v20` | Latest Nakamoto | ✅ Active |
| `block-info-v17` | Nakamoto | ✅ Active |
| `block-info-v11` | Pre-Nakamoto | ⚠️ Legacy |
| `block-info-v10` | Pre-Nakamoto | ⚠️ Legacy |
| Earlier versions | Historical | ❌ Deprecated |

### Traits

- `sip-010-trait-ft-standard` - Fungible token standard
- `nft-trait` - NFT standard
- `commission-trait` - Fee interface
- `reserve-trait-v1` - Reserve interface
- `staking-trait-v1` - Staking interface
- `stacking-delegate-trait-v1` - Delegate interface
- `rewards-trait-v1` - Rewards interface
- `protocol-trait-v1` - Protocol integration interface
- `position-trait-v1` - Position-based interface

---

## Experimental Contracts

**Location**: `contracts/version-x/`

### Work in Progress

- `strategy-v3-wip.clar` - Experimental strategy (⚠️ **Not production ready**)
- `sdao-token.clar` - Governance token (🚧 **Under development**)
- `staking-v1.clar` - New staking mechanism

⚠️ **Warning**: Contracts in `version-x/` are experimental and should NOT be used in production.

---

## Migration Guides

### Migration: v2 → v3

**Recommended Timeline**: Q1 2026

#### Breaking Changes

1. **POX-4 Update**: Ensure compatibility with POX-4
2. **BTC Rewards**: New token type (stSTXbtc)
3. **Data Architecture**: New data-core-v3 structure
4. **Helper Changes**: direct-helpers-v4 with new signatures

#### Migration Steps

1. **Audit Current Integration**
   ```clarity
   ;; Review your v2 contract calls
   (contract-call? .stacking-dao-core-v3 deposit ...)
   ```

2. **Update Contract References**
   ```clarity
   ;; Old (v2)
   (contract-call? .stacking-dao-core-v3 deposit ...)
   
   ;; New (v3)
   (contract-call? .stacking-dao-core-v6 deposit ...)
   ```

3. **Handle New Response Types**
   - Check for additional return values
   - Update error handling

4. **Test on Testnet**
   - Deploy to testnet
   - Run full integration tests
   - Verify reward distribution

5. **Gradual Rollout**
   - Begin with small amounts
   - Monitor for issues
   - Scale up progressively

### Migration: v1 → v3

**Status**: Direct migration recommended (skip v2)

1. **Withdraw from v1**: Complete all pending withdrawals
2. **Burn v1 NFTs**: Clear all v1 positions
3. **Fresh Deposit to v3**: Start with v3 contracts
4. **Archive v1 Integration**: Keep for reference only

---

## Version Selection Guide

### Choose v3 if:

✅ Building new integration  
✅ Want BTC rewards  
✅ Need Nakamoto features  
✅ Seeking latest optimizations  
✅ Long-term maintenance preferred  

### Stay on v2 if:

⚠️ Existing stable production system  
⚠️ Migration resources limited  
⚠️ No need for new features  
⚠️ Planning future migration

### Avoid v1:

❌ All new projects  
❌ Active development  

---

## Support & Questions

- **Documentation**: See [docs/](docs/) for detailed guides
- **Discord**: https://discord.gg/stackingdao
- **GitHub Issues**: For bug reports and feature requests

---

*Last updated: December 2025*
