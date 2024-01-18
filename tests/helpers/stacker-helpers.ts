import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet/index.ts';
import { qualifiedName } from './tests-utils.ts';

// ---------------------------------------------------------
// Stacker
// ---------------------------------------------------------

class Stacker {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getStackingUnlockBurnHeight(stackerId: number) {
    return this.chain.callReadOnlyFn("stacker-" + stackerId, "get-stacking-unlock-burn-height", [], this.deployer.address);
  }

  getStackingStxStacked(stackerId: number) {
    return this.chain.callReadOnlyFn("stacker-" + stackerId, "get-stacking-stx-stacked", [], this.deployer.address);
  }

  getStxBalance(stackerId: number) {
    return this.chain.callReadOnlyFn("stacker-" + stackerId, "get-stx-balance", [], this.deployer.address);
  }

  getStxStacked(stackerId: number) {
    return this.chain.callReadOnlyFn("stacker-" + stackerId, "get-stx-stacked", [], this.deployer.address);
  }

  getStackerInfo(stackerId: number) {
    return this.chain.callReadOnlyFn("stacker-" + stackerId, "get-stacker-info", [], this.deployer.address);
  }

  getStxAccount(stackerId: number) {
    return this.chain.callReadOnlyFn("stacker-" + stackerId, "get-stx-account", [], this.deployer.address);
  }

  getPoxInfo(stackerId: number) {
    return this.chain.callReadOnlyFn("stacker-" + stackerId, "get-pox-info", [], this.deployer.address);
  }

  initiateStacking(stackerId: number, caller: Account, amount: number, startBurnHeight: number, lockPeriod: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacker-" + stackerId, "initiate-stacking", [
        types.principal(qualifiedName("reserve-v1")),
        types.tuple({ 'version': '0x00', 'hashbytes': '0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ac'}),
        types.uint(amount * 1000000),
        types.uint(startBurnHeight), 
        types.uint(lockPeriod) 
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  stackIncrease(stackerId: number, caller: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacker-" + stackerId, "stack-increase", [
        types.principal(qualifiedName("reserve-v1")),
        types.uint(amount * 1000000)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  stackExtend(stackerId: number, caller: Account, extendCount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacker-" + stackerId, "stack-extend", [
        types.uint(extendCount),
        types.tuple({ 'version': '0x00', 'hashbytes': '0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ac'}),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  returnStx(stackerId: number, caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacker-" + stackerId, "return-stx", [
        types.principal(qualifiedName("reserve-v1")),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }
}
export { Stacker };
