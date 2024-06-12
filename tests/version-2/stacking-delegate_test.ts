import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "../wrappers/tests-utils.ts";

import { StackingDelegate } from '../wrappers/stacking-delegate-helpers.ts';
import { StackingPool } from '../wrappers/stacking-pool-helpers.ts';
import { Pox4Mock } from '../wrappers/pox-mock-helpers.ts';
import { Rewards } from '../wrappers/rewards-helpers.ts';

//-------------------------------------
// Core 
//-------------------------------------

Clarinet.test({
  name: "stacking-delegate: request and return STX to stack",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stackingDelegate = new StackingDelegate(chain, deployer);

    let block = chain.mineBlock([
      Tx.transferSTX(1000000 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    //
    // Request
    //

    let result = stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 500000);
    result.expectOk().expectUintWithDecimals(500000);

    let call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-1-1"))
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(500000);
    call.result.expectTuple()["unlock-height"].expectUint(0);

    //
    // Return
    //

    result = stackingDelegate.returnStxFromStacking(deployer, "stacking-delegate-1-1", 300000);
    result.expectOk().expectUintWithDecimals(300000);

    call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-1-1"))
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(500000 - 300000);
    call.result.expectTuple()["unlock-height"].expectUint(0);
  }
});

Clarinet.test({
  name: "stacking-delegate: delegate and prepare pool",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stackingDelegate = new StackingDelegate(chain, deployer);
    let stackingPool = new StackingPool(chain, deployer);
    let pox = new Pox4Mock(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    //
    // 500k STX to delegate-1-1
    //

    let block = chain.mineBlock([
      Tx.transferSTX(1000000 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let result = stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 500000);
    result.expectOk().expectUintWithDecimals(500000);

    //
    // Check data
    //

    let call = await stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"))
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(500000);
    call.result.expectTuple()["unlock-height"].expectUint(0);

    call = await pox.getCheckDelegation(qualifiedName("stacking-delegate-1-1"));
    call.result.expectNone()

    //
    // Delegate
    //

    result = stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-v1"), 42);
    result.expectOk().expectBool(true);

    call = await stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"))
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(500000);
    call.result.expectTuple()["unlock-height"].expectUint(0);

    call = await pox.getCheckDelegation(qualifiedName("stacking-delegate-1-1"));
    call.result.expectSome().expectTuple()["amount-ustx"].expectUintWithDecimals(200000);
    call.result.expectSome().expectTuple()["delegated-to"].expectPrincipal(qualifiedName("stacking-pool-v1"));
    call.result.expectSome().expectTuple()["pox-addr"].expectNone();
    call.result.expectSome().expectTuple()["until-burn-ht"].expectSome().expectUint(42);

    //
    // Prepare pool
    //

    chain.mineEmptyBlockUntil(19);

    result = stackingPool.prepare(wallet_1);
    result.expectOk().expectBool(true);

    call = await stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"))
    call.result.expectTuple()["locked"].expectUintWithDecimals(200000);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(300000);
    call.result.expectTuple()["unlock-height"].expectUint(42);

    call = await pox.getCheckDelegation(qualifiedName("stacking-delegate-1-1"));
    call.result.expectSome().expectTuple()["amount-ustx"].expectUintWithDecimals(200000);
    call.result.expectSome().expectTuple()["delegated-to"].expectPrincipal(qualifiedName("stacking-pool-v1"));
    call.result.expectSome().expectTuple()["pox-addr"].expectNone();
    call.result.expectSome().expectTuple()["until-burn-ht"].expectSome().expectUint(42);
  }
});

Clarinet.test({
  name: "stacking-delegate: delegate and revoke after pool prepared",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stackingDelegate = new StackingDelegate(chain, deployer);
    let stackingPool = new StackingPool(chain, deployer);
    let pox = new Pox4Mock(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    //
    // 500k STX to delegate-1-1
    //

    let block = chain.mineBlock([
      Tx.transferSTX(1000000 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let result = stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 500000);
    result.expectOk().expectUintWithDecimals(500000);

    //
    // Check data
    //

    let call = await stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"))
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(500000);
    call.result.expectTuple()["unlock-height"].expectUint(0);

    call = await pox.getCheckDelegation(qualifiedName("stacking-delegate-1-1"));
    call.result.expectNone()

    //
    // Delegate
    //

    result = stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-v1"), 42);
    result.expectOk().expectBool(true);

    call = await stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"))
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(500000);
    call.result.expectTuple()["unlock-height"].expectUint(0);

    call = await pox.getCheckDelegation(qualifiedName("stacking-delegate-1-1"));
    call.result.expectSome().expectTuple()["amount-ustx"].expectUintWithDecimals(200000);
    call.result.expectSome().expectTuple()["delegated-to"].expectPrincipal(qualifiedName("stacking-pool-v1"));
    call.result.expectSome().expectTuple()["pox-addr"].expectNone();
    call.result.expectSome().expectTuple()["until-burn-ht"].expectSome().expectUint(42);

    //
    // Prepare pool
    //

    chain.mineEmptyBlockUntil(19);

    result = stackingPool.prepare(wallet_1);
    result.expectOk().expectBool(true);

    call = await stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"))
    call.result.expectTuple()["locked"].expectUintWithDecimals(200000);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(300000);
    call.result.expectTuple()["unlock-height"].expectUint(42);

    call = await pox.getCheckDelegation(qualifiedName("stacking-delegate-1-1"));
    call.result.expectSome().expectTuple()["amount-ustx"].expectUintWithDecimals(200000);
    call.result.expectSome().expectTuple()["delegated-to"].expectPrincipal(qualifiedName("stacking-pool-v1"));
    call.result.expectSome().expectTuple()["pox-addr"].expectNone();
    call.result.expectSome().expectTuple()["until-burn-ht"].expectSome().expectUint(42);

    //
    // Revoke
    //

    result = await stackingDelegate.revokeDelegateStx(deployer, "stacking-delegate-1-1");
    result.expectOk().expectBool(true);

    call = await stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"))
    call.result.expectTuple()["locked"].expectUintWithDecimals(200000);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(300000);
    call.result.expectTuple()["unlock-height"].expectUint(42);

    call = await pox.getCheckDelegation(qualifiedName("stacking-delegate-1-1"));
    call.result.expectNone();
  }
});

Clarinet.test({
  name: "stacking-delegate: delegate and revoke before pool prepared",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stackingDelegate = new StackingDelegate(chain, deployer);
    let stackingPool = new StackingPool(chain, deployer);
    let pox = new Pox4Mock(chain, deployer);

    //
    // 500k STX to delegate-1-1
    //

    let block = chain.mineBlock([
      Tx.transferSTX(1000000 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let result = stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 500000);
    result.expectOk().expectUintWithDecimals(500000);

    //
    // Check data
    //

    let call = await stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"))
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(500000);
    call.result.expectTuple()["unlock-height"].expectUint(0);

    call = await pox.getCheckDelegation(qualifiedName("stacking-delegate-1-1"));
    call.result.expectNone()

    //
    // Delegate
    //

    result = stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-v1"), 42);
    result.expectOk().expectBool(true);

    call = await stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"))
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(500000);
    call.result.expectTuple()["unlock-height"].expectUint(0);

    call = await pox.getCheckDelegation(qualifiedName("stacking-delegate-1-1"));
    call.result.expectSome().expectTuple()["amount-ustx"].expectUintWithDecimals(200000);
    call.result.expectSome().expectTuple()["delegated-to"].expectPrincipal(qualifiedName("stacking-pool-v1"));
    call.result.expectSome().expectTuple()["pox-addr"].expectNone();
    call.result.expectSome().expectTuple()["until-burn-ht"].expectSome().expectUint(42);

    //
    // Revoke
    //

    result = await stackingDelegate.revokeDelegateStx(deployer, "stacking-delegate-1-1");
    result.expectOk().expectBool(true);

    call = await stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"))
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(500000);
    call.result.expectTuple()["unlock-height"].expectUint(0);

    call = await pox.getCheckDelegation(qualifiedName("stacking-delegate-1-1"));
    call.result.expectNone();

    //
    // Prepare pool
    //

    // Can not prepare as nothing delegated
    result = stackingPool.prepare(wallet_1);
    result.expectErr().expectUint(205001);
  }
});

Clarinet.test({
  name: "stacking-delegate: hendle rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stackingDelegate = new StackingDelegate(chain, deployer);
    let rewards = new Rewards(chain, deployer);

    let block = chain.mineBlock([
      Tx.transferSTX(30 * 1000000, qualifiedName("stacking-delegate-1-1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let result = stackingDelegate.handleRewards(deployer, "stacking-delegate-1-1", qualifiedName("stacking-pool-v1"), 30);
    result.expectOk().expectUintWithDecimals(30);

    let call = await rewards.getTotalCommission();
    call.result.expectUintWithDecimals(1.5);
    call = await rewards.getTotalRewardsLeft();
    call.result.expectUintWithDecimals(28.5);
  }
});


//-------------------------------------
// Admin 
//-------------------------------------

Clarinet.test({
  name: "stacking-delegate: return STX to reserve",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stackingDelegate = new StackingDelegate(chain, deployer);

    let block = chain.mineBlock([
      Tx.transferSTX(1000000 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let result = stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 100);
    result.expectOk().expectUintWithDecimals(100);

    let call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-1-1"))
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(100);
    
    result = stackingDelegate.returnStx(deployer, "stacking-delegate-1-1");
    result.expectOk().expectUintWithDecimals(100);

    call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-1-1"))
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);

    result = stackingDelegate.returnStx(deployer, "stacking-delegate-1-1");
    result.expectOk().expectUintWithDecimals(0);
  }
});

//-------------------------------------
// Errors 
//-------------------------------------

Clarinet.test({
  name: "stacking-delegate: can not use reserve methods with wrong trait",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall("stacking-delegate-1-1", "request-stx-to-stack", [
        types.principal(qualifiedName("fake-reserve")),
        types.uint(100 * 1000000),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);

    block = chain.mineBlock([
      Tx.contractCall("stacking-delegate-1-1", "return-stx-from-stacking", [
        types.principal(qualifiedName("fake-reserve")),
        types.uint(100 * 1000000),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);
  }
});

Clarinet.test({
  name: "stacking-delegate: can not handle rewards with wrong trait",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall("stacking-delegate-1-1", "handle-rewards", [
        types.principal(qualifiedName("stacking-pool-v1")),
        types.uint(100 * 1000000),
        types.principal(qualifiedName("fake-rewards")),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);
  }
});

Clarinet.test({
  name: "stacking-delegate: can not use return STX with wrong trait",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall("stacking-delegate-1-1", "return-stx", [
        types.principal(qualifiedName("fake-reserve")),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);
  }
});


//-------------------------------------
// Access 
//-------------------------------------

Clarinet.test({
  name: "stacking-delegate: only protocol can call public functions",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stackingDelegate = new StackingDelegate(chain, deployer);

    let result = stackingDelegate.delegateStx(wallet_1, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-v1"), 42);
    result.expectErr().expectUint(20003);

    result = await stackingDelegate.revokeDelegateStx(wallet_1, "stacking-delegate-1-1");
    result.expectErr().expectUint(20003);

    result = stackingDelegate.requestStxToStack(wallet_1, "stacking-delegate-1-1", 500000);
    result.expectErr().expectUint(20003);

    result = stackingDelegate.returnStxFromStacking(wallet_1, "stacking-delegate-1-1", 300000);
    result.expectErr().expectUint(20003);

    result = stackingDelegate.handleRewards(wallet_1, "stacking-delegate-1-1", qualifiedName("stacking-pool-v1"), 30);
    result.expectErr().expectUint(20003);

    result = stackingDelegate.returnStx(wallet_1, "stacking-delegate-1-1");
    result.expectErr().expectUint(20003);
  }
});
