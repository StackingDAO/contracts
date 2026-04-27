# Changelog

All notable changes to the StackingDAO Contracts will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation structure
- CI/CD workflows for automated testing
- Security policy and vulnerability reporting process

### Changed
- Updated repository documentation
- Improved contract inline documentation

## [3.0.0] - 2025-06

### Added
- BTC rewards support via stSTXbtc tokens
- Nakamoto upgrade compatibility
- Integration with Hermetica protocol
- Enhanced direct stacking helpers (v4)
- Position-based architecture for protocol integrations
- Migration contract for stSTXbtc

### Changed
- Upgraded to POX-4 for Nakamoto
- Improved rewards distribution mechanism (v5)
- Enhanced data storage architecture (v3)

### Security
- Clarity Alliance audit completed (June 2025)

## [2.0.0] - 2024-11

### Added
- Delegated stacking support
- Protocol integration framework
- Arkadiko, Velar, and Bitflow integrations
- Enhanced commission system (v2)
- Stacking pool with signer support
- Direct helpers for improved UX

### Changed
- Migrated from v1 architecture to modular v2 design
- Improved withdrawal NFT system (v2)
- Enhanced data separation with data-core and data-pools

### Security
- Clarity Alliance audit completed (January 2025)
- Clarity Alliance audit completed (November 2024)

## [1.0.0] - 2023-11

### Added
- Initial StackingDAO implementation
- stSTX liquid stacking token
- Basic stacking pools (10 stackers)
- Reserve-based architecture
- Commission system (v1)
- Withdrawal NFT system
- Genesis NFT for early supporters

### Security
- CoinFabrik audit completed (November 2023)

## Historical Commits

### 2025-12-19
- Fix: Withdrawals functionality improvements
- Fix: stSTXbtc-token-v2 updates

### 2025-06
- Feat: stSTXbtc contracts and audit integration
- Feat: Audit reports added to repository

### 2024-01
- Fix: StackingDAO v2 improvements
- Fix: Genesis NFT minter v2

### 2024-01-18
- Chore: Smart contracts snapshot

## Migration Guides

### v1 to v2
See [docs/contract-upgrades.md](docs/contract-upgrades.md#v1-to-v2) for migration instructions.

### v2 to v3
See [docs/contract-upgrades.md](docs/contract-upgrades.md#v2-to-v3) for migration instructions.

## Versioning Policy

- **Major version** (X.0.0): Breaking changes, contract upgrades requiring migration
- **Minor version** (0.X.0): New features, backward compatible
- **Patch version** (0.0.X): Bug fixes, no interface changes

---

For more details on each version, see the [Git commit history](https://github.com/StackingDAO/contracts/commits/main).
