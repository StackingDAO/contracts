import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import {
  qualifiedName,
  REWARD_CYCLE_LENGTH,
  PREPARE_PHASE_LENGTH,
} from "../wrappers/tests-utils.ts";

import { Core, CoreV1 } from "../wrappers/stacking-dao-core-helpers.ts";
import { DataCore, DataCoreV2 } from "../wrappers/data-core-helpers.ts";
import { DataDirectStacking } from "../wrappers/data-direct-stacking-helpers.ts";
import { Reserve } from "../wrappers/reserve-helpers.ts";
import { StStxToken } from "../wrappers/ststx-token-helpers.ts";
import { Rewards } from "../wrappers/rewards-helpers.ts";
import { DataPools } from "../wrappers/data-pools-helpers.ts";

//-------------------------------------
// Core
//-------------------------------------

Clarinet.test({
  name: "core: deposit and withdraw for normal stacking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);
    let dataCore = new DataCore(chain, deployer);
    let reserve = new Reserve(chain, deployer);

    let result = await core.deposit(wallet_1, 1000, undefined, undefined);
    result.expectOk().expectUintWithDecimals(1000);

    let call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(1000);
    call = await reserve.getStxForWithdrawals();
    call.result.expectOk().expectUintWithDecimals(0);

    call = await core.getWithdrawUnlockBurnHeight();
    call.result.expectOk().expectUint(24);

    result = await core.initWithdraw(wallet_1, 200);
    result.expectOk().expectUint(100000);

    call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(1000);
    call = await reserve.getStxForWithdrawals();
    call.result.expectOk().expectUintWithDecimals(200);

    call = await dataCore.getWithdrawalsByNft(100000);
    call.result.expectTuple()["ststx-amount"].expectUintWithDecimals(200);
    call.result.expectTuple()["stx-amount"].expectUintWithDecimals(200);
    call.result.expectTuple()["unlock-burn-height"].expectUint(24);

    chain.mineEmptyBlockUntil(21 + 2 + 3);

    result = await core.withdraw(wallet_1, 100000);
    result
      .expectOk()
      .expectTuple()
      ["stx-user-amount"].expectUintWithDecimals(200);

    call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(800);
    call = await reserve.getStxForWithdrawals();
    call.result.expectOk().expectUintWithDecimals(0);
  },
});

Clarinet.test({
  name: "core: deposit and withdraw for direct stacking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);
    let dataCore = new DataCore(chain, deployer);
    let dataDirectStacking = new DataDirectStacking(chain, deployer);
    let reserve = new Reserve(chain, deployer);

    let result = await core.deposit(
      wallet_1,
      1000,
      undefined,
      qualifiedName("stacking-pool-v1")
    );
    result.expectOk().expectUintWithDecimals(1000);

    let call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(1000);
    call = await reserve.getStxForWithdrawals();
    call.result.expectOk().expectUintWithDecimals(0);

    call = await dataDirectStacking.getTotalDirectStacking();
    call.result.expectUintWithDecimals(1000);
    call = await dataDirectStacking.getDirectStackingPoolAmount(
      qualifiedName("stacking-pool-v1")
    );
    call.result.expectUintWithDecimals(1000);
    call = await dataDirectStacking.getDirectStackingUser(wallet_1.address);
    call.result
      .expectSome()
      .expectTuple()
      ["amount"].expectUintWithDecimals(1000);
    call.result
      .expectSome()
      .expectTuple()
      ["pool"].expectPrincipal(qualifiedName("stacking-pool-v1"));

    call = await core.getWithdrawUnlockBurnHeight();
    call.result.expectOk().expectUint(24);

    result = await core.initWithdraw(wallet_1, 200);
    result.expectOk().expectUint(100000);

    call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(1000);
    call = await reserve.getStxForWithdrawals();
    call.result.expectOk().expectUintWithDecimals(200);

    call = await dataDirectStacking.getTotalDirectStacking();
    call.result.expectUintWithDecimals(800);
    call = await dataDirectStacking.getDirectStackingPoolAmount(
      qualifiedName("stacking-pool-v1")
    );
    call.result.expectUintWithDecimals(800);
    call = await dataDirectStacking.getDirectStackingUser(wallet_1.address);
    call.result
      .expectSome()
      .expectTuple()
      ["amount"].expectUintWithDecimals(800);
    call.result
      .expectSome()
      .expectTuple()
      ["pool"].expectPrincipal(qualifiedName("stacking-pool-v1"));

    call = await dataCore.getWithdrawalsByNft(100000);
    call.result.expectTuple()["ststx-amount"].expectUintWithDecimals(200);
    call.result.expectTuple()["stx-amount"].expectUintWithDecimals(200);
    call.result.expectTuple()["unlock-burn-height"].expectUint(24);

    chain.mineEmptyBlockUntil(21 + 2 + 3);

    result = await core.withdraw(wallet_1, 100000);
    result
      .expectOk()
      .expectTuple()
      ["stx-user-amount"].expectUintWithDecimals(200);

    call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(800);
    call = await reserve.getStxForWithdrawals();
    call.result.expectOk().expectUintWithDecimals(0);

    call = await dataDirectStacking.getTotalDirectStacking();
    call.result.expectUintWithDecimals(800);
    call = await dataDirectStacking.getDirectStackingPoolAmount(
      qualifiedName("stacking-pool-v1")
    );
    call.result.expectUintWithDecimals(800);
    call = await dataDirectStacking.getDirectStackingUser(wallet_1.address);
    call.result
      .expectSome()
      .expectTuple()
      ["amount"].expectUintWithDecimals(800);
    call.result
      .expectSome()
      .expectTuple()
      ["pool"].expectPrincipal(qualifiedName("stacking-pool-v1"));
  },
});

Clarinet.test({
  name: "core: withdraw at end of cycle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);
    let dataCore = new DataCore(chain, deployer);

    let result = await core.deposit(wallet_1, 1000, undefined, undefined);
    result.expectOk().expectUintWithDecimals(1000);

    chain.mineEmptyBlockUntil(19);

    let call = await core.getWithdrawUnlockBurnHeight();
    call.result.expectOk().expectUint(21 * 2 + 3);

    result = await core.initWithdraw(wallet_1, 200);
    result.expectOk().expectUint(100000);

    call = await dataCore.getWithdrawalsByNft(100000);
    call.result.expectTuple()["ststx-amount"].expectUintWithDecimals(200);
    call.result.expectTuple()["stx-amount"].expectUintWithDecimals(200);
    call.result.expectTuple()["unlock-burn-height"].expectUint(45);

    chain.mineEmptyBlockUntil(21 * 2 + 2 + 3);

    result = await core.withdraw(wallet_1, 100000);
    result
      .expectOk()
      .expectTuple()
      ["stx-user-amount"].expectUintWithDecimals(200);
  },
});

Clarinet.test({
  name: "core: stack/unstack fee",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);
    let coreV1 = new CoreV1(chain, deployer);
    let dataCore = new DataCore(chain, deployer);

    let result = await core.setStackFee(deployer, 500);
    result.expectOk().expectBool(true);

    result = await core.setUnstackFee(deployer, 500);
    result.expectOk().expectBool(true);

    // 1000 minus 5% fee
    result = await core.deposit(wallet_1, 1000, undefined, undefined);
    result.expectOk().expectUintWithDecimals(950);

    let call = coreV1.getStxBalance(qualifiedName("commission-v2"));
    call.result.expectUintWithDecimals(50);

    chain.mineEmptyBlockUntil(19);

    call = await core.getWithdrawUnlockBurnHeight();
    call.result.expectOk().expectUint(21 * 2 + 3);

    result = await core.initWithdraw(wallet_1, 200);
    result.expectOk().expectUint(100000);

    call = await dataCore.getWithdrawalsByNft(100000);
    call.result.expectTuple()["ststx-amount"].expectUintWithDecimals(200);
    call.result.expectTuple()["stx-amount"].expectUintWithDecimals(200);
    call.result.expectTuple()["unlock-burn-height"].expectUint(45);

    chain.mineEmptyBlockUntil(21 * 2 + 2 + 3);

    result = await core.withdraw(wallet_1, 100000);
    result
      .expectOk()
      .expectTuple()
      ["stx-user-amount"].expectUintWithDecimals(190);
    result
      .expectOk()
      .expectTuple()
      ["stx-fee-amount"].expectUintWithDecimals(10);

    // 200 * 5% = 10
    // Already had 50 from deposit
    call = coreV1.getStxBalance(qualifiedName("commission-v2"));
    call.result.expectUintWithDecimals(50 + 10);
  },
});

Clarinet.test({
  name: "core: withdraw idle stx with fee",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);
    let coreV1 = new CoreV1(chain, deployer);
    let dataCore = new DataCoreV2(chain, deployer);
    let reserve = new Reserve(chain, deployer);

    let result = await core.setWithdrawIdleFee(deployer, 500);
    result.expectOk().expectBool(true);

    result = await core.deposit(deployer, 1000, undefined, undefined);
    result.expectOk().expectUintWithDecimals(1000);

    let call = await core.getIdleCycle();
    call.result.expectOk().expectUint(0);

    call = await dataCore.getStxIdle(0);
    result.expectOk().expectUintWithDecimals(1000);

    call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(1000);

    chain.mineEmptyBlockUntil(23);

    result = await core.deposit(wallet_1, 200, undefined, undefined);
    result.expectOk().expectUintWithDecimals(200);

    call = await core.getIdleCycle();
    call.result.expectOk().expectUint(1);

    call = await dataCore.getStxIdle(1);
    result.expectOk().expectUintWithDecimals(200);

    call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(1000 + 200);

    result = await core.withdrawIdle(deployer, 200);
    result
      .expectOk()
      .expectTuple()
      ["stx-user-amount"].expectUintWithDecimals(190);
    result
      .expectOk()
      .expectTuple()
      ["stx-fee-amount"].expectUintWithDecimals(10);

    call = await dataCore.getStxIdle(1);
    call.result.expectUintWithDecimals(0);

    call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(1000);

    call = coreV1.getStxBalance(qualifiedName("commission-v2"));
    call.result.expectUintWithDecimals(10);
  },
});

//-------------------------------------
// Admin
//-------------------------------------

Clarinet.test({
  name: "core: admin can shutdown deposits",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);

    let result = await core.deposit(
      wallet_1,
      1000,
      undefined,
      qualifiedName("stacking-pool-v1")
    );
    result.expectOk().expectUintWithDecimals(1000);

    let call = await core.getShutdownDeposits();
    call.result.expectBool(false);

    result = await core.setShutdownDeposits(deployer, true);
    result.expectOk().expectBool(true);

    call = await core.getShutdownDeposits();
    call.result.expectBool(true);

    result = await core.deposit(
      wallet_1,
      1000,
      undefined,
      qualifiedName("stacking-pool-v1")
    );
    result.expectErr().expectUint(204002);

    result = await core.setShutdownDeposits(deployer, false);
    result.expectOk().expectBool(true);

    call = await core.getShutdownDeposits();
    call.result.expectBool(false);

    result = await core.deposit(
      wallet_1,
      1000,
      undefined,
      qualifiedName("stacking-pool-v1")
    );
    result.expectOk().expectUintWithDecimals(1000);
  },
});

Clarinet.test({
  name: "core: admin can shutdown withdraw idle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);
    let dataCore = new DataCoreV2(chain, deployer);

    chain.mineEmptyBlockUntil(19);

    let result = await core.deposit(
      wallet_1,
      1000,
      undefined,
      qualifiedName("stacking-pool-v1")
    );
    result.expectOk().expectUintWithDecimals(1000);

    let call = await core.getShutdownWithdrawIdle();
    call.result.expectBool(false);

    result = await core.setShutdownWithdrawIdle(deployer, true);
    result.expectOk().expectBool(true);

    call = await core.getShutdownWithdrawIdle();
    call.result.expectBool(true);

    result = await core.withdrawIdle(wallet_1, 10);
    result.expectErr().expectUint(204002);

    result = await core.setShutdownWithdrawIdle(deployer, false);
    result.expectOk().expectBool(true);

    call = await core.getShutdownWithdrawIdle();
    call.result.expectBool(false);

    result = await core.withdrawIdle(wallet_1, 10);
    result
      .expectOk()
      .expectTuple()
      ["stx-user-amount"].expectUintWithDecimals(10);
  },
});

Clarinet.test({
  name: "core: admin can shutdown init withdraws",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);

    let result = await core.deposit(
      wallet_1,
      1000,
      undefined,
      qualifiedName("stacking-pool-v1")
    );
    result.expectOk().expectUintWithDecimals(1000);

    let call = await core.getShutdownInitWithdraw();
    call.result.expectBool(false);

    result = await core.setShutdownInitWithdraw(deployer, true);
    result.expectOk().expectBool(true);

    call = await core.getShutdownInitWithdraw();
    call.result.expectBool(true);

    result = await core.initWithdraw(wallet_1, 1000);
    result.expectErr().expectUint(204002);

    result = await core.setShutdownInitWithdraw(deployer, false);
    result.expectOk().expectBool(true);

    call = await core.getShutdownInitWithdraw();
    call.result.expectBool(false);

    result = await core.initWithdraw(wallet_1, 1000);
    result.expectOk().expectUint(100000);
  },
});

Clarinet.test({
  name: "core: admin can shutdown withdraws",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);

    let result = await core.deposit(
      wallet_1,
      1000,
      undefined,
      qualifiedName("stacking-pool-v1")
    );
    result.expectOk().expectUintWithDecimals(1000);

    result = await core.initWithdraw(wallet_1, 1000);
    result.expectOk().expectUint(100000);

    chain.mineEmptyBlockUntil(21 + 4);

    let call = await core.getShutdownWithdraw();
    call.result.expectBool(false);

    result = await core.setShutdownWithdraw(deployer, true);
    result.expectOk().expectBool(true);

    call = await core.getShutdownWithdraw();
    call.result.expectBool(true);

    result = await core.withdraw(wallet_1, 100000);
    result.expectErr().expectUint(204002);

    result = await core.setShutdownWithdraw(deployer, false);
    result.expectOk().expectBool(true);

    call = await core.getShutdownWithdraw();
    call.result.expectBool(false);

    result = await core.withdraw(wallet_1, 100000);
    result
      .expectOk()
      .expectTuple()
      ["stx-user-amount"].expectUintWithDecimals(1000);
  },
});

//-------------------------------------
// Access
//-------------------------------------

Clarinet.test({
  name: "core: only protocol can call admin methods",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);

    let result = await core.setShutdownDeposits(wallet_1, true);
    result.expectErr().expectUint(20003);

    result = await core.setShutdownInitWithdraw(wallet_1, true);
    result.expectErr().expectUint(20003);

    result = await core.setShutdownWithdraw(wallet_1, true);
    result.expectErr().expectUint(20003);

    result = await core.setShutdownWithdrawIdle(wallet_1, true);
    result.expectErr().expectUint(20003);

    result = await core.setStackFee(wallet_1, 100);
    result.expectErr().expectUint(20003);

    result = await core.setUnstackFee(wallet_1, 100);
    result.expectErr().expectUint(20003);

    result = await core.setWithdrawIdleFee(wallet_1, 100);
    result.expectErr().expectUint(20003);
  },
});

//-------------------------------------
// Errors
//-------------------------------------

Clarinet.test({
  name: "core: can not call deposit with wrong trait params",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "stacking-dao-core-v4",
        "deposit",
        [
          types.principal(qualifiedName("fake-reserve")),
          types.principal(qualifiedName("commission-v2")),
          types.principal(qualifiedName("staking-v1")),
          types.principal(qualifiedName("direct-helpers-v2")),
          types.uint(100 * 1000000),
          types.none(),
          types.none(),
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);

    block = chain.mineBlock([
      Tx.contractCall(
        "stacking-dao-core-v4",
        "deposit",
        [
          types.principal(qualifiedName("reserve-v1")),
          types.principal(qualifiedName("commission-v2")),
          types.principal(qualifiedName("staking-v1")),
          types.principal(qualifiedName("fake-direct-helpers")),
          types.uint(100 * 1000000),
          types.none(),
          types.none(),
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);
  },
});

Clarinet.test({
  name: "core: can not call withdraw idle with wrong trait params",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "stacking-dao-core-v4",
        "withdraw-idle",
        [
          types.principal(qualifiedName("fake-reserve")),
          types.principal(qualifiedName("direct-helpers-v2")),
          types.principal(qualifiedName("commission-v2")),
          types.principal(qualifiedName("staking-v1")),
          types.uint(100 * 1000000),
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);

    block = chain.mineBlock([
      Tx.contractCall(
        "stacking-dao-core-v4",
        "withdraw-idle",
        [
          types.principal(qualifiedName("reserve-v1")),
          types.principal(qualifiedName("fake-direct-helpers")),
          types.principal(qualifiedName("commission-v2")),
          types.principal(qualifiedName("staking-v1")),
          types.uint(100 * 1000000),
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);
  },
});

Clarinet.test({
  name: "core: can not call init-withdraw with wrong trait params",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "stacking-dao-core-v4",
        "init-withdraw",
        [
          types.principal(qualifiedName("fake-reserve")),
          types.principal(qualifiedName("direct-helpers-v2")),
          types.uint(100 * 1000000),
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);

    block = chain.mineBlock([
      Tx.contractCall(
        "stacking-dao-core-v4",
        "init-withdraw",
        [
          types.principal(qualifiedName("reserve-v1")),
          types.principal(qualifiedName("fake-direct-helpers")),
          types.uint(100 * 1000000),
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);
  },
});

Clarinet.test({
  name: "core: can not call withdraw with wrong trait params",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "stacking-dao-core-v4",
        "withdraw",
        [
          types.principal(qualifiedName("fake-reserve")),
          types.principal(qualifiedName("commission-v2")),
          types.principal(qualifiedName("staking-v1")),
          types.uint(0),
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);
  },
});

Clarinet.test({
  name: "core: can only withdraw idle if enough deposited",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);

    let result = await core.deposit(wallet_1, 1000, undefined, undefined);
    result.expectOk().expectUintWithDecimals(1000);

    result = await core.withdrawIdle(wallet_1, 1000 + 1);
    result.expectErr().expectUint(204006);
  },
});

Clarinet.test({
  name: "core: can only withdraw if burn block height reached",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);

    let result = await core.deposit(wallet_1, 1000, undefined, undefined);
    result.expectOk().expectUintWithDecimals(1000);

    result = await core.initWithdraw(wallet_1, 200);
    result.expectOk().expectUint(100000);

    chain.mineEmptyBlockUntil(21);

    result = await core.withdraw(wallet_1, 100000);
    result.expectErr().expectUint(204001);

    chain.mineEmptyBlockUntil(21 + 4);

    result = await core.withdraw(wallet_1, 100000);
    result
      .expectOk()
      .expectTuple()
      ["stx-user-amount"].expectUintWithDecimals(200);
  },
});

Clarinet.test({
  name: "core: only withdrawal NFT owner can withdraw",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);

    let result = await core.deposit(deployer, 1000, undefined, undefined);
    result.expectOk().expectUintWithDecimals(1000);

    result = await core.deposit(wallet_1, 1000, undefined, undefined);
    result.expectOk().expectUintWithDecimals(1000);

    result = await core.initWithdraw(deployer, 200);
    result.expectOk().expectUint(100000);

    result = await core.initWithdraw(wallet_1, 200);
    result.expectOk().expectUint(100000 + 1);

    chain.mineEmptyBlockUntil(21 + 4);

    result = await core.withdraw(wallet_1, 100000);
    result.expectErr().expectUint(204003);

    result = await core.withdraw(deployer, 100000);
    result
      .expectOk()
      .expectTuple()
      ["stx-user-amount"].expectUintWithDecimals(200);
  },
});

Clarinet.test({
  name: "core: can only use existing NFT to withdraw",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);

    let result = await core.deposit(deployer, 1000, undefined, undefined);
    result.expectOk().expectUintWithDecimals(1000);

    result = await core.deposit(wallet_1, 1000, undefined, undefined);
    result.expectOk().expectUintWithDecimals(1000);

    result = await core.initWithdraw(deployer, 200);
    result.expectOk().expectUint(100000);

    result = await core.initWithdraw(wallet_1, 200);
    result.expectOk().expectUint(100000 + 1);

    chain.mineEmptyBlockUntil(21 + 3 + 3);

    result = await core.withdraw(wallet_1, 100000 + 1);
    result
      .expectOk()
      .expectTuple()
      ["stx-user-amount"].expectUintWithDecimals(200);

    result = await core.withdraw(wallet_1, 100000 + 1);
    result.expectErr().expectUint(204004);

    result = await core.withdraw(wallet_1, 100000 + 99);
    result.expectErr().expectUint(204004);
  },
});

Clarinet.test({
  name: "core: can not set fee higher than 10000 BPS",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);

    let result = await core.setStackFee(deployer, 10001);
    result.expectErr().expectUint(204007);

    result = await core.setUnstackFee(deployer, 10001);
    result.expectErr().expectUint(204007);

    result = await core.setWithdrawIdleFee(deployer, 10001);
    result.expectErr().expectUint(204007);
  },
});

//-------------------------------------
// V1
//-------------------------------------

Clarinet.test({
  name: "core: general test from v1 to compare",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let core = new Core(chain, deployer);
    let stStxToken = new StStxToken(chain, deployer);
    let rewards = new Rewards(chain, deployer);
    let dataPools = new DataPools(chain, deployer);
    let dataCore = new DataCore(chain, deployer);

    // Set commission to 0 so it does not influence STX per stSTX
    let result = dataPools.setPoolCommission(
      deployer,
      qualifiedName("stacking-pool-v1"),
      0
    );
    result.expectOk().expectBool(true);

    // Deposit 1,000,000 STX
    result = await core.deposit(deployer, 1000000);
    result.expectOk().expectUintWithDecimals(1000000);

    // Got 1,000,000 stSTX
    let call = stStxToken.getBalance(deployer.address);
    call.result.expectOk().expectUintWithDecimals(1000000);

    // Advance to end of cycle
    chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH - 2);

    // Add rewards
    result = await rewards.addRewards(
      wallet_2,
      qualifiedName("stacking-pool-v1"),
      10000
    );
    result.expectOk().expectBool(true);

    // Advance to end of cycle
    chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH * 2 - 2);

    result = await rewards.processRewards(wallet_2, 1);
    result.expectOk().expectBool(true);

    // STX per stSTX ratio increased
    call = await dataCore.getStxPerStStx(qualifiedName("reserve-v1"));
    call.result.expectOk().expectUintWithDecimals(1.01);

    // Advance to next cycle
    chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH * 2 + 1);

    // Deposit 1M STX
    result = await core.deposit(wallet_1, 1000000);
    result.expectOk().expectUintWithDecimals(990099.0099);

    // Add rewards
    result = await rewards.addRewards(
      wallet_2,
      qualifiedName("stacking-pool-v1"),
      18000
    );
    result.expectOk().expectBool(true);

    // Advance to end of cycle
    chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH * 3 - 3);

    result = await rewards.processRewards(wallet_2, 2);
    result.expectOk().expectBool(true);

    // Advance to next cycle
    chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH * 3 + 1);

    // Now let's see what the stSTX to STX ratio is
    call = await dataCore.getStxPerStStx(qualifiedName("reserve-v1"));
    call.result.expectOk().expectUintWithDecimals(1.019044);

    // Current PoX cycle
    call = await rewards.getPoxCycle();
    call.result.expectUint(3);

    // Let's test withdrawals
    // We are in cycle 2, so cycle 3 is the first we can withdraw
    result = await core.initWithdraw(deployer, 10000);
    result.expectOk().expectUint(100000);

    // Deployer should have 10k stSTX less
    call = stStxToken.getBalance(deployer.address);
    call.result.expectOk().expectUintWithDecimals(990000);

    // Let's go 1 cycle further now
    chain.mineEmptyBlock(REWARD_CYCLE_LENGTH + PREPARE_PHASE_LENGTH);

    // Current PoX cycle
    call = await rewards.getPoxCycle();
    call.result.expectUint(4);

    // Withdraw
    result = core.withdraw(deployer, 100000);
    result
      .expectOk()
      .expectTuple()
      ["stx-user-amount"].expectUintWithDecimals(10190.44);

    // After deployer pulled all their capital + rewards, the ratio remains the same
    call = await dataCore.getStxPerStStx(qualifiedName("reserve-v1"));
    call.result.expectOk().expectUintWithDecimals(1.019044);
  },
});
