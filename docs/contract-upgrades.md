# Contract Upgrades

Guide for migrating between StackingDAO contract versions.

## Table of Contents

- [Overview](#overview)
- [v1 to v2 Migration](#v1-to-v2-migration)
- [v2 to v3 Migration](#v2-to-v3-migration)
- [Best Practices](#best-practices)

## Overview

This document provides step-by-step migration guides for upgrading between StackingDAO contract versions.

## v1 to v2 Migration

### Breaking Changes

1. **Architecture**: Moved from monolithic to modular trait-based design
2. **Stacking**: Added delegated stacking support
3. **Data**: Separated into data-core and data-pools
4. **Withdrawals**: Enhanced NFT-based system (v2)

### Migration Steps

1. **Complete all v1 withdrawals**
2. **Withdraw liquidity from v1**
3. **Deposit into v2 contracts**
4. **Update integration code**

See [VERSIONS.md](../VERSIONS.md#migration-v1-to-v2) for details.

## v2 to v3 Migration

### Breaking Changes

1. **POX-4**: Updated for Nakamoto
2. **BTC Rewards**: New stSTXbtc token
3. **Data Layer**: Enhanced data-core-v3
4. **Helpers**: Updated direct-helpers-v4

### Migration Steps

1. **Ensure POX-4 compatibility**
2. **Update contract references**
3. **Test on testnet first**
4. **Gradual migration**

See [VERSIONS.md](../VERSIONS.md#migration-v2-to-v3) for details.

## Best Practices

- Always test on testnet first
- Monitor during migration
- Gradual rollout recommended
- Keep old integration as fallback

---

*For detailed version information, see [VERSIONS.md](../VERSIONS.md)*
