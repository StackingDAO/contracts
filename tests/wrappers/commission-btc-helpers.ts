import {
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "./tests-utils.ts";

// ---------------------------------------------------------
// Commission BTC
// ---------------------------------------------------------

class CommissionBtc {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getStakingBasisPoints() {
    return this.chain.callReadOnlyFn(
      "commission-btc-v1",
      "get-staking-basispoints",
      [],
      this.deployer.address
    );
  }

  getCycleRewardsEndBlock() {
    return this.chain.callReadOnlyFn(
      "commission-btc-v1",
      "get-cycle-rewards-end-block",
      [],
      this.deployer.address
    );
  }

  addCommission(caller: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "commission-btc-v1",
        "add-commission",
        [
          types.principal(qualifiedName("staking-v1")),
          types.uint(amount * 100000000),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  withdrawCommission(caller: Account, amount: number, receiver: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "commission-btc-v1",
        "withdraw-commission",
        [types.uint(amount * 100000000), types.principal(receiver)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  setStakingBasisPoints(caller: Account, percentage: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "commission-btc-v1",
        "set-staking-basispoints",
        [types.uint(percentage * 10000)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }
}
export { CommissionBtc };
