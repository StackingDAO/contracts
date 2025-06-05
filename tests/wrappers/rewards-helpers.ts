import {
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "./tests-utils.ts";

// ---------------------------------------------------------
// Rewards
// ---------------------------------------------------------

class Rewards {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getStStxCommissionContract() {
    return this.chain.callReadOnlyFn(
      "rewards-v5",
      "get-ststx-commission-contract",
      [],
      this.deployer.address
    );
  }

  getStStxBtcCommissionContract() {
    return this.chain.callReadOnlyFn(
      "rewards-v5",
      "get-ststxbtc-commission-contract",
      [],
      this.deployer.address
    );
  }

  getCycleRewardsStStx(cycle: Number) {
    return this.chain.callReadOnlyFn(
      "rewards-v5",
      "get-cycle-rewards-ststx",
      [types.uint(cycle)],
      this.deployer.address
    );
  }

  getCycleRewardsStStxBtc(cycle: Number) {
    return this.chain.callReadOnlyFn(
      "rewards-v5",
      "get-cycle-rewards-ststxbtc",
      [types.uint(cycle)],
      this.deployer.address
    );
  }

  getPoxCycle() {
    return this.chain.callReadOnlyFn(
      "rewards-v5",
      "get-pox-cycle",
      [],
      this.deployer.address
    );
  }

  addRewards(caller: Account, pool: string, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "rewards-v5",
        "add-rewards",
        [types.principal(pool), types.uint(amount * 1000000)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  addRewardsSBtc(caller: Account, pool: string, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "rewards-v5",
        "add-rewards-sbtc",
        [types.principal(pool), types.uint(amount * 1000000)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  shouldProcessRewards(cycle: Number) {
    return this.chain.callReadOnlyFn(
      "rewards-v5",
      "should-process-rewards",
      [types.uint(cycle)],
      this.deployer.address
    );
  }

  processRewards(caller: Account, cycle: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "rewards-v5",
        "process-rewards",
        [
          types.uint(cycle),
          types.principal(qualifiedName("commission-v2")),
          types.principal(qualifiedName("commission-btc-v1")),
          types.principal(qualifiedName("staking-v1")),
          types.principal(qualifiedName("reserve-v1")),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  getStx(caller: Account, amount: number, receiver: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "rewards-v5",
        "get-stx",
        [types.uint(amount * 1000000), types.principal(receiver)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  getSBtc(caller: Account, amount: number, receiver: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "rewards-v5",
        "get-sbtc",
        [types.uint(amount * 1000000), types.principal(receiver)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  setStStxCommissionContract(caller: Account, contract: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "rewards-v5",
        "set-ststx-commission-contract",
        [types.principal(contract)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  setStStxBtcCommissionContract(caller: Account, contract: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "rewards-v5",
        "set-ststxbtc-commission-contract",
        [types.principal(contract)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  getRewardCycleLength() {
    return this.chain.callReadOnlyFn(
      "rewards-v5",
      "get-reward-cycle-length",
      [],
      this.deployer.address
    );
  }

  setRewardsIntervalLength(caller: Account, interval: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "rewards-v5",
        "set-rewards-interval-length",
        [types.uint(interval)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  getRewardsIntervalLength() {
    return this.chain.callReadOnlyFn(
      "rewards-v5",
      "get-rewards-interval-length",
      [],
      this.deployer.address
    );
  }

}
export { Rewards };
