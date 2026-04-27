# Security Policy

## Supported Versions

The following contract versions are currently supported with security updates:

| Version | Supported          | Status      |
| ------- | ------------------ | ----------- |
| 3.x     | :white_check_mark: | Production  |
| 2.x     | :white_check_mark: | Maintenance |
| 1.x     | :x:                | Deprecated  |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

### Responsible Disclosure

We take security seriously and appreciate the security community's efforts to responsibly disclose vulnerabilities. If you believe you have found a security vulnerability in any StackingDAO contract, please report it to us as described below.

### How to Report

**Email**: security@stackingdao.com

Please include the following information:
- Type of vulnerability
- Affected contract(s) and function(s)
- Step-by-step instructions to reproduce the issue
- Potential impact of the vulnerability
- Suggested fix (if available)

### What to Expect

1. **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
2. **Assessment**: We will assess the vulnerability and determine its severity
3. **Updates**: We will keep you informed of our progress every 7 days
4. **Resolution**: We aim to resolve critical issues within 90 days
5. **Disclosure**: We will coordinate public disclosure timing with you

### Bug Bounty

We currently do not have a formal bug bounty program, but we may offer rewards for significant vulnerability discoveries on a case-by-case basis.

## Security Audits

StackingDAO contracts have undergone multiple professional security audits:

### Completed Audits

| Date | Auditor | Version | Report |
|------|---------|---------|--------|
| June 2025 | Clarity Alliance | v3 | [View Report](audits/ClarityAlliance-2025-06.pdf) |
| January 2025 | Clarity Alliance | v2/v3 | [View Report](audits/ClarityAlliance-2025-01.pdf) |
| November 2024 | Clarity Alliance | v2 | [View Report](audits/ClarityAlliance-2024-11.pdf) |
| November 2023 | CoinFabrik | v1 | [View Report](audits/CoinFabrik-2023-11.pdf) |

### Audit Scope

Audits covered:
- Core stacking logic and token mechanics
- Withdrawal and redemption flows
- Permission controls and access management
- Reward distribution mechanisms
- Integration with external protocols
- Reentrancy and overflow protections

## Security Best Practices

### For Users

1. **Verify Contract Addresses**: Always verify you're interacting with official StackingDAO contracts
2. **Check Transactions**: Review transaction details before confirming
3. **Use Hardware Wallets**: For large amounts, use hardware wallet protection
4. **Stay Informed**: Follow official channels for security updates

### For Integrators

1. **Read the Documentation**: Review [docs/security.md](docs/security.md) thoroughly
2. **Test on Testnet**: Test all integrations on testnet first
3. **Handle Errors**: Implement proper error handling for all contract calls
4. **Monitor Contract State**: Implement monitoring for unexpected state changes
5. **Rate Limiting**: Implement appropriate rate limiting for your integration
6. **Audit Your Code**: Have your integration code audited

## Known Limitations

### Stacking Mechanics
- Withdrawals are subject to Stacks protocol unlock periods
- Reward distribution depends on stacking cycle timing
- Direct stacking has minimum threshold requirements

### Protocol Risks
- Integration with external protocols carries third-party risks
- POX contract upgrades may require protocol adaptations
- Network congestion may affect transaction confirmation times

## Security Measures

### Access Control
- Multi-signature governance for critical parameters
- DAO-controlled protocol upgrades
- Timelock mechanisms for sensitive operations

### Contract Design
- Separation of concerns across multiple contracts
- Upgradeable architecture with migration paths
- Emergency shutdown mechanisms

### Monitoring
- On-chain event monitoring
- Anomaly detection for unusual activity
- Community oversight via open-source codebase

## Incident Response

In the event of a security incident:

1. **Assessment**: Immediate triage and impact assessment
2. **Communication**: Notification to affected users via official channels
3. **Mitigation**: Deploy fixes or workarounds as appropriate
4. **Post-Mortem**: Public post-mortem analysis after resolution
5. **Prevention**: Update security measures to prevent recurrence

## Security Contacts

- **General Security**: security@stackingdao.com
- **Emergency Contact**: emergency@stackingdao.com
- **PGP Key**: Available at https://stackingdao.com/pgp

## Additional Resources

- [Clarity Security Guidelines](https://book.clarity-lang.org/ch10-00-security.html)
- [Stacks Security Best Practices](https://docs.stacks.co/write-smart-contracts/security)
- [StackingDAO Documentation](docs/)

---

*Last updated: December 2025*
