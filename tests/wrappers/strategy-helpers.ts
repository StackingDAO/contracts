import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet/index.ts';
import { hexToBytes, qualifiedName } from './tests-utils.ts';

// ---------------------------------------------------------
// Strategy V0
// ---------------------------------------------------------

class StrategyV0 {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getLastCyclePerformed() {
    return this.chain.callReadOnlyFn("strategy-v0", "get-last-cycle-performed", [
    ], this.deployer.address);
  }

  getPoxRewardAddress() {
    return this.chain.callReadOnlyFn("strategy-v0", "get-pox-reward-address", [
    ], this.deployer.address);
  }

  getPoxCycle() {
    return this.chain.callReadOnlyFn("strategy-v0", "get-pox-cycle", [
    ], this.deployer.address);
  }

  getNextCycleStartBurnHeight() {
    return this.chain.callReadOnlyFn("strategy-v0", "get-next-cycle-start-burn-height", [
    ], this.deployer.address);
  }

  getTotalStacking() {
    return this.chain.callReadOnlyFn("strategy-v0", "get-total-stacking", [
    ], this.deployer.address);
  }

  getInflowOutflow() {
    return this.chain.callReadOnlyFn("strategy-v0", "get-outflow-inflow", [
    ], this.deployer.address);
  }

  stackersGetTotalStacking(stackerId: number) {
    return this.chain.callReadOnlyFn("strategy-v0", "stackers-get-total-stacking", [
      types.uint(stackerId)
    ], this.deployer.address);
  }

  setPoxRewardAddress(caller: Account, version: Uint8Array, hashbytes: Uint8Array) {
    let block = this.chain.mineBlock([
      Tx.contractCall("strategy-v0", "set-pox-reward-address", [
        types.tuple({
          version: types.buff(version),
          hashbytes: types.buff(hashbytes)
        }),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  performInflow(caller: Account, stackingAmounts: number[]) {
    let block = this.chain.mineBlock([
      Tx.contractCall("strategy-v0", "perform-inflow", [
        types.list(stackingAmounts.map(amount => types.uint(amount * 1000000)))
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  performOutflow(caller: Account, stackersToStop: boolean[]) {
    let block = this.chain.mineBlock([
      Tx.contractCall("strategy-v0", "perform-outflow", [
        types.list(stackersToStop.map(stop => types.bool(stop)))
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  stackersReturnStx(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("strategy-v0", "stackers-return-stx", [
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

}
export { StrategyV0 };

// ---------------------------------------------------------
// Strategy V1
// ---------------------------------------------------------

class StrategyV1 {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getLastCyclePerformed() {
    return this.chain.callReadOnlyFn("strategy-v1", "get-last-cycle-performed", [
    ], this.deployer.address);
  }

  getPoxRewardAddress() {
    return this.chain.callReadOnlyFn("strategy-v1", "get-pox-reward-address", [
    ], this.deployer.address);
  }

  getPoxCycle() {
    return this.chain.callReadOnlyFn("strategy-v1", "get-pox-cycle", [
    ], this.deployer.address);
  }

  getNextCycleStartBurnHeight() {
    return this.chain.callReadOnlyFn("strategy-v1", "get-next-cycle-start-burn-height", [
    ], this.deployer.address);
  }

  getStackingMinimum() {
    return this.chain.callReadOnlyFn("strategy-v1", "get-stacking-minimum", [
    ], this.deployer.address);
  }

  getPrepareCycleLength() {
    return this.chain.callReadOnlyFn("strategy-v1", "get-prepare-cycle-length", [
    ], this.deployer.address);
  }

  getTotalStacking() {
    return this.chain.callReadOnlyFn("strategy-v1", "get-total-stacking", [
    ], this.deployer.address);
  }

  getInflowOutflow() {
    return this.chain.callReadOnlyFn("strategy-v1", "get-outflow-inflow", [
    ], this.deployer.address);
  }

  calculateInflow(inflow: number) {
    return this.chain.callReadOnlyFn("strategy-v1", "calculate-inflow", [
      types.uint(inflow * 1000000)
    ], this.deployer.address);
  }

  calculateOutflow(outflow: number) {
    return this.chain.callReadOnlyFn("strategy-v1", "calculate-outflow", [
      types.uint(outflow * 1000000)
    ], this.deployer.address);
  }

  stackersGetTotalStacking(stackerId: number) {
    return this.chain.callReadOnlyFn("strategy-v1", "stackers-get-total-stacking", [
      types.uint(stackerId)
    ], this.deployer.address);
  }

  setPoxRewardAddress(caller: Account, version: Uint8Array, hashbytes: Uint8Array) {
    let block = this.chain.mineBlock([
      Tx.contractCall("strategy-v1", "set-pox-reward-address", [
        types.tuple({
          version: types.buff(version),
          hashbytes: types.buff(hashbytes)
        }),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  performStacking(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("strategy-v1", "perform-stacking", [
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  performInflow(caller: Account, stackingAmounts: number[]) {
    let block = this.chain.mineBlock([
      Tx.contractCall("strategy-v1", "perform-inflow", [
        types.list(stackingAmounts.map(amount => types.uint(amount * 1000000)))
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  performOutflow(caller: Account, stackersToStop: boolean[]) {
    let block = this.chain.mineBlock([
      Tx.contractCall("strategy-v1", "perform-outflow", [
        types.list(stackersToStop.map(stop => types.bool(stop)))
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  stackersReturnStx(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("strategy-v1", "stackers-return-stx", [
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

}
export { StrategyV1 };

// ---------------------------------------------------------
// Strategy V2
// ---------------------------------------------------------

class StrategyV2 {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getTotalStacking() {
    return this.chain.callReadOnlyFn("strategy-v2", "get-total-stacking", [
    ], this.deployer.address);
  }

  getInflowOutflow() {
    return this.chain.callReadOnlyFn("strategy-v2", "get-outflow-inflow", [
    ], this.deployer.address);
  }

  performPoolDelegation(caller: Account, pool: string, delegatesInfo: any[]) {
    let block = this.chain.mineBlock([
      Tx.contractCall("strategy-v2", "perform-pool-delegation", [
        types.principal(pool),
        types.list(delegatesInfo.map(info => types.tuple({ delegate: types.principal(info.delegate), amount: types.uint(info.amount * 1000000) })))
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

}
export { StrategyV2 };

// ---------------------------------------------------------
// Strategy V3
// ---------------------------------------------------------

class StrategyV3 {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getCyclePreparedPools() {
    return this.chain.callReadOnlyFn("strategy-v3", "get-cycle-prepared-pools", [
    ], this.deployer.address);
  }

  getPreparePoolsData(pool: string) {
    return this.chain.callReadOnlyFn("strategy-v3", "get-prepare-pools-data", [
      types.principal(pool),
    ], this.deployer.address);
  }

  getPrepareDelegatesData(delegate: string) {
    return this.chain.callReadOnlyFn("strategy-v3", "get-prepare-delegates-data", [
      types.principal(delegate),
    ], this.deployer.address);
  }

  preparePools(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("strategy-v3", "prepare-pools", [
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  prepareDelegates(caller: Account, pool: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("strategy-v3", "prepare-delegates", [
        types.principal(pool)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  execute(caller: Account, pool: string, delegates: string[]) {
    let block = this.chain.mineBlock([
      Tx.contractCall("strategy-v3", "execute", [
        types.principal(pool),
        types.list(delegates.map(item => types.principal(item))),
        types.principal(qualifiedName("reserve-v1")),
        types.principal(qualifiedName("rewards-v2"))
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  returnUnlockedStx(caller: Account, delegates: string[]) {
    let block = this.chain.mineBlock([
      Tx.contractCall("strategy-v3", "return-unlocked-stx", [
        types.list(delegates.map(item => types.principal(item))),
        types.principal(qualifiedName("reserve-v1")),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

}
export { StrategyV3 };

// ---------------------------------------------------------
// Strategy V3 - Algo V1
// ---------------------------------------------------------

class StrategyV3AlgoV1 {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  calculateLowestCombination(outflow: number, locked: number[]) {
    return this.chain.callReadOnlyFn("strategy-v3-algo-v1", "calculate-lowest-combination", [
      types.uint(outflow * 1000000),
      types.list(locked.map(lock => types.uint(lock * 1000000)))
    ], this.deployer.address);
  }

  calculateReachTarget(target: number[], locked: number[]) {
    return this.chain.callReadOnlyFn("strategy-v3-algo-v1", "calculate-reach-target", [
      types.list(target.map(item => types.uint(item * 1000000))),
      types.list(locked.map(item => types.uint(item * 1000000)))
    ], this.deployer.address);
  }

}
export { StrategyV3AlgoV1 };

// ---------------------------------------------------------
// Strategy V3 - Pools V1
// ---------------------------------------------------------

class StrategyV3PoolsV1 {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  calculateNewAmounts() {
    return this.chain.callReadOnlyFn("strategy-v3-pools-v1", "calculate-new-amounts", [
    ], this.deployer.address);
  }

  calculateStackingPerPool() {
    return this.chain.callReadOnlyFn("strategy-v3-pools-v1", "calculate-stacking-per-pool", [
    ], this.deployer.address);
  }

  calculateStackingTargetForPool(pool: string, newTotalNormalStacking: number, newTotalDirectStacking: number) {
    return this.chain.callReadOnlyFn("strategy-v3-pools-v1", "calculate-stacking-target-for-pool", [
      types.principal(pool),
      types.uint(newTotalNormalStacking * 1000000),
      types.uint(newTotalDirectStacking * 1000000),
    ], this.deployer.address);
  }

}
export { StrategyV3PoolsV1 };

// ---------------------------------------------------------
// Strategy V3 - Delegates V1
// ---------------------------------------------------------

class StrategyV3DelegatesV1 {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  calculateStackingPerDelegate(pool: string, totalToStack: number) {
    return this.chain.callReadOnlyFn("strategy-v3-delegates-v1", "calculate-stacking-per-delegate", [
      types.principal(pool),
      types.uint(totalToStack * 1000000)
    ], this.deployer.address);
  }

  calculateLockedForPool(pool: string) {
    return this.chain.callReadOnlyFn("strategy-v3-delegates-v1", "calculate-locked-for-pool", [
      types.principal(pool),
    ], this.deployer.address);
  }

}
export { StrategyV3DelegatesV1 };


// ---------------------------------------------------------
// Strategy V4
// ---------------------------------------------------------

class StrategyV4 {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getManager() {
    return this.chain.callReadOnlyFn("strategy-v4", "get-manager", [
    ], this.deployer.address);
  }

  getTotalStacking() {
    return this.chain.callReadOnlyFn("strategy-v4", "get-total-stacking", [
    ], this.deployer.address);
  }

  getInflowOutflow() {
    return this.chain.callReadOnlyFn("strategy-v4", "get-outflow-inflow", [
    ], this.deployer.address);
  }

  performPoolDelegation(caller: Account, pool: string, delegatesInfo: any[]) {
    let block = this.chain.mineBlock([
      Tx.contractCall("strategy-v4", "perform-pool-delegation", [
        types.principal(pool),
        types.list(delegatesInfo.map(info => types.tuple({ delegate: types.principal(info.delegate), amount: types.uint(info.amount * 1000000) })))
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setManager(caller: Account, manager: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("strategy-v4", "set-manager", [
        types.principal(manager),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }
}
export { StrategyV4 };
