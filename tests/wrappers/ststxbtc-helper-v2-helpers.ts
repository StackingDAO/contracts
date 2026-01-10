import { Account, Chain, Tx, types } from "https://deno.land/x/clarinet/index.ts";

export class StstxbtcHelperV2 {
  chain: Chain;
  deployer: string;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer.address;
  }

  getStstxbtcTotalSupply(block: number) {
    return this.chain.callReadOnlyFn(
      "ststxbtc-helper-v2",
      "get-ststxbtc-total-supply",
      [types.uint(block)],
      this.deployer
    );
  }

  getTotalSupply(block: number) {
    return this.chain.callReadOnlyFn(
      "ststxbtc-helper-v2",
      "get-total-supply",
      [types.uint(block)],
      this.deployer
    );
  }

  getCurrentTotalSupply() {
    return this.chain.callReadOnlyFn(
      "ststxbtc-helper-v2",
      "get-current-total-supply",
      [],
      this.deployer
    );
  }
}
