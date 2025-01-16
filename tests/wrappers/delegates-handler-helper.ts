import {
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "./tests-utils.ts";

// ---------------------------------------------------------
// Delegate Handler Helpers
// ---------------------------------------------------------

class DelegatesHandler {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getLastSelectedPool(delegate: string) {
    return this.chain.callReadOnlyFn(
      "delegates-handler-v1",
      "get-last-selected-pool",
      [types.principal(delegate)],
      this.deployer.address
    );
  }

  getTargetLockedAmount(delegate: string) {
    return this.chain.callReadOnlyFn(
      "delegates-handler-v1",
      "get-target-locked-amount",
      [types.principal(delegate)],
      this.deployer.address
    );
  }

  getLastLockedAmount(delegate: string) {
    return this.chain.callReadOnlyFn(
      "delegates-handler-v1",
      "get-last-locked-amount",
      [types.principal(delegate)],
      this.deployer.address
    );
  }

  getLastUnlockedAmount(delegate: string) {
    return this.chain.callReadOnlyFn(
      "delegates-handler-v1",
      "get-last-unlocked-amount",
      [types.principal(delegate)],
      this.deployer.address
    );
  }

  getStxAccount(user: string) {
    return this.chain.callReadOnlyFn(
      "delegates-handler-v1",
      "get-stx-account",
      [types.principal(user)],
      this.deployer.address
    );
  }

  calculateRewards(delegate: string) {
    return this.chain.callReadOnlyFn(
      "delegates-handler-v1",
      "calculate-rewards",
      [types.principal(delegate)],
      this.deployer.address
    );
  }

  calculateExcess(delegate: string) {
    return this.chain.callReadOnlyFn(
      "delegates-handler-v1",
      "calculate-excess",
      [types.principal(delegate)],
      this.deployer.address
    );
  }

  handleRewards(caller: Account, delegate: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "delegates-handler-v1",
        "handle-rewards",
        [
          types.principal(delegate),
          types.principal(qualifiedName("reserve-v1")),
          types.principal(qualifiedName("rewards-v3")),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  handleExcess(caller: Account, delegate: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "delegates-handler-v1",
        "handle-excess",
        [
          types.principal(delegate),
          types.principal(qualifiedName("reserve-v1")),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  revoke(caller: Account, delegate: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "delegates-handler-v1",
        "revoke",
        [
          types.principal(delegate),
          types.principal(qualifiedName("reserve-v1")),
          types.principal(qualifiedName("rewards-v3")),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  revokeAndDelegate(
    caller: Account,
    delegate: string,
    amount: number,
    delegateTo: string,
    untilBurnHeight: number
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "delegates-handler-v1",
        "revoke-and-delegate",
        [
          types.principal(delegate),
          types.principal(qualifiedName("reserve-v1")),
          types.principal(qualifiedName("rewards-v3")),
          types.uint(amount * 1000000),
          types.principal(delegateTo),
          types.uint(untilBurnHeight),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  updateAmounts(
    caller: Account,
    delegate: string,
    targetLocked: number,
    lastLocked: number,
    lastUnlocked: number
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "delegates-handler-v1",
        "update-amounts",
        [
          types.principal(delegate),
          types.uint(targetLocked * 1000000),
          types.uint(lastLocked * 1000000),
          types.uint(lastUnlocked * 1000000),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }
}
export { DelegatesHandler };
