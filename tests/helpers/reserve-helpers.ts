import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet/index.ts';
import { qualifiedName } from './tests-utils.ts';

// ---------------------------------------------------------
// Reserve
// ---------------------------------------------------------

class Reserve {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getStxStacking() {
    return this.chain.callReadOnlyFn("reserve-v1", "get-stx-stacking", [], this.deployer.address);
  }

  getStxStackingAtBlock(blockHeight: number) {
    return this.chain.callReadOnlyFn("reserve-v1", "get-stx-stacking-at-block", [
      types.uint(blockHeight)
    ], this.deployer.address);
  }

  getStxBalance() {
    return this.chain.callReadOnlyFn("reserve-v1", "get-stx-balance", [], this.deployer.address);
  }

  getTotalStx() {
    return this.chain.callReadOnlyFn("reserve-v1", "get-total-stx", [], this.deployer.address);
  }

  getShutdownEnabled() {
    return this.chain.callReadOnlyFn("reserve-v1", "get-shutdown-enabled", [], this.deployer.address);
  }

  lockStxForWithdrawal(caller: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("reserve-v1", "lock-stx-for-withdrawal", [
        types.uint(amount * 1000000)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  requestStxForWithdrawal(caller: Account, amount: number, receiver: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("reserve-v1", "request-stx-for-withdrawal", [
        types.uint(amount * 1000000),
        types.principal(receiver)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  requestStxToStack(caller: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("reserve-v1", "request-stx-to-stack", [
        types.uint(amount * 1000000),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  returnStxFromStacking(caller: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("reserve-v1", "return-stx-from-stacking", [
        types.uint(amount * 1000000),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  getStx(caller: Account, amount: number, receiver: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("reserve-v1", "get-stx", [
        types.uint(amount * 1000000),
        types.principal(receiver)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }
}
export { Reserve };
