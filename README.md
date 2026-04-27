# StackingDAO Contracts

> Clarity smart contracts for liquid stacking on the Stacks blockchain

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Clarity](https://img.shields.io/badge/clarity-v2-purple.svg)](https://clarity-lang.org/)
[![Tests](https://img.shields.io/badge/tests-passing-green.svg)](tests/)

## Overview

StackingDAO is a liquid stacking protocol that allows users to earn stacking rewards while maintaining liquidity. Users deposit STX and receive stSTX tokens that represent their stacked position and accrue rewards over time.

**Key Features:**
- 🔄 Liquid stacking with stSTX tokens
- 💰 Automatic reward distribution
- 🔐 Multiple security audits completed
- 🌐 Integration with major DeFi protocols
- ⚡ Support for direct and delegated stacking

## Architecture

The protocol consists of multiple contract versions:

- **Version 1**: Initial implementation with basic stacking pools
- **Version 2**: Enhanced with delegated stacking and protocol integrations
- **Version 3**: Latest version with BTC rewards, Nakamoto support, and advanced features

See [docs/architecture.md](docs/architecture.md) for detailed architecture documentation.

## Quick Start

### Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) v2.11.2+
- [Stacks CLI](https://docs.stacks.co/understand-stacks/command-line-interface)

### Installation

```bash
# Clone the repository
git clone https://github.com/StackingDAO/contracts.git
cd StackingDAO-Contracts

# Run tests
clarinet test

# Check contracts
clarinet check
```

## Contract Deployment

### Mainnet Addresses

> **Note:** See [docs/deployment-guide.md](docs/deployment-guide.md) for complete deployment addresses

Core contracts are deployed at:
- **DAO**: `SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.dao`
- **stSTX Token**: `SP4SZE494VC2YC5JYG7AYFQ44F5Q4PYV7DVMDPBG.ststx-token`

### Testnet Addresses

For testing, contracts are available on testnet with `ST` addresses.

## Usage Examples

### Depositing STX

```clarity
(contract-call? .stacking-dao-core-v3 deposit
  .reserve-v1
  .commission-v2
  .staking-v1
  .direct-helpers-v2
  u1000000 ;; 1 STX in micro-STX
  none     ;; optional referrer
  none     ;; optional pool
)
```

### Initiating Withdrawal

```clarity
(contract-call? .stacking-dao-core-v3 init-withdraw
  .reserve-v1
  .direct-helpers-v2
  u1000000 ;; stSTX amount
)
```

See [docs/integration-guide.md](docs/integration-guide.md) for complete examples.

## Development

### Running Tests

```bash
# Run all tests
clarinet test

# Run specific test file
clarinet test tests/stacking-dao-core-v3_test.ts

# Generate coverage report
clarinet test --coverage
```

### Contract Versions

- **Core Contracts**: `contracts/core/` - DAO, tokens, and NFTs
- **Version 1**: `contracts/version-1/` - Deprecated, maintained for reference
- **Version 2**: `contracts/version-2/` - Production (delegated stacking)
- **Version 3**: `contracts/version-3/` - Latest production version
- **Helpers**: `contracts/helpers/` - Utility contracts and traits

See [VERSIONS.md](VERSIONS.md) for version compatibility and migration guides.

## Security

StackingDAO contracts have undergone multiple professional security audits:

- **CoinFabrik** (November 2023)
- **Clarity Alliance** (November 2024)
- **Clarity Alliance** (January 2025)
- **Clarity Alliance** (June 2025)

Audit reports are available in the [`audits/`](audits/) directory.

### Reporting Vulnerabilities

Please report security vulnerabilities to security@stackingdao.com. See [SECURITY.md](SECURITY.md) for our responsible disclosure policy.

## Protocol Integrations

StackingDAO integrates with:
- **Arkadiko**: Collateral and lending
- **Velar**: DEX integration
- **Bitflow**: Liquidity pools
- **Hermetica**: BTC rewards protocol

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Resources

- **Documentation**: [docs/](docs/)
- **Website**: https://stackingdao.com
- **Discord**: https://discord.gg/stackingdao
- **Twitter**: [@StackingDAO](https://twitter.com/StackingDAO)

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

Built with ❤️ by the StackingDAO team and contributors.

Special thanks to the Stacks Foundation and the Clarity community.
