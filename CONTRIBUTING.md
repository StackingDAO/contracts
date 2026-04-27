# Contributing to StackingDAO Contracts

Thank you for your interest in contributing to StackingDAO! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Security](#security)

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Prioritize protocol security and user safety

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or inflammatory comments
- Publishing others' private information
- Malicious code submissions

## Getting Started

### Prerequisites

1. **Install Dependencies**
   ```bash
   # Install Clarinet v2.11.2+
   curl -L https://github.com/hirosystems/clarinet/releases/latest/download/clarinet-macos-x64.tar.gz | tar xz
   
   # Install Stacks CLI
   npm install -g @stacks/cli
   ```

2. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/StackingDAO-Contracts.git
   cd StackingDAO-Contracts
   ```

3. **Verify Setup**
   ```bash
   clarinet --version
   clarinet test
   ```

### Understanding the Codebase

- **Core Contracts**: `contracts/core/` - DAO, tokens, NFTs
- **Version 3**: `contracts/version-3/` - Latest production
- **Helpers**: `contracts/helpers/` - Utilities and traits
- **Tests**: `tests/` - Test files
- **Docs**: `docs/` - Documentation

Read [docs/architecture.md](docs/architecture.md) for detailed overview.

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

**Branch Naming**:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `test/` - Test improvements
- `refactor/` - Code refactoring

### 2. Make Changes

- Write clear, focused commits
- Follow coding standards (see below)
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run all tests
clarinet test

# Run specific test
clarinet test tests/your-test_test.ts

# Check contract syntax
clarinet check

# Generate coverage
clarinet test --coverage
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat: add new stacking feature"
```

**Commit Message Format**:
```
<type>: <short summary>

<optional detailed description>

<optional footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Testing
- `refactor`: Code refactoring
- `chore`: Maintenance

**Examples**:
```
feat: add BTC reward distribution to core contract

Implements BTC reward claiming functionality for stSTXbtc holders.
Integrates with Hermetica protocol for reward calculation.

Closes #123
```

## Coding Standards

### Clarity Style Guide

#### Naming Conventions

```clarity
;; Constants: UPPER_SNAKE_CASE
(define-constant ERR_UNAUTHORIZED (err u1000))
(define-constant DENOMINATOR_BPS u10000)

;; Variables: kebab-case
(define-data-var total-stacked uint u0)
(define-data-var shutdown-deposits bool false)

;; Functions: kebab-case
(define-public (deposit-stx (amount uint))
  ;; ...
)

(define-read-only (get-stx-balance)
  ;; ...
)

;; Private functions: prefix with internal-
(define-private (internal-calculate-rewards)
  ;; ...
)
```

#### Code Organization

```clarity
;; 1. Contract header with documentation
;; @title Contract Name
;; @version X.Y.Z
;; @description Brief description

;; 2. Use-trait declarations
(use-trait ft-trait .sip-010-trait-ft-standard.sip-010-trait)

;; 3. Constants
(define-constant ERR_UNAUTHORIZED (err u1000))

;; 4. Data variables
(define-data-var admin principal tx-sender)

;; 5. Data maps
(define-map balances principal uint)

;; 6. Private functions
(define-private (internal-helper) ...)

;; 7. Read-only functions (getters)
(define-read-only (get-balance) ...)

;; 8. Public functions
(define-public (deposit) ...)
```

#### Documentation

```clarity
;; @function deposit-stx
;; @description Deposits STX and mints stSTX tokens
;; @param amount - Amount of STX to deposit in micro-STX
;; @returns {ststx-amount: uint} - Amount of stSTX minted
;; @throws ERR_DEPOSITS_DISABLED if deposits are shut down
;; @throws ERR_AMOUNT_TOO_LOW if amount below minimum
(define-public (deposit-stx (amount uint))
  ;; Implementation
)
```

#### Error Handling

```clarity
;; Define clear error codes
(define-constant ERR_UNAUTHORIZED (err u1000))
(define-constant ERR_INSUFFICIENT_BALANCE (err u1001))
(define-constant ERR_INVALID_AMOUNT (err u1002))

;; Use descriptive error messages in tests
(asserts! (is-eq tx-sender admin) ERR_UNAUTHORIZED)

;; Handle errors gracefully
(match (contract-call? .external-contract some-function)
  success (ok success)
  error (err ERR_EXTERNAL_CALL_FAILED)
)
```

### Code Quality

- **No Magic Numbers**: Use named constants
- **DRY Principle**: Don't repeat yourself
- **Single Responsibility**: Each function does one thing
- **Fail Fast**: Check conditions early
- **Gas Efficiency**: Optimize for lower costs

### Example: Good vs Bad

❌ **Bad**:
```clarity
(define-public (deposit (amt uint))
  (begin
    (try! (stx-transfer? amt tx-sender (as-contract tx-sender)))
    (ok true)
  )
)
```

✅ **Good**:
```clarity
;; @function deposit
;; @description Deposit STX into the reserve
;; @param amount - Amount in micro-STX to deposit
;; @returns (ok uint) - Deposit ID on success
(define-public (deposit (amount uint))
  (let (
    (sender tx-sender)
    (deposit-id (var-get next-deposit-id))
  )
    ;; Validate amount
    (asserts! (>= amount MIN_DEPOSIT) ERR_AMOUNT_TOO_LOW)
    
    ;; Transfer STX
    (try! (stx-transfer? amount sender (as-contract tx-sender)))
    
    ;; Record deposit
    (map-set deposits deposit-id {
      user: sender,
      amount: amount,
      timestamp: block-height
    })
    
    ;; Update counter
    (var-set next-deposit-id (+ deposit-id u1))
    
    ;; Emit event
    (print {
      event: "deposit",
      deposit-id: deposit-id,
      amount: amount
    })
    
    (ok deposit-id)
  )
)
```

## Testing Requirements

### Test Coverage

All new code must include tests covering:

1. **Happy Path**: Normal operation
2. **Edge Cases**: Boundary conditions
3. **Error Cases**: All error conditions
4. **Access Control**: Authorization checks
5. **State Changes**: Data consistency

### Test Structure

```typescript
// tests/feature_test.ts
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet/index.ts';
import { assertEquals } from 'https://deno.land/std/testing/asserts.ts';

Clarinet.test({
  name: "Ensure deposit increases balance",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;
    
    let block = chain.mineBlock([
      Tx.contractCall(
        'stacking-dao-core-v3',
        'deposit',
        [types.uint(1000000)],
        user1.address
      )
    ]);
    
    block.receipts[0].result.expectOk();
    assertEquals(block.receipts[0].events.length, 2);
  }
});
```

### Minimum Coverage

- **Critical Contracts**: 90%+ coverage
- **Helper Contracts**: 80%+ coverage
- **Test Contracts**: Not required

## Pull Request Process

### Before Submitting

- [ ] Tests pass: `clarinet test`
- [ ] Contracts check: `clarinet check`
- [ ] Code follows style guide
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (for notable changes)
- [ ] No merge conflicts with `main`

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe testing performed

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No security concerns
- [ ] Follows coding standards
```

### Review Process

1. **Automated Checks**: CI must pass
2. **Code Review**: At least 1 approval required
3. **Security Review**: For critical contracts
4. **Testing**: Reviewer verifies tests
5. **Merge**: Squash and merge to `main`

### Review Time

- Small fixes: 1-2 days
- Features: 3-7 days
- Major changes: 1-2 weeks

## Security

### Security-Sensitive Changes

For changes affecting:
- Access control
- Fund transfers
- Reward calculations
- Core stacking logic

**Additional Requirements**:
- Detailed security analysis in PR
- Multiple reviewer approvals
- Extended testing period
- Potential external audit

### Reporting Vulnerabilities

**DO NOT** create public issues for security vulnerabilities.

See [SECURITY.md](SECURITY.md) for responsible disclosure process.

## Questions?

- **Discord**: https://discord.gg/stackingdao
- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bugs and feature requests

## Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes
- Project documentation

Thank you for contributing! 🚀
