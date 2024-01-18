import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet/index.ts';
import { qualifiedName } from './tests-utils.ts';

// ---------------------------------------------------------
// DAO
// ---------------------------------------------------------

class DAO {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getContractsEnabled() {
    return this.chain.callReadOnlyFn("dao", "get-contracts-enabled", [
    ], this.deployer.address);
  }

  getContractActive(address: string) {
    return this.chain.callReadOnlyFn("dao", "get-contract-active", [
      types.principal(address)
    ], this.deployer.address);
  }

  getAdmin(address: string) {
    return this.chain.callReadOnlyFn("dao", "get-admin", [
      types.principal(address)
    ], this.deployer.address);
  }

  checkIsEnabled(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("dao", "check-is-enabled", [
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  checkIsProtocol(caller: Account, address: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("dao", "check-is-protocol", [
        types.principal(address),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  checkIsAdmin(caller: Account, address: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("dao", "check-is-admin", [
        types.principal(address),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setContractsEnabled(caller: Account, enabled: boolean) {
    let block = this.chain.mineBlock([
      Tx.contractCall("dao", "set-contracts-enabled", [
        types.bool(enabled),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setContractActive(caller: Account, address: string, active: boolean) {
    let block = this.chain.mineBlock([
      Tx.contractCall("dao", "set-contract-active", [
        types.principal(address),
        types.bool(active),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setAdmin(caller: Account, address: string, active: boolean) {
    let block = this.chain.mineBlock([
      Tx.contractCall("dao", "set-admin", [
        types.principal(address),
        types.bool(active),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

}
export { DAO };
