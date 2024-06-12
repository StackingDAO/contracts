import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet/index.ts';
import { qualifiedName } from './tests-utils.ts';

// ---------------------------------------------------------
// Data Pools
// ---------------------------------------------------------

class DataPools {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getStandardCommission() {
    return this.chain.callReadOnlyFn("data-pools-v1", "get-standard-commission", [
    ], this.deployer.address);
  }

  getPoolCommission(pool: string) {
    return this.chain.callReadOnlyFn("data-pools-v1", "get-pool-commission", [
        types.principal(pool)
    ], this.deployer.address);
  }

  getPoolOwnerCommission(pool: string) {
    return this.chain.callReadOnlyFn("data-pools-v1", "get-pool-owner-commission", [
        types.principal(pool)
    ], this.deployer.address);
  }

  setStandardCommission(caller: Account, commission: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("data-pools-v1", "set-standard-commission", [
        types.uint(commission)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setPoolCommission(caller: Account, pool: string, commission: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("data-pools-v1", "set-pool-commission", [
        types.principal(pool),
        types.uint(commission)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setPoolOwnerCommission(caller: Account, pool: string, receiver: string, share: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("data-pools-v1", "set-pool-owner-commission", [
        types.principal(pool),
        types.principal(receiver),
        types.uint(share * 10000)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  getActivePools() {
    return this.chain.callReadOnlyFn("data-pools-v1", "get-active-pools", [
    ], this.deployer.address);
  }

  getPoolShare(pool: string) {
    return this.chain.callReadOnlyFn("data-pools-v1", "get-pool-share", [
      types.principal(pool),
    ], this.deployer.address);
  }

  getPoolDelegates(pool: string) {
    return this.chain.callReadOnlyFn("data-pools-v1", "get-pool-delegates", [
      types.principal(pool),
    ], this.deployer.address);
  }

  getDelegateShare(delegate: string) {
    return this.chain.callReadOnlyFn("data-pools-v1", "get-delegate-share", [
      types.principal(delegate),
    ], this.deployer.address);
  }

  setActivePools(caller: Account, pools: string[]) {
    let block = this.chain.mineBlock([
      Tx.contractCall("data-pools-v1", "set-active-pools", [
        types.list(pools.map(pool => types.principal(pool))),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setPoolShare(caller: Account, pool: string, share: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("data-pools-v1", "set-pool-share", [
        types.principal(pool),
        types.uint(share)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setPoolDelegates(caller: Account, pool: string, delegates: string[]) {
    let block = this.chain.mineBlock([
      Tx.contractCall("data-pools-v1", "set-pool-delegates", [
        types.principal(pool),
        types.list(delegates.map(delegate => types.principal(delegate))),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setDelegateShare(caller: Account, delegate: string, share: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("data-pools-v1", "set-delegate-share", [
        types.principal(delegate),
        types.uint(share)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

}
export { DataPools };
