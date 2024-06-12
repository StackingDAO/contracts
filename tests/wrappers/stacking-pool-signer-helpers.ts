import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet/index.ts';
import { hexDecode } from './tests-utils.ts';

// ---------------------------------------------------------
// Stacking Pool Signer Helpers
// ---------------------------------------------------------

class StackingPoolSigner {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getPoolOwner() {
    return this.chain.callReadOnlyFn("stacking-pool-signer-v1", "get-pool-owner", [], this.deployer.address);
  }

  getPoxRewardAddress() {
    return this.chain.callReadOnlyFn("stacking-pool-signer-v1", "get-pox-reward-address", [], this.deployer.address);
  }

  getCycleToIndex(cycle: number) {
    return this.chain.callReadOnlyFn("stacking-pool-signer-v1", "get-cycle-to-index", [
      types.uint(cycle)
    ], this.deployer.address);
  }

  prepare(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-pool-signer-v1", "prepare-stacking-dao", [
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  delegateStx(caller: Account, amount: number, untilBurnHeight: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-pool-signer-v1", "delegate-stx", [
        types.uint(amount * 1000000),
        types.some(types.uint(untilBurnHeight))
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  revokeDelegateStx(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-pool-signer-v1", "revoke-delegate-stx", [
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  prepareDelegate(caller: Account, delegate: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-pool-signer-v1", "prepare-delegate", [
        types.principal(delegate)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  prepareDelegateMany(caller: Account, delegates: string[]) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-pool-signer-v1", "prepare-delegate-many", [
        types.list(delegates.map(delegate => types.principal(delegate)))
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  getStxAccount(account: string) {
    return this.chain.callReadOnlyFn("stacking-pool-signer-v1", "get-stx-account", [
      types.principal(account)
    ], this.deployer.address);
  }

  notExtendedNextCycle(delegate: string) {
    return this.chain.callReadOnlyFn("stacking-pool-signer-v1", "not-extended-next-cycle", [
      types.principal(delegate)
    ], this.deployer.address);
  }

  setPoolOwner(caller: Account, owner: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-pool-signer-v1", "set-pool-owner", [
        types.principal(owner),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  delegateStackStx(caller: Account, stacker: string, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-pool-signer-v1", "delegate-stack-stx", [
        types.principal(stacker),
        types.uint(amount * 1000000),
        types.tuple({ 'version': '0x04', 'hashbytes': '0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc'}),
        types.uint(0),
        types.uint(1),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  delegateStackExtend(caller: Account, stacker: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-pool-signer-v1", "delegate-stack-extend", [
        types.principal(stacker),
        types.tuple({ 'version': '0x04', 'hashbytes': '0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc'}),
        types.uint(1),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  delegateStackIncrease(caller: Account, stacker: string, increaseBy: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-pool-signer-v1", "delegate-stack-increase", [
        types.principal(stacker),
        types.tuple({ 'version': '0x04', 'hashbytes': '0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc'}),
        types.uint(increaseBy * 1000000)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  stackAggregationCommitIndexed(caller: Account, rewardCycle: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-pool-signer-v1", "stack-aggregation-commit-indexed", [
        types.tuple({ 'version': '0x04', 'hashbytes': '0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc'}),
        types.uint(rewardCycle),
        types.some(types.buff(hexDecode("8803ef8561476ff1abf2f70d64b624de43e1d2dd9b115eb2ca5bafdf217b9b76378a195a6544e91bb2312b512c3f60ed64091ccee9db4f2e0bb8844fd0f1775d00"))),
        types.buff(hexDecode("0390a5cac7c33fda49f70bc1b0866fa0ba7a9440d9de647fecb8132ceb76a94dfa")),
        types.uint(999999999 * 1000000),
        types.uint(11),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  stackAggregationIncrease(caller: Account, rewardCycle: number, rewardCycleIndex: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-pool-signer-v1", "stack-aggregation-increase", [
        types.tuple({ 'version': '0x04', 'hashbytes': '0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc'}),
        types.uint(rewardCycle),
        types.uint(rewardCycleIndex),
        types.some(types.buff(hexDecode("8803ef8561476ff1abf2f70d64b624de43e1d2dd9b115eb2ca5bafdf217b9b76378a195a6544e91bb2312b512c3f60ed64091ccee9db4f2e0bb8844fd0f1775d00"))),
        types.buff(hexDecode("0390a5cac7c33fda49f70bc1b0866fa0ba7a9440d9de647fecb8132ceb76a94dfa")),
        types.uint(999999999 * 1000000),
        types.uint(11),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setPoxRewardAddress(caller: Account, version: string, hashbytes: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-pool-signer-v1", "set-pox-reward-address", [
        types.tuple({ 'version': version, 'hashbytes': hashbytes}),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  async addSignatures(chain: Chain, caller: Account) {

    //
    // Get messages to sign (commit & increase)
    //

    let message = this.chain.callReadOnlyFn("pox-4-mock", "get-signer-key-message-hash", [
      types.tuple({ 'version': '0x04', 'hashbytes': '0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc'}),
      types.uint(1),
      types.ascii("agg-commit"),
      types.uint(1), // period
      types.uint(999999999 * 1000000),
      types.uint(11),
    ], this.deployer.address);
    // console.log("Message", message.result);

    message = this.chain.callReadOnlyFn("pox-4-mock", "get-signer-key-message-hash", [
      types.tuple({ 'version': '0x04', 'hashbytes': '0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc'}),
      types.uint(2),
      types.ascii("agg-commit"),
      types.uint(1), // period
      types.uint(999999999 * 1000000),
      types.uint(12),
    ], this.deployer.address);
    // console.log("Message", message.result);

    message = this.chain.callReadOnlyFn("pox-4-mock", "get-signer-key-message-hash", [
      types.tuple({ 'version': '0x04', 'hashbytes': '0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc'}),
      types.uint(3),
      types.ascii("agg-commit"),
      types.uint(1), // period
      types.uint(999999999 * 1000000),
      types.uint(13),
    ], this.deployer.address);
    // console.log("Message", message.result);

    message = this.chain.callReadOnlyFn("pox-4-mock", "get-signer-key-message-hash", [
      types.tuple({ 'version': '0x04', 'hashbytes': '0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc'}),
      types.uint(4),
      types.ascii("agg-commit"),
      types.uint(1), // period
      types.uint(999999999 * 1000000),
      types.uint(14),
    ], this.deployer.address);
    // console.log("Message", message.result);


    message = this.chain.callReadOnlyFn("pox-4-mock", "get-signer-key-message-hash", [
      types.tuple({ 'version': '0x04', 'hashbytes': '0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc'}),
      types.uint(1),
      types.ascii("agg-increase"),
      types.uint(1), // period
      types.uint(999999999 * 1000000),
      types.uint(21),
    ], this.deployer.address);
    // console.log("Message", message.result);

    message = this.chain.callReadOnlyFn("pox-4-mock", "get-signer-key-message-hash", [
      types.tuple({ 'version': '0x04', 'hashbytes': '0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc'}),
      types.uint(2),
      types.ascii("agg-increase"),
      types.uint(1), // period
      types.uint(999999999 * 1000000),
      types.uint(22),
    ], this.deployer.address);
    // console.log("Message", message.result);


    //
    // Get signatures
    //

    // Use script `create-signer-signature`


    //
    // Add info
    //

    let block = chain.mineBlock([

      Tx.contractCall("stacking-pool-signer-v1", "set-cycle-signer-info", [
        types.uint(1),
        types.ascii("agg-commit"),
        types.tuple({ 'version': '0x04', 'hashbytes': '0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc'}),
        types.uint(999999999 * 1000000),
        types.uint(11),
        // This is the public key, see script `create-signer-signature`
        types.buff(hexDecode("0390a5cac7c33fda49f70bc1b0866fa0ba7a9440d9de647fecb8132ceb76a94dfa")),
        // Signature from script
        types.buff(hexDecode("8803ef8561476ff1abf2f70d64b624de43e1d2dd9b115eb2ca5bafdf217b9b76378a195a6544e91bb2312b512c3f60ed64091ccee9db4f2e0bb8844fd0f1775d00"))
      ], caller.address),

      Tx.contractCall("stacking-pool-signer-v1", "set-cycle-signer-info", [
        types.uint(2),
        types.ascii("agg-commit"),
        types.tuple({ 'version': '0x04', 'hashbytes': '0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc'}),
        types.uint(999999999 * 1000000),
        types.uint(12),
        // This is the public key, see script `create-signer-signature`
        types.buff(hexDecode("0390a5cac7c33fda49f70bc1b0866fa0ba7a9440d9de647fecb8132ceb76a94dfa")),
        // Signature from script
        types.buff(hexDecode("5bd19e251d47e84973ed396cd41b7d4406cfe91be067b66d1312124ab57bb0293fb174dc8cf1cd5471aae6c42c3e60e23274af81d8f64b159c3a63a84eb22fb400"))
      ], caller.address),

      Tx.contractCall("stacking-pool-signer-v1", "set-cycle-signer-info", [
        types.uint(3),
        types.ascii("agg-commit"),
        types.tuple({ 'version': '0x04', 'hashbytes': '0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc'}),
        types.uint(999999999 * 1000000),
        types.uint(13),
        // This is the public key, see script `create-signer-signature`
        types.buff(hexDecode("0390a5cac7c33fda49f70bc1b0866fa0ba7a9440d9de647fecb8132ceb76a94dfa")),
        // Signature from script
        types.buff(hexDecode("ace471e2af24af570f4d6ab55b299a3efc66e4887011e81606fc2f72793cc3ba45a47d55fbb03b5bc250afb16acf5c00d28c6de480699902f12e5fdfd901f30301"))
      ], caller.address),

      Tx.contractCall("stacking-pool-signer-v1", "set-cycle-signer-info", [
        types.uint(4),
        types.ascii("agg-commit"),
        types.tuple({ 'version': '0x04', 'hashbytes': '0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc'}),
        types.uint(999999999 * 1000000),
        types.uint(14),
        // This is the public key, see script `create-signer-signature`
        types.buff(hexDecode("0390a5cac7c33fda49f70bc1b0866fa0ba7a9440d9de647fecb8132ceb76a94dfa")),
        // Signature from script
        types.buff(hexDecode("42c937f82097157685cbc6f08ede067b46f5df238f71870975aa272ad035d9e25820c50d81f76275b9575e4c495cc0f27bd94d9a77d8d4c3451b3d9ebd52fa2e01"))
      ], caller.address),



      Tx.contractCall("stacking-pool-signer-v1", "set-cycle-signer-info", [
        types.uint(1),
        types.ascii("agg-increase"),
        types.tuple({ 'version': '0x04', 'hashbytes': '0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc'}),
        types.uint(999999999 * 1000000),
        types.uint(21),
        // This is the public key, see script `create-signer-signature`
        types.buff(hexDecode("0390a5cac7c33fda49f70bc1b0866fa0ba7a9440d9de647fecb8132ceb76a94dfa")),
        // Signature from script
        types.buff(hexDecode("182e988ea0bc8f9fe14209fc1d71e4aa7d07054e3eeb1146b7dcbabd3638d4a813cd9016d96f520cdda561b242f45014b594e4d3cb70e823ac5fe3e832607cab01"))
      ], caller.address),

      Tx.contractCall("stacking-pool-signer-v1", "set-cycle-signer-info", [
        types.uint(2),
        types.ascii("agg-increase"),
        types.tuple({ 'version': '0x04', 'hashbytes': '0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc'}),
        types.uint(999999999 * 1000000),
        types.uint(22),
        // This is the public key, see script `create-signer-signature`
        types.buff(hexDecode("0390a5cac7c33fda49f70bc1b0866fa0ba7a9440d9de647fecb8132ceb76a94dfa")),
        // Signature from script
        types.buff(hexDecode("b3eda0793c4f26954385cb5e29517c33ceb22283bdbfaf80e23fa79be5f83cfd21f0f67f2c895a4018f94349d7b7a108ff06178be3f5cc022659800151b90e6c01"))
      ], caller.address),

    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectOk().expectBool(true);
    block.receipts[3].result.expectOk().expectBool(true);
    block.receipts[4].result.expectOk().expectBool(true);
    block.receipts[5].result.expectOk().expectBool(true);
  }
  
}
export { StackingPoolSigner };
