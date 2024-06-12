import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName, REWARD_CYCLE_LENGTH } from "../wrappers/tests-utils.ts";

import { StrategyV4 } from '../wrappers/strategy-helpers.ts';
import { Reserve } from '../wrappers/reserve-helpers.ts';
import { StackingPool } from '../wrappers/stacking-pool-helpers.ts';
import { Pox4Mock } from '../wrappers/pox-mock-helpers.ts';

//-------------------------------------
// Strategy V2
//-------------------------------------

Clarinet.test({
  name: "strategy-v4: calculate outflow/inflow",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategy = new StrategyV4(chain, deployer)
    let stackingPool = new StackingPool(chain, deployer);
    let reserve = new Reserve(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    // 150k STX to reserve
    let block = chain.mineBlock([
      Tx.transferSTX(150000 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    //
    // Inflow
    //

    let call = await strategy.getInflowOutflow();
    call.result.expectTuple()["outflow"].expectUintWithDecimals(0);
    call.result.expectTuple()["inflow"].expectUintWithDecimals(150000);
    call.result.expectTuple()["total-stacking"].expectUintWithDecimals(0);
    call.result.expectTuple()["total-idle"].expectUintWithDecimals(150000);
    call.result.expectTuple()["total-withdrawals"].expectUintWithDecimals(0);


    //
    // Stack
    //

    let result = strategy.performPoolDelegation(deployer, qualifiedName("stacking-pool-v1"), [
      { delegate: qualifiedName("stacking-delegate-1-1"), amount: 100000 },
      { delegate: qualifiedName("stacking-delegate-1-2"), amount: 30000 },
      { delegate: qualifiedName("stacking-delegate-1-3"), amount: 20000 }
    ])
    result.expectOk().expectBool(true);

    chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH - 3)

    result = stackingPool.prepare(deployer);
    result.expectOk().expectBool(true);

    //
    // Outflow
    //

    reserve.lockStxForWithdrawal(deployer, 20000);
    result.expectOk().expectBool(true);

    call = await strategy.getInflowOutflow();
    call.result.expectTuple()["outflow"].expectUintWithDecimals(20000);
    call.result.expectTuple()["inflow"].expectUintWithDecimals(0);
    call.result.expectTuple()["total-stacking"].expectUintWithDecimals(150000);
    call.result.expectTuple()["total-idle"].expectUintWithDecimals(0);
    call.result.expectTuple()["total-withdrawals"].expectUintWithDecimals(20000);
  }
});

Clarinet.test({
  name: "strategy-v4: perform delegation",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategy = new StrategyV4(chain, deployer)
    let pox = new Pox4Mock(chain, deployer);
    let stackingPool = new StackingPool(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    // 300k STX to reserve
    let block = chain.mineBlock([
      Tx.transferSTX(300000 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
    
    //
    // Perform delegation
    //
    let result = strategy.performPoolDelegation(deployer, qualifiedName("stacking-pool-v1"), [
      { delegate: qualifiedName("stacking-delegate-1-1"), amount: 100000 },
      { delegate: qualifiedName("stacking-delegate-1-2"), amount: 30000 },
      { delegate: qualifiedName("stacking-delegate-1-3"), amount: 20000 }
    ])
    result.expectOk().expectBool(true);

    let call = await pox.getCheckDelegation(qualifiedName("stacking-delegate-1-1"));
    call.result.expectSome().expectTuple()["amount-ustx"].expectUintWithDecimals(100000);
    call.result.expectSome().expectTuple()["delegated-to"].expectPrincipal(qualifiedName("stacking-pool-v1"));
    call.result.expectSome().expectTuple()["until-burn-ht"].expectSome().expectUint(REWARD_CYCLE_LENGTH * 2);

    call = await stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(100000);
    call.result.expectTuple()["unlock-height"].expectUint(0);

    //
    // Prepare pool
    //

    chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH - 3)

    result = stackingPool.prepare(deployer);
    result.expectOk().expectBool(true);

    call = await stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(100000);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(REWARD_CYCLE_LENGTH * 2);

    //
    // Perform delegation
    //

    chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH + 3)

    // Inflow, outflow and same
    result = strategy.performPoolDelegation(deployer, qualifiedName("stacking-pool-v1"), [
      { delegate: qualifiedName("stacking-delegate-1-1"), amount: 130000 },
      { delegate: qualifiedName("stacking-delegate-1-2"), amount: 0 },
      { delegate: qualifiedName("stacking-delegate-1-3"), amount: 20000 }
    ])
    result.expectOk().expectBool(true);

    call = await pox.getCheckDelegation(qualifiedName("stacking-delegate-1-1"));
    call.result.expectSome().expectTuple()["amount-ustx"].expectUintWithDecimals(130000);
    call.result.expectSome().expectTuple()["delegated-to"].expectPrincipal(qualifiedName("stacking-pool-v1"));
    call.result.expectSome().expectTuple()["until-burn-ht"].expectSome().expectUint(REWARD_CYCLE_LENGTH * 3);

    call = await pox.getCheckDelegation(qualifiedName("stacking-delegate-1-2"));
    call.result.expectNone();

    call = await pox.getCheckDelegation(qualifiedName("stacking-delegate-1-3"));
    call.result.expectSome().expectTuple()["amount-ustx"].expectUintWithDecimals(20000);
    call.result.expectSome().expectTuple()["delegated-to"].expectPrincipal(qualifiedName("stacking-pool-v1"));
    call.result.expectSome().expectTuple()["until-burn-ht"].expectSome().expectUint(REWARD_CYCLE_LENGTH * 3);

    //
    // Prepare pool
    //

    chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH * 2 - 3)

    result = stackingPool.prepare(deployer);
    result.expectOk().expectBool(true);

    chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH * 2 + 3)

    // Manually unlock
    pox.unlock(deployer, qualifiedName("stacking-delegate-1-2"))

    call = await stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(130000);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(REWARD_CYCLE_LENGTH * 3);

    call = await stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-2"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(30000);
    call.result.expectTuple()["unlock-height"].expectUint(0);

    call = await stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-3"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(20000);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(REWARD_CYCLE_LENGTH * 3);
  }
});

//-------------------------------------
// Access 
//-------------------------------------

Clarinet.test({
  name: "strategy-v4: only manager can perform delegations",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let strategy = new StrategyV4(chain, deployer)
    let stackingPool = new StackingPool(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    // 300k STX to reserve
    let block = chain.mineBlock([
      Tx.transferSTX(300000 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Not manager
    let result = strategy.performPoolDelegation(wallet_1, qualifiedName("stacking-pool-v1"), [
      { delegate: qualifiedName("stacking-delegate-1-1"), amount: 100000 },
    ])
    result.expectErr().expectUint(40001);

    let call = strategy.getManager();
    call.result.expectPrincipal(deployer.address);
    
    // Update manager
    result = strategy.setManager(deployer, wallet_1.address);
    result.expectOk().expectBool(true);

    call = strategy.getManager();
    call.result.expectPrincipal(wallet_1.address);

    // New manager
    result = strategy.performPoolDelegation(wallet_1, qualifiedName("stacking-pool-v1"), [
      { delegate: qualifiedName("stacking-delegate-1-1"), amount: 100000 },
    ])
    result.expectOk().expectBool(true);

    // Old manager
    result = strategy.performPoolDelegation(deployer, qualifiedName("stacking-pool-v1"), [
      { delegate: qualifiedName("stacking-delegate-1-1"), amount: 100000 },
    ])
    result.expectErr().expectUint(40001);
  }
});
