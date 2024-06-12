import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet/index.ts';
import { qualifiedName } from './tests-utils.ts';

// ---------------------------------------------------------
// sDAO Tax
// ---------------------------------------------------------

class Tax {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  shouldHandleTax() {
    return this.chain.callReadOnlyFn("tax-v1", "should-handle-tax", [], this.deployer.address);
  }

  getMinBalanceToHandle() {
    return this.chain.callReadOnlyFn("tax-v1", "get-min-balance-to-handle", [], this.deployer.address);
  }

  getPercentageToSwap() {
    return this.chain.callReadOnlyFn("tax-v1", "get-percentage-to-swap", [], this.deployer.address);
  }

  checkJob() {
    return this.chain.callReadOnlyFn("tax-v1", "check-job", [], this.deployer.address);
  }

  initialize(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("tax-v1", "initialize", [
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  runJob(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("tax-v1", "run-job", [
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  handleTax(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("tax-v1", "handle-tax", [
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  retreiveStxTokens(caller: Account, amount: number, receiver: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("tax-v1", "retreive-stx-tokens", [
        types.uint(amount * 1000000),
        types.principal(receiver)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  retreiveTokens(caller: Account, token: string, amount: number, receiver: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("tax-v1", "retreive-tokens", [
        types.principal(qualifiedName(token)),
        types.uint(amount * 1000000),
        types.principal(receiver)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setMinBalanceToHandle(caller: Account, minBalance: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("tax-v1", "set-min-balance-to-handle ", [
        types.uint(minBalance * 1000000)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setPercentageToSwap(caller: Account, percentage: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("tax-v1", "set-percentage-to-swap", [
        types.uint(percentage * 10000)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }
}
export { Tax };
