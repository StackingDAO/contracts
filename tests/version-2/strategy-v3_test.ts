import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName, REWARD_CYCLE_LENGTH } from "../wrappers/tests-utils.ts";

import { StackingDelegate } from '../wrappers/stacking-delegate-helpers.ts';
import { StrategyV3,StrategyV3DelegatesV1 } from '../wrappers/strategy-helpers.ts';
import { Reserve } from '../wrappers/reserve-helpers.ts';
import { StackingPool } from '../wrappers/stacking-pool-helpers.ts';
import { FastPoolV2 } from '../wrappers/pox-fast-pool-v2-helpers.ts';
import { Pox4Mock } from '../wrappers/pox-mock-helpers.ts';

//-------------------------------------
// Strategy V3 - Core 
//-------------------------------------

Clarinet.test({
  name: "strategy-v3: start stacking, handle outflow, handle inflow (3 cycles)",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stackingDelegate = new StackingDelegate(chain, deployer);
    let strategyV3 = new StrategyV3(chain, deployer)
    let reserve = new Reserve(chain, deployer);
    let stackingPool = new StackingPool(chain, deployer);
    let fastPool = new FastPoolV2(chain, deployer);
    let pox = new Pox4Mock(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    //
    // Add STX to reserve to stack
    //

    // Move to cycle 1
    await chain.mineEmptyBlockUntil(22);

    let block = chain.mineBlock([
      Tx.transferSTX(250000 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Move to end of cycle 1, where we can prepare
    await chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH + 14);


    //
    // Prepare pools and delegates
    //

    let result = await strategyV3.preparePools(deployer);
    result.expectOk().expectBool(true);

    result = await strategyV3.prepareDelegates(deployer, qualifiedName("stacking-pool-v1"));
    result.expectOk().expectBool(true);

    result = await strategyV3.prepareDelegates(deployer, qualifiedName("pox-fast-pool-v2-mock"));
    result.expectOk().expectBool(true);

    result = await strategyV3.execute(
      deployer,
      qualifiedName("stacking-pool-v1"),
      [qualifiedName("stacking-delegate-1-1"), qualifiedName("stacking-delegate-1-2"), qualifiedName("stacking-delegate-1-3")]
    );
    result.expectOk().expectBool(true);

    result = await strategyV3.execute(
      deployer,
      qualifiedName("pox-fast-pool-v2-mock"),
      [qualifiedName("stacking-delegate-2-1"), qualifiedName("stacking-delegate-2-2"), qualifiedName("stacking-delegate-2-3")]
    );
    result.expectOk().expectBool(true);


    //
    // Check data
    //

    let call = await strategyV3.getCyclePreparedPools();
    call.result.expectUint(1);


    call = await strategyV3.getPreparePoolsData(qualifiedName("stacking-pool-v1"));
    call.result.expectTuple()["cycle-prepared-pool"].expectUint(1);
    call.result.expectTuple()["cycle-prepared-delegates"].expectUint(1);
    call.result.expectTuple()["cycle-executed-pool"].expectUint(1);
    call.result.expectTuple()["stacking-amount"].expectUintWithDecimals(175000);

    call = await strategyV3.getPrepareDelegatesData(qualifiedName("stacking-delegate-1-1"));
    call.result.expectTuple()["stacking-amount"].expectUintWithDecimals(87500);
    call = await strategyV3.getPrepareDelegatesData(qualifiedName("stacking-delegate-1-2"));
    call.result.expectTuple()["stacking-amount"].expectUintWithDecimals(52500);
    call = await strategyV3.getPrepareDelegatesData(qualifiedName("stacking-delegate-1-3"));
    call.result.expectTuple()["stacking-amount"].expectUintWithDecimals(35000);


    call = await strategyV3.getPreparePoolsData(qualifiedName("pox-fast-pool-v2-mock"));
    call.result.expectTuple()["cycle-prepared-pool"].expectUint(1);
    call.result.expectTuple()["cycle-prepared-delegates"].expectUint(1);
    call.result.expectTuple()["cycle-executed-pool"].expectUint(1);
    call.result.expectTuple()["stacking-amount"].expectUintWithDecimals(75000);

    call = await strategyV3.getPrepareDelegatesData(qualifiedName("stacking-delegate-2-1"));
    call.result.expectTuple()["stacking-amount"].expectUintWithDecimals(37500);
    call = await strategyV3.getPrepareDelegatesData(qualifiedName("stacking-delegate-2-2"));
    call.result.expectTuple()["stacking-amount"].expectUintWithDecimals(22500);
    call = await strategyV3.getPrepareDelegatesData(qualifiedName("stacking-delegate-2-3"));
    call.result.expectTuple()["stacking-amount"].expectUintWithDecimals(15000);


    //
    // Prepare stacking-pool-v1
    //

    result = await stackingPool.prepare(deployer);
    result.expectOk().expectBool(true);

    call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-1-1"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(87500);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(REWARD_CYCLE_LENGTH * 3);

    call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-1-2"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(52500);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(REWARD_CYCLE_LENGTH * 3);

    call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-1-3"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(35000);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(REWARD_CYCLE_LENGTH * 3);


    //
    // Prepare pox-fast-pool-v2-mock
    //

    result = await fastPool.delegateStackStxMany(deployer, [qualifiedName("stacking-delegate-2-1"), qualifiedName("stacking-delegate-2-2"), qualifiedName("stacking-delegate-2-3")]);
    result.expectOk().expectTuple()["locking-result"].expectList()

    call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-2-1"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(37499);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(1);
    call.result.expectTuple()["unlock-height"].expectUint(REWARD_CYCLE_LENGTH * 3);

    call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-2-2"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(22499);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(1);
    call.result.expectTuple()["unlock-height"].expectUint(REWARD_CYCLE_LENGTH * 3);

    call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-2-3"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(14999);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(1);
    call.result.expectTuple()["unlock-height"].expectUint(REWARD_CYCLE_LENGTH * 3);


    //
    // Lock STX so there is outflow
    //

    result = await reserve.lockStxForWithdrawal(deployer, 40000);
    result.expectOk().expectUintWithDecimals(40000);


    //
    // Prepare pools, prepare delegates and execute pools
    //

    // Move to end of cycle 2, where we can prepare
    await chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH * 2 + 14);

    result = await strategyV3.preparePools(deployer);
    result.expectOk().expectBool(true);

    result = await strategyV3.prepareDelegates(deployer, qualifiedName("stacking-pool-v1"));
    result.expectOk().expectBool(true);

    result = await strategyV3.prepareDelegates(deployer, qualifiedName("pox-fast-pool-v2-mock"));
    result.expectOk().expectBool(true);

    result = await strategyV3.execute(
      deployer,
      qualifiedName("stacking-pool-v1"),
      [qualifiedName("stacking-delegate-1-1"), qualifiedName("stacking-delegate-1-2"), qualifiedName("stacking-delegate-1-3")]
    );
    result.expectOk().expectBool(true);

    result = await strategyV3.execute(
      deployer,
      qualifiedName("pox-fast-pool-v2-mock"),
      [qualifiedName("stacking-delegate-2-1"), qualifiedName("stacking-delegate-2-2"), qualifiedName("stacking-delegate-2-3")]
    );
    result.expectOk().expectBool(true);


    //
    // Check data
    //

    call = await strategyV3.getCyclePreparedPools();
    call.result.expectUint(2);

    call = await strategyV3.getPreparePoolsData(qualifiedName("stacking-pool-v1"));
    call.result.expectTuple()["cycle-prepared-pool"].expectUint(2);
    call.result.expectTuple()["cycle-prepared-delegates"].expectUint(2);
    call.result.expectTuple()["cycle-executed-pool"].expectUint(2);
    call.result.expectTuple()["stacking-amount"].expectUintWithDecimals(147000);

    call = await strategyV3.getPrepareDelegatesData(qualifiedName("stacking-delegate-1-1"));
    call.result.expectTuple()["stacking-amount"].expectUintWithDecimals(87500);
    call = await strategyV3.getPrepareDelegatesData(qualifiedName("stacking-delegate-1-2"));
    call.result.expectTuple()["stacking-amount"].expectUintWithDecimals(52500);
    call = await strategyV3.getPrepareDelegatesData(qualifiedName("stacking-delegate-1-3"));
    call.result.expectTuple()["stacking-amount"].expectUintWithDecimals(0); // 28k outflow so stopped this delegate


    call = await strategyV3.getPreparePoolsData(qualifiedName("pox-fast-pool-v2-mock"));
    call.result.expectTuple()["cycle-prepared-pool"].expectUint(2);
    call.result.expectTuple()["cycle-prepared-delegates"].expectUint(2);
    call.result.expectTuple()["cycle-executed-pool"].expectUint(2);
    call.result.expectTuple()["stacking-amount"].expectUintWithDecimals(63000);

    call = await strategyV3.getPrepareDelegatesData(qualifiedName("stacking-delegate-2-1"));
    call.result.expectTuple()["stacking-amount"].expectUintWithDecimals(37499);
    call = await strategyV3.getPrepareDelegatesData(qualifiedName("stacking-delegate-2-2"));
    call.result.expectTuple()["stacking-amount"].expectUintWithDecimals(22499);
    call = await strategyV3.getPrepareDelegatesData(qualifiedName("stacking-delegate-2-3"));
    call.result.expectTuple()["stacking-amount"].expectUintWithDecimals(0); // 12k outflow so stopped this delegate


    //
    // Prepare pools
    //

    result = await stackingPool.prepare(deployer);
    result.expectOk().expectBool(true);

    result = await fastPool.delegateStackStxMany(deployer, [qualifiedName("stacking-delegate-2-1"), qualifiedName("stacking-delegate-2-2"), qualifiedName("stacking-delegate-2-3")]);
    result.expectOk().expectTuple()["locking-result"].expectList()


    //
    // Unlocks
    //

    // Move to next cycle so we can unlock
    await chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH * 3 + 2);

    result = await pox.unlock(deployer, qualifiedName("stacking-delegate-1-3"));
    result.expectOk().expectUintWithDecimals(35000);

    result = await pox.unlock(deployer, qualifiedName("stacking-delegate-2-3"));
    result.expectOk().expectUintWithDecimals(14999);

    call = await reserve.getStxBalance();
    call.result.expectOk().expectUintWithDecimals(3);

    result = await strategyV3.returnUnlockedStx(deployer, [qualifiedName("stacking-delegate-1-3"), qualifiedName("stacking-delegate-2-3")])
    result.expectOk().expectList()[0].expectOk().expectUintWithDecimals(35000);
    result.expectOk().expectList()[1].expectOk().expectUintWithDecimals(14999);

    call = await reserve.getStxBalance();
    call.result.expectOk().expectUintWithDecimals(3 + 35000 + 14999);

    //
    // Data
    //

    call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-1-1"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(87500);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(REWARD_CYCLE_LENGTH * 4);

    call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-1-2"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(52500);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(REWARD_CYCLE_LENGTH * 4);

    call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-1-3"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(0);


    call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-2-1"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(37499);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(REWARD_CYCLE_LENGTH * 4);

    call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-2-2"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(22499);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(REWARD_CYCLE_LENGTH * 4);

    call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-2-3"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(0);


    //
    // Inflow
    //

    block = chain.mineBlock([
      Tx.transferSTX(50000 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);


    //
    // Prepare pools, prepare delegates and execute pools
    //

    // Move to end of cycle 3, where we can prepare
    await chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH * 3 + 13);

    result = await strategyV3.preparePools(deployer);
    result.expectOk().expectBool(true);

    result = await strategyV3.prepareDelegates(deployer, qualifiedName("stacking-pool-v1"));
    result.expectOk().expectBool(true);

    result = await strategyV3.prepareDelegates(deployer, qualifiedName("pox-fast-pool-v2-mock"));
    result.expectOk().expectBool(true);

    result = await strategyV3.execute(
      deployer,
      qualifiedName("stacking-pool-v1"),
      [qualifiedName("stacking-delegate-1-1"), qualifiedName("stacking-delegate-1-2"), qualifiedName("stacking-delegate-1-3")]
    );
    result.expectOk().expectBool(true);

    result = await strategyV3.execute(
      deployer,
      qualifiedName("pox-fast-pool-v2-mock"),
      [qualifiedName("stacking-delegate-2-1"), qualifiedName("stacking-delegate-2-2"), qualifiedName("stacking-delegate-2-3")]
    );
    result.expectOk().expectBool(true);


    //
    // Prepare pools
    //

    result = await stackingPool.prepare(deployer);
    result.expectOk().expectBool(true);

    result = await fastPool.delegateStackStxMany(deployer, [qualifiedName("stacking-delegate-2-1"), qualifiedName("stacking-delegate-2-2"), qualifiedName("stacking-delegate-2-3")]);
    result.expectOk().expectTuple()["locking-result"].expectList()


    //
    // Data
    //

    call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-1-1"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(91000);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(REWARD_CYCLE_LENGTH * 5);

    call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-1-2"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(54600);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(REWARD_CYCLE_LENGTH * 5);

    call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-1-3"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(36400);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(REWARD_CYCLE_LENGTH * 5);


    call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-2-1"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(38999);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(1);
    call.result.expectTuple()["unlock-height"].expectUint(REWARD_CYCLE_LENGTH * 5);

    call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-2-2"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(23399);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(1);
    call.result.expectTuple()["unlock-height"].expectUint(REWARD_CYCLE_LENGTH * 5);

    call = await stackingDelegate.getStxAccount(qualifiedName("stacking-delegate-2-3"));
    call.result.expectTuple()["locked"].expectUintWithDecimals(15599);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(1);
    call.result.expectTuple()["unlock-height"].expectUint(REWARD_CYCLE_LENGTH * 5);

  }
});

//-------------------------------------
// Strategy V3 - Errors 
//-------------------------------------

Clarinet.test({
  name: "strategy-v3: pool can not stack next cycle without delegates updating delegation",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategyV3 = new StrategyV3(chain, deployer)
    let stackingPool = new StackingPool(chain, deployer);
    let pox = new Pox4Mock(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    // 150k STX to reserve
    let block = chain.mineBlock([
      Tx.transferSTX(200000 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // 
    // Stack and lock amount for pool
    //

    // Move to end of cycle 1, where we can prepare
    await chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH + 15);

    let result = await strategyV3.preparePools(deployer);
    result.expectOk().expectBool(true);

    result = await strategyV3.prepareDelegates(deployer, qualifiedName("stacking-pool-v1"));
    result.expectOk().expectBool(true);

    result = await strategyV3.execute(
      deployer,
      qualifiedName("stacking-pool-v1"),
      [qualifiedName("stacking-delegate-1-1"), qualifiedName("stacking-delegate-1-2"), qualifiedName("stacking-delegate-1-3")]
    );
    result.expectOk().expectBool(true);

    // 
    // Stack and lock amount for pool
    //

    let call = await pox.getCheckDelegation(qualifiedName("stacking-delegate-1-1"));
    call.result.expectSome().expectTuple()["until-burn-ht"].expectSome().expectUint(63);

    result = await stackingPool.prepare(deployer);
    result.expectOk().expectBool(true);

    // Move to end of cycle 2
    await chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH * 2 + 18);

    // ERR_DELEGATION_EXPIRES_DURING_LOCK
    result = await stackingPool.prepare(deployer);
    result.expectErr().expectUint(21);
  }
});

Clarinet.test({
  name: "strategy-v3: can not execute if delegates list does not match",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategyV3 = new StrategyV3(chain, deployer)
    let stackingPool = new StackingPool(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    // 150k STX to reserve
    let block = chain.mineBlock([
      Tx.transferSTX(200000 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // 
    // Stack and lock amount for pool
    //

    // Move to end of cycle 1, where we can prepare
    await chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH + 15);

    let result = await strategyV3.preparePools(deployer);
    result.expectOk().expectBool(true);

    result = await strategyV3.prepareDelegates(deployer, qualifiedName("stacking-pool-v1"));
    result.expectOk().expectBool(true);

    result = await strategyV3.execute(
      deployer,
      qualifiedName("stacking-pool-v1"),
      [qualifiedName("stacking-delegate-1-1"), qualifiedName("stacking-delegate-1-2"), qualifiedName("stacking-delegate-1-3"), qualifiedName("stacking-delegate-1-3"), qualifiedName("stacking-delegate-1-3")]
    );
    result.expectErr().expectUint(206001);

  }
});

//-------------------------------------
// Strategy V3 - Access 
//-------------------------------------
