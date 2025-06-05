import {
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "./tests-utils.ts";

// ---------------------------------------------------------
// Core BTC V1
// ---------------------------------------------------------

class CoreBtc {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getShutdownDeposits() {
    return this.chain.callReadOnlyFn(
      "stacking-dao-core-btc-v2",
      "get-shutdown-deposits",
      [],
      this.deployer.address
    );
  }

  getShutdownInitWithdraw() {
    return this.chain.callReadOnlyFn(
      "stacking-dao-core-btc-v2",
      "get-shutdown-init-withdraw",
      [],
      this.deployer.address
    );
  }

  getShutdownWithdraw() {
    return this.chain.callReadOnlyFn(
      "stacking-dao-core-btc-v2",
      "get-shutdown-withdraw",
      [],
      this.deployer.address
    );
  }

  getShutdownWithdrawIdle() {
    return this.chain.callReadOnlyFn(
      "stacking-dao-core-btc-v2",
      "get-shutdown-withdraw-idle",
      [],
      this.deployer.address
    );
  }

  getIdleCycle() {
    return this.chain.callReadOnlyFn(
      "stacking-dao-core-btc-v2",
      "get-idle-cycle",
      [],
      this.deployer.address
    );
  }

  deposit(
    caller: Account,
    amount: number,
    referrer: string | undefined = undefined,
    pool: string | undefined = undefined
  ) {
    let referrerType = types.none();
    if (referrer) {
      referrerType = types.some(types.principal(referrer));
    }

    let block = this.chain.mineBlock([
      Tx.contractCall(
        "stacking-dao-core-btc-v2",
        "deposit",
        [
          types.principal(qualifiedName("reserve-v1")),
          types.principal(qualifiedName("commission-v2")),
          types.principal(qualifiedName("staking-v1")),
          types.principal(qualifiedName("direct-helpers-v4")),
          types.uint(amount * 1000000),
          referrer == undefined
            ? types.none()
            : types.some(types.principal(referrer)),
          pool == undefined ? types.none() : types.some(types.principal(pool)),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  withdrawIdle(caller: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "stacking-dao-core-btc-v2",
        "withdraw-idle",
        [
          types.principal(qualifiedName("reserve-v1")),
          types.principal(qualifiedName("direct-helpers-v4")),
          types.principal(qualifiedName("commission-v2")),
          types.principal(qualifiedName("staking-v1")),
          types.uint(amount * 1000000),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  initWithdraw(caller: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "stacking-dao-core-btc-v2",
        "init-withdraw",
        [
          types.principal(qualifiedName("reserve-v1")),
          types.principal(qualifiedName("direct-helpers-v4")),
          types.uint(amount * 1000000),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  withdraw(caller: Account, nftId: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "stacking-dao-core-btc-v2",
        "withdraw",
        [
          types.principal(qualifiedName("reserve-v1")),
          types.principal(qualifiedName("commission-v2")),
          types.principal(qualifiedName("staking-v1")),
          types.uint(nftId),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  setShutdownDeposits(caller: Account, shutdown: boolean) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "stacking-dao-core-btc-v2",
        "set-shutdown-deposits",
        [types.bool(shutdown)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  setShutdownInitWithdraw(caller: Account, shutdown: boolean) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "stacking-dao-core-btc-v2",
        "set-shutdown-init-withdraw",
        [types.bool(shutdown)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  setShutdownWithdrawIdle(caller: Account, shutdown: boolean) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "stacking-dao-core-btc-v2",
        "set-shutdown-withdraw-idle",
        [types.bool(shutdown)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  setShutdownWithdraw(caller: Account, shutdown: boolean) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "stacking-dao-core-btc-v2",
        "set-shutdown-withdraw",
        [types.bool(shutdown)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  setStackFee(caller: Account, fee: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "stacking-dao-core-btc-v2",
        "set-stack-fee",
        [types.uint(fee)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  setUnstackFee(caller: Account, fee: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "stacking-dao-core-btc-v2",
        "set-unstack-fee",
        [types.uint(fee)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  setWithdrawIdleFee(caller: Account, fee: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "stacking-dao-core-btc-v2",
        "set-withdraw-idle-fee",
        [types.uint(fee)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }
}
export { CoreBtc };
