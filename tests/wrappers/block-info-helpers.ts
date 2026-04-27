import { Account, Chain, Tx, types } from "https://deno.land/x/clarinet/index.ts";

export class BlockInfo {
  chain: Chain;
  deployer: string;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer.address;
  }

  getReserveStackingAtBlock(block: number) {
    return this.chain.callReadOnlyFn(
      "block-info-v1",
      "get-reserve-stacking-at-block",
      [types.uint(block)],
      this.deployer
    );
  }

  getStxAccountAtBlock(account: string, block: number) {
    return this.chain.callReadOnlyFn(
      "block-info-v1",
      "get-stx-account-at-block",
      [types.principal(account), types.uint(block)],
      this.deployer
    );
  }

  getUserStstxAtBlock(account: string, block: number) {
    return this.chain.callReadOnlyFn(
      "block-info-v1",
      "get-user-ststx-at-block",
      [types.principal(account), types.uint(block)],
      this.deployer
    );
  }

  getStstxBalanceAtBlock(account: string, block: number) {
    return this.chain.callReadOnlyFn(
      "block-info-v1",
      "get-ststx-balance-at-block",
      [types.principal(account), types.uint(block)],
      this.deployer
    );
  }

  getLpBalanceAtBlock(account: string, block: number) {
    return this.chain.callReadOnlyFn(
      "block-info-v1",
      "get-lp-balance-at-block",
      [types.principal(account), types.uint(block)],
      this.deployer
    );
  }
}
