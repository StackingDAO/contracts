import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "../wrappers/tests-utils.ts";

import { DelegatesHandler } from "../wrappers/delegates-handler-helper.ts";
import { Pox4Mock } from "../wrappers/pox-mock-helpers.ts";
import { StackingPool } from "../wrappers/stacking-pool-helpers.ts";
import { Rewards } from "../wrappers/rewards-helpers.ts";

//-------------------------------------
// Core
//-------------------------------------

Clarinet.test({
  name: "delegates-handler: can delegate and revoke",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let delegatesHandler = new DelegatesHandler(chain, deployer);
    let pox = new Pox4Mock(chain, deployer);

    let block = chain.mineBlock([
      Tx.transferSTX(
        100 * 1000000,
        qualifiedName("reserve-v1"),
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Delegate
    let result = await delegatesHandler.revokeAndDelegate(
      deployer,
      qualifiedName("stacking-delegate-1-1"),
      100,
      qualifiedName("stacking-pool-v1"),
      50
    );
    result.expectOk().expectBool(true);

    let call = await delegatesHandler.getStxAccount(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(100);

    call = await pox.getCheckDelegation(qualifiedName("stacking-delegate-1-1"));
    call.result
      .expectSome()
      .expectTuple()
      ["amount-ustx"].expectUintWithDecimals(100);
    call.result
      .expectSome()
      .expectTuple()
      ["delegated-to"].expectPrincipal(qualifiedName("stacking-pool-v1"));
    call.result.expectSome().expectTuple()["pox-addr"].expectNone();
    call.result
      .expectSome()
      .expectTuple()
      ["until-burn-ht"].expectSome()
      .expectUint(50);

    call = await delegatesHandler.calculateRewards(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(0);

    call = await delegatesHandler.calculateExcess(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(0);

    // Revoke
    result = await delegatesHandler.revoke(
      deployer,
      qualifiedName("stacking-delegate-1-1")
    );
    result.expectOk().expectBool(true);

    call = await pox.getCheckDelegation(qualifiedName("stacking-delegate-1-1"));
    call.result.expectNone();

    call = await delegatesHandler.calculateRewards(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(0);

    call = await delegatesHandler.calculateExcess(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(0);
  },
});

Clarinet.test({
  name: "delegates-handler: handle rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let delegatesHandler = new DelegatesHandler(chain, deployer);
    let rewards = new Rewards(chain, deployer);

    let block = chain.mineBlock([
      Tx.transferSTX(
        100 * 1000000,
        qualifiedName("reserve-v1"),
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Delegate
    let result = await delegatesHandler.revokeAndDelegate(
      deployer,
      qualifiedName("stacking-delegate-1-1"),
      100,
      qualifiedName("stacking-pool-v1"),
      50
    );
    result.expectOk().expectBool(true);

    // Add extra STX (= rewards)
    block = chain.mineBlock([
      Tx.transferSTX(
        10 * 1000000,
        qualifiedName("stacking-delegate-1-1"),
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let call = await delegatesHandler.calculateRewards(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(10);

    call = await delegatesHandler.calculateExcess(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(0);

    // Handle rewards
    result = await delegatesHandler.handleRewards(
      deployer,
      qualifiedName("stacking-delegate-1-1")
    );
    result.expectOk().expectUintWithDecimals(10);

    call = await delegatesHandler.calculateRewards(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(0);

    call = await delegatesHandler.calculateExcess(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(0);

    // Check data
    call = await delegatesHandler.getLastSelectedPool(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectPrincipal(qualifiedName("stacking-pool-v1"));

    call = await rewards.getCycleRewardsStStx(0);
    call.result.expectTuple()["processed"].expectBool(false);
    call.result.expectTuple()["total-stx"].expectUintWithDecimals(10);
    call.result.expectTuple()["commission-stx"].expectUintWithDecimals(0.5);
    call.result.expectTuple()["protocol-stx"].expectUintWithDecimals(9.5);
  },
});

Clarinet.test({
  name: "delegates-handler: handle excess",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let delegatesHandler = new DelegatesHandler(chain, deployer);

    let block = chain.mineBlock([
      Tx.transferSTX(
        100 * 1000000,
        qualifiedName("reserve-v1"),
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Delegate
    let result = await delegatesHandler.revokeAndDelegate(
      deployer,
      qualifiedName("stacking-delegate-1-1"),
      100,
      qualifiedName("stacking-pool-v1"),
      50
    );
    result.expectOk().expectBool(true);

    let call = await delegatesHandler.getTargetLockedAmount(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(100);

    call = await delegatesHandler.getLastLockedAmount(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(0);

    call = await delegatesHandler.getLastUnlockedAmount(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(100);

    // Update amounts manually
    result = await delegatesHandler.updateAmounts(
      deployer,
      qualifiedName("stacking-delegate-1-1"),
      50,
      0,
      100
    );
    result.expectOk().expectBool(true);

    call = await delegatesHandler.calculateRewards(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(0);

    call = await delegatesHandler.calculateExcess(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(50);

    // Handle excess
    result = await delegatesHandler.handleExcess(
      deployer,
      qualifiedName("stacking-delegate-1-1")
    );
    result.expectOk().expectUintWithDecimals(50);

    call = await delegatesHandler.calculateRewards(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(0);

    call = await delegatesHandler.calculateExcess(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(0);
  },
});

Clarinet.test({
  name: "delegates-handler: can delegate multiple times and decrease/increase amount",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let delegatesHandler = new DelegatesHandler(chain, deployer);
    let stackingPool = new StackingPool(chain, deployer);
    let pox = new Pox4Mock(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    //
    // Stack 200k
    //

    let block = chain.mineBlock([
      Tx.transferSTX(
        200000 * 1000000,
        qualifiedName("reserve-v1"),
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let result = await delegatesHandler.revokeAndDelegate(
      deployer,
      qualifiedName("stacking-delegate-1-1"),
      200000,
      qualifiedName("stacking-pool-v1"),
      50
    );
    result.expectOk().expectBool(true);

    let call = await pox.getCheckDelegation(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result
      .expectSome()
      .expectTuple()
      ["amount-ustx"].expectUintWithDecimals(200000);
    call.result
      .expectSome()
      .expectTuple()
      ["until-burn-ht"].expectSome()
      .expectUint(50);

    call = await stackingPool.getStxAccount(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(200000);
    call.result.expectTuple()["unlock-height"].expectUint(0);

    //
    // Delegate again
    //

    result = await delegatesHandler.revokeAndDelegate(
      deployer,
      qualifiedName("stacking-delegate-1-1"),
      190000,
      qualifiedName("stacking-pool-v1"),
      50
    );
    result.expectOk().expectBool(true);

    call = await pox.getCheckDelegation(qualifiedName("stacking-delegate-1-1"));
    call.result
      .expectSome()
      .expectTuple()
      ["amount-ustx"].expectUintWithDecimals(190000);
    call.result
      .expectSome()
      .expectTuple()
      ["until-burn-ht"].expectSome()
      .expectUint(50);

    call = await stackingPool.getStxAccount(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(190000);
    call.result.expectTuple()["unlock-height"].expectUint(0);

    //
    // Prepare pool
    //

    chain.mineEmptyBlockUntil(19);

    result = stackingPool.prepare(deployer);
    result.expectOk().expectBool(true);

    call = await stackingPool.getStxAccount(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectTuple()["locked"].expectUintWithDecimals(190000);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(42);
  },
});

Clarinet.test({
  name: "delegates-handler: check maps info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let delegatesHandler = new DelegatesHandler(chain, deployer);
    let stackingPool = new StackingPool(chain, deployer);

    let block = chain.mineBlock([
      Tx.transferSTX(
        200000 * 1000000,
        qualifiedName("reserve-v1"),
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Delegate
    let result = await delegatesHandler.revokeAndDelegate(
      deployer,
      qualifiedName("stacking-delegate-1-1"),
      200000,
      qualifiedName("stacking-pool-v1"),
      50
    );
    result.expectOk().expectBool(true);

    // Check data
    let call = await delegatesHandler.getLastSelectedPool(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectPrincipal(qualifiedName("stacking-pool-v1"));

    call = await delegatesHandler.getTargetLockedAmount(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(200000);

    call = await delegatesHandler.getLastLockedAmount(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(0);

    call = await delegatesHandler.getLastUnlockedAmount(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(200000);
  },
});

//-------------------------------------
// Admin
//-------------------------------------

Clarinet.test({
  name: "delegates-handler: protocol can update amounts",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let delegatesHandler = new DelegatesHandler(chain, deployer);

    let call = await delegatesHandler.getLastSelectedPool(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectPrincipal(qualifiedName("stacking-pool-v1"));

    call = await delegatesHandler.getTargetLockedAmount(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(0);

    call = await delegatesHandler.getLastLockedAmount(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(0);

    call = await delegatesHandler.getLastUnlockedAmount(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(0);

    let result = await delegatesHandler.updateAmounts(
      deployer,
      qualifiedName("stacking-delegate-1-1"),
      100,
      150,
      50
    );
    result.expectOk().expectBool(true);

    call = await delegatesHandler.getLastSelectedPool(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectPrincipal(qualifiedName("stacking-pool-v1"));

    call = await delegatesHandler.getTargetLockedAmount(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(100);

    call = await delegatesHandler.getLastLockedAmount(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(150);

    call = await delegatesHandler.getLastUnlockedAmount(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectUintWithDecimals(50);
  },
});

//-------------------------------------
// Errors
//-------------------------------------

Clarinet.test({
  name: "delegates-handler: can not delegate less than locked amount",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let delegatesHandler = new DelegatesHandler(chain, deployer);
    let stackingPool = new StackingPool(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    let block = chain.mineBlock([
      Tx.transferSTX(
        200000 * 1000000,
        qualifiedName("reserve-v1"),
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let result = await delegatesHandler.revokeAndDelegate(
      deployer,
      qualifiedName("stacking-delegate-1-1"),
      200000,
      qualifiedName("stacking-pool-v1"),
      50
    );
    result.expectOk().expectBool(true);

    chain.mineEmptyBlockUntil(19);

    result = stackingPool.prepare(deployer);
    result.expectOk().expectBool(true);

    result = await delegatesHandler.revokeAndDelegate(
      deployer,
      qualifiedName("stacking-delegate-1-1"),
      190000,
      qualifiedName("stacking-pool-v1"),
      50
    );
    result.expectErr().expectUint(201001);
  },
});

Clarinet.test({
  name: "delegates-handler: can not handle rewards with wrong delegate, reserve or rewards trait",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "delegates-handler-v1",
        "handle-rewards",
        [
          types.principal(qualifiedName("fake-stacking-delegate")),
          types.principal(qualifiedName("reserve-v1")),
          types.principal(qualifiedName("rewards-v2")),
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);

    block = chain.mineBlock([
      Tx.contractCall(
        "delegates-handler-v1",
        "handle-rewards",
        [
          types.principal(qualifiedName("stacking-delegate-1-1")),
          types.principal(qualifiedName("fake-reserve")),
          types.principal(qualifiedName("rewards-v2")),
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);

    block = chain.mineBlock([
      Tx.contractCall(
        "delegates-handler-v1",
        "handle-rewards",
        [
          types.principal(qualifiedName("stacking-delegate-1-1")),
          types.principal(qualifiedName("reserve-v1")),
          types.principal(qualifiedName("fake-rewards")),
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);
  },
});

Clarinet.test({
  name: "delegates-handler: can not handle excess with wrong delegate, reserve or rewards trait",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "delegates-handler-v1",
        "handle-excess",
        [
          types.principal(qualifiedName("fake-stacking-delegate")),
          types.principal(qualifiedName("reserve-v1")),
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);

    block = chain.mineBlock([
      Tx.contractCall(
        "delegates-handler-v1",
        "handle-excess",
        [
          types.principal(qualifiedName("stacking-delegate-1-1")),
          types.principal(qualifiedName("fake-reserve")),
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);
  },
});

//-------------------------------------
// Access
//-------------------------------------

Clarinet.test({
  name: "delegates-handler: only protocol can update amounts, revoke and delegate",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let delegatesHandler = new DelegatesHandler(chain, deployer);

    let result = await delegatesHandler.updateAmounts(
      wallet_1,
      qualifiedName("stacking-delegate-1-1"),
      100,
      150,
      50
    );
    result.expectErr().expectUint(20001);

    result = await delegatesHandler.revokeAndDelegate(
      wallet_1,
      qualifiedName("stacking-delegate-1-1"),
      200000,
      qualifiedName("stacking-pool-v1"),
      50
    );
    result.expectErr().expectUint(20003);

    result = await delegatesHandler.revoke(
      wallet_1,
      qualifiedName("stacking-delegate-1-1")
    );
    result.expectErr().expectUint(20003);
  },
});
