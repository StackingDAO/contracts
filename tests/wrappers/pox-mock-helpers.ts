import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet/index.ts';
import { hexDecode } from './tests-utils.ts';

// ---------------------------------------------------------
// PoX-3 Mock
// ---------------------------------------------------------

class Pox3Mock {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  burnHeightForRewardCycle(height: number) {
    return this.chain.callReadOnlyFn("pox-3-mock", "burn-height-to-reward-cycle", [
      types.uint(height),
    ], this.deployer.address);
  }

  getStackerInfo(stacker: string) {
    return this.chain.callReadOnlyFn("pox-3-mock", "get-stacker-info", [
      types.principal(stacker),
    ], this.deployer.address);
  }

  unlock(caller: Account, account: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("pox-3-mock", "unlock-mock", [
        types.principal(account),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

}
export { Pox3Mock };

// ---------------------------------------------------------
// PoX-4 Mock
// ---------------------------------------------------------

class Pox4Mock {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getPoxInfo() {
    return this.chain.callReadOnlyFn("pox-4-mock", "get-pox-info", [], this.deployer.address);
  }


  burnHeightForRewardCycle(height: number) {
    return this.chain.callReadOnlyFn("pox-4-mock", "burn-height-to-reward-cycle", [
      types.uint(height),
    ], this.deployer.address);
  }

  getStackerInfo(stacker: string) {
    return this.chain.callReadOnlyFn("pox-4-mock", "get-stacker-info", [
      types.principal(stacker),
    ], this.deployer.address);
  }

  getCheckDelegation(stacker: string) {
    return this.chain.callReadOnlyFn("pox-4-mock", "get-check-delegation", [
      types.principal(stacker),
    ], this.deployer.address);
  }

  getPartialStackedByCycle(rewardCycle: number, pool: string) {
    return this.chain.callReadOnlyFn("pox-4-mock", "get-partial-stacked-by-cycle", [
      types.tuple({ 'version': '0x04', 'hashbytes': '0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc'}),
      types.uint(rewardCycle),
      types.principal(pool),
    ], this.deployer.address);
  }

  getSignerKeyMessageHash(rewardCycle: number, topic: string, authId: number) {
    return this.chain.callReadOnlyFn("pox-4-mock", "get-signer-key-message-hash", [
      types.tuple({ 'version': '0x04', 'hashbytes': '0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc'}),
      types.uint(rewardCycle),
      types.ascii(topic),
      types.uint(1),
      types.uint(999999999 * 1000000),
      types.uint(authId),
    ], this.deployer.address);
  }

  verifySignerKeySig(rewardCycle: number, topic: string, signerSig: string, signerKey: string, authId: number) {
    return this.chain.callReadOnlyFn("pox-4-mock", "verify-signer-key-sig", [
      types.tuple({ 'version': '0x04', 'hashbytes': '0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc'}),
      types.uint(rewardCycle),
      types.ascii(topic),
      types.uint(1),
      types.some(types.buff(hexDecode(signerSig))),
      types.buff(hexDecode(signerKey)),
      types.uint(999999999 * 1000000),
      types.uint(999999999 * 1000000),
      types.uint(authId),
    ], this.deployer.address);
  }

  unlock(caller: Account, account: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("pox-4-mock", "unlock-mock", [
        types.principal(account),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  allowContractCaller(caller: Account, contract: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("pox-4-mock", "allow-contract-caller", [
        types.principal(contract),
        types.none()
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }


}
export { Pox4Mock };
