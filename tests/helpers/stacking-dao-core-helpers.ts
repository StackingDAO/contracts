import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet/index.ts';
import { qualifiedName } from './tests-utils.ts';

// ---------------------------------------------------------
// Core
// ---------------------------------------------------------

class Core {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getCommission() {
    return this.chain.callReadOnlyFn("stacking-dao-core-v1", "get-commission", [], this.deployer.address);
  }

  getShutdownDeposits() {
    return this.chain.callReadOnlyFn("stacking-dao-core-v1", "get-shutdown-deposits", [], this.deployer.address);
  }

  getCycleInfo(cycle: number) {
    return this.chain.callReadOnlyFn("stacking-dao-core-v1", "get-cycle-info", [
      types.uint(cycle)
    ], this.deployer.address);
  }

  getWithdrawalsByNft(nftId: number) {
    return this.chain.callReadOnlyFn("stacking-dao-core-v1", "get-withdrawals-by-nft", [
      types.uint(nftId),
    ], this.deployer.address);
  }

  getBurnHeight() {
    return this.chain.callReadOnlyFn("stacking-dao-core-v1", "get-burn-height", [], this.deployer.address);
  }

  getPoxCycle() {
    return this.chain.callReadOnlyFn("stacking-dao-core-v1", "get-pox-cycle", [], this.deployer.address);
  }

  getStxBalance(address: string) {
    return this.chain.callReadOnlyFn("stacking-dao-core-v1", "get-stx-balance", [
      types.principal(address),
    ], this.deployer.address);
  }

  getNextWithdrawCycle() {
    return this.chain.callReadOnlyFn("stacking-dao-core-v1", "get-next-withdraw-cycle", [
    ], this.deployer.address);
  }

  getStxPerStstx() {
    return this.chain.callReadOnlyFn("stacking-dao-core-v1", "get-stx-per-ststx", [
      types.principal(qualifiedName("reserve-v1"))
    ], this.deployer.address);
  }

  deposit(caller: Account, amount: number, referrer: string = undefined) {
    let referrerType = types.none();
    if (referrer) {
      referrerType = types.some(types.principal(referrer))
    }

    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-dao-core-v1", "deposit", [
        types.principal(qualifiedName("reserve-v1")),
        types.uint(amount * 1000000),
        referrerType
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  initWithdraw(caller: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-dao-core-v1", "init-withdraw", [
        types.principal(qualifiedName("reserve-v1")),
        types.uint(amount * 1000000)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  withdraw(caller: Account, nftId: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-dao-core-v1", "withdraw", [
        types.principal(qualifiedName("reserve-v1")),
        types.uint(nftId),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  addRewards(caller: Account, amount: number, cycle: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-dao-core-v1", "add-rewards", [
        types.principal(qualifiedName("commission-v1")),
        types.principal(qualifiedName("staking-v1")),
        types.principal(qualifiedName("reserve-v1")),
        types.uint(amount * 1000000),
        types.uint(cycle)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setCommission(caller: Account, commission: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-dao-core-v1", "set-commission", [
        types.uint(commission * 10000),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setShutdownDeposits(caller: Account, shutdown: boolean) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-dao-core-v1", "set-shutdown-deposits", [
        types.bool(shutdown),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

}
export { Core };
