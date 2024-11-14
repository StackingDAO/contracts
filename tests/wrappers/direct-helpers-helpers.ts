import {
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "./tests-utils.ts";

// ---------------------------------------------------------
// Direct Helpers
// ---------------------------------------------------------

class DirectHelpers {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  addDirectStacking(
    caller: Account,
    user: string,
    pool: string | undefined,
    amount: number
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "direct-helpers-v2",
        "add-direct-stacking",
        [
          types.principal(user),
          pool == undefined ? types.none() : types.some(types.principal(pool)),
          types.uint(amount * 1000000),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  subtractDirectStacking(caller: Account, user: string, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "direct-helpers-v2",
        "subtract-direct-stacking",
        [types.principal(user), types.uint(amount * 1000000)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  stopDirectStacking(caller: Account, user: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "direct-helpers-v2",
        "stop-direct-stacking",
        [types.principal(user)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  subtractDirectStackingUser(caller: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "direct-helpers-v2",
        "subtract-direct-stacking-user",
        [types.uint(amount * 1000000)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  stopDirectStackingUser(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "direct-helpers-v2",
        "stop-direct-stacking-user",
        [],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  calculateDirectStackingInfo(protocols: string[], user: string) {
    return this.chain.callReadOnlyFn(
      "direct-helpers-v2",
      "calculate-direct-stacking-info",
      [
        types.principal(qualifiedName("reserve-v1")),
        types.list(protocols.map((protocol) => types.principal(protocol))),
        types.principal(user),
      ],
      this.deployer.address
    );
  }

  updateDirectStacking(caller: Account, protocols: string[], user: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "direct-helpers-v2",
        "update-direct-stacking",
        [
          types.principal(qualifiedName("reserve-v1")),
          types.list(protocols.map((protocol) => types.principal(protocol))),
          types.principal(user),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }
}
export { DirectHelpers };
