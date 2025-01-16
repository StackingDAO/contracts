import {
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "./tests-utils.ts";

// ---------------------------------------------------------
// Stacking Delegate Helpers
// ---------------------------------------------------------

class StackingDelegate {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getStxAccount(user: string) {
    return this.chain.callReadOnlyFn(
      "stacking-delegate-1-1",
      "get-stx-account",
      [types.principal(user)],
      this.deployer.address
    );
  }

  delegateStx(
    caller: Account,
    delegate: string,
    amount: number,
    delegateTo: string,
    untilBurnHeight: number
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        delegate,
        "delegate-stx",
        [
          types.uint(amount * 1000000),
          types.principal(delegateTo),
          types.some(types.uint(untilBurnHeight)),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  revokeDelegateStx(caller: Account, delegate: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(delegate, "revoke-delegate-stx", [], caller.address),
    ]);
    return block.receipts[0].result;
  }

  requestStxToStack(caller: Account, delegate: string, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        delegate,
        "request-stx-to-stack",
        [
          types.principal(qualifiedName("reserve-v1")),
          types.uint(amount * 1000000),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  returnStxFromStacking(caller: Account, delegate: string, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        delegate,
        "return-stx-from-stacking",
        [
          types.principal(qualifiedName("reserve-v1")),
          types.uint(amount * 1000000),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  handleRewards(
    caller: Account,
    delegate: string,
    pool: string,
    rewards: number
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        delegate,
        "handle-rewards",
        [
          types.principal(pool),
          types.uint(rewards * 1000000),
          types.principal(qualifiedName("rewards-v3")),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  returnStx(caller: Account, delegate: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        delegate,
        "return-stx",
        [types.principal(qualifiedName("reserve-v1"))],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }
}
export { StackingDelegate };
