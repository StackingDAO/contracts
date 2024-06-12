import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet/index.ts';
import { qualifiedName } from './tests-utils.ts';

// ---------------------------------------------------------
// Data Direct Stacking
// ---------------------------------------------------------

class DataDirectStacking {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getDirectStackingDependence() {
    return this.chain.callReadOnlyFn("data-direct-stacking-v1", "get-direct-stacking-dependence", [], this.deployer.address);
  }

  getTotalDirectStacking() {
    return this.chain.callReadOnlyFn("data-direct-stacking-v1", "get-total-direct-stacking", [], this.deployer.address);
  }

  getDirectStackingPoolAmount(pool: string) {
    return this.chain.callReadOnlyFn("data-direct-stacking-v1", "get-direct-stacking-pool-amount", [
      types.principal(pool)
    ], this.deployer.address);
  }

  getDirectStackingUser(user: string) {
    return this.chain.callReadOnlyFn("data-direct-stacking-v1", "get-direct-stacking-user", [
      types.principal(user)
    ], this.deployer.address);
  }

  setDirectStackingDependence(caller: Account, dependence: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("data-direct-stacking-v1", "set-direct-stacking-dependence", [
        types.uint(dependence),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setTotalDirectStacking(caller: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("data-direct-stacking-v1", "set-total-direct-stacking", [
        types.uint(amount * 1000000),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setDirectStackingPoolAmount(caller: Account, pool: string, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("data-direct-stacking-v1", "set-direct-stacking-pool-amount", [
        types.principal(pool),
        types.uint(amount * 1000000),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setDirectStackingUser(caller: Account, user: string, pool: string, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("data-direct-stacking-v1", "set-direct-stacking-user", [
        types.principal(user),
        types.principal(pool),
        types.uint(amount * 1000000),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  deleteDirectStackingUser(caller: Account, user: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("data-direct-stacking-v1", "delete-direct-stacking-user", [
        types.principal(user),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  getSupportedProtocols() {
    return this.chain.callReadOnlyFn("data-direct-stacking-v1", "get-supported-protocols", [
    ], this.deployer.address);
  }

  setSupportedProtocols(caller: Account, protocols: string[]) {
    let block = this.chain.mineBlock([
      Tx.contractCall("data-direct-stacking-v1", "set-supported-protocols", [
        types.list(protocols.map(protocol => types.principal(protocol))),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

}
export { DataDirectStacking };
