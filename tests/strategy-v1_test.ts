import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName, REWARD_CYCLE_LENGTH, hexToBytes } from "./helpers/tests-utils.ts";
qualifiedName('')

import { StrategyV1 as Strategy } from './helpers/strategy-helpers.ts';
import { Core } from './helpers/stacking-dao-core-helpers.ts';
import { Reserve } from './helpers/reserve-helpers.ts';
import { Pox3Mock } from './helpers/pox-3-mock-helpers.ts';
import { Stacker } from './helpers/stacker-helpers.ts';

//-------------------------------------
// Reward address
//-------------------------------------

Clarinet.test({
  name: "strategy-v1: get and set reward address",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategy = new Strategy(chain, deployer);

    let call = await strategy.getPoxRewardAddress();
    call.result.expectTuple()["version"].expectBuff(hexToBytes("0x00"));
    call.result.expectTuple()["hashbytes"].expectBuff(hexToBytes("0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ac"));

    let result = await strategy.setPoxRewardAddress(deployer, hexToBytes("0x01"), hexToBytes("0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ab"));
    result.expectOk().expectBool(true);

    call = await strategy.getPoxRewardAddress();
    call.result.expectTuple()["version"].expectBuff(hexToBytes("0x01"));
    call.result.expectTuple()["hashbytes"].expectBuff(hexToBytes("0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ab"));
  }
});

//-------------------------------------
// Get PoX info
//-------------------------------------

Clarinet.test({
  name: "strategy-v1: get PoX info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategy = new Strategy(chain, deployer);

    let call = await strategy.getPoxCycle();
    call.result.expectUint(0);

    call = await strategy.getNextCycleStartBurnHeight();
    call.result.expectUint(REWARD_CYCLE_LENGTH);

    call = await strategy.getStackingMinimum();
    call.result.expectUintWithDecimals(50000);

    call = await strategy.getPrepareCycleLength();
    call.result.expectUint(3);
  }
});

//-------------------------------------
// Calculations - Get inflow/outflow
//-------------------------------------

Clarinet.test({
  name: "strategy-v1: calculate inflow/outflow",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategy = new Strategy(chain, deployer);
    let core = new Core(chain, deployer);
    let reserve = new Reserve(chain, deployer);
    let poxMock = new Pox3Mock(chain, deployer);

    //
    // Deposit 300k STX
    //
    let result = core.deposit(deployer, 300000);
    result.expectOk().expectUintWithDecimals(300000);

    let call = strategy.getInflowOutflow();
    call.result.expectTuple()["inflow"].expectUintWithDecimals(300000);
    call.result.expectTuple()["outflow"].expectUintWithDecimals(0);
    call.result.expectTuple()["total-stacking"].expectUintWithDecimals(0);

    result = strategy.performInflow(deployer, [50000, 50000, 50000, 50000, 50000, 50000, 0, 0, 0, 0]);
    result.expectOk().expectBool(true);

    // Cycle info
    call = core.getCycleInfo(0);
    call.result.expectTuple()["deposited"].expectUintWithDecimals(300000);
    call.result.expectTuple()["withdraw-init"].expectUintWithDecimals(0);

    // Advance 1 cycle
    chain.mineEmptyBlock(REWARD_CYCLE_LENGTH);

    call = strategy.getPoxCycle()
    call.result.expectUint(1);

    // 
    // Deposit 500k STX
    //
    result = core.deposit(deployer, 500000);
    result.expectOk().expectUintWithDecimals(500000);

    call = strategy.getInflowOutflow();
    call.result.expectTuple()["inflow"].expectUintWithDecimals(500000);
    call.result.expectTuple()["outflow"].expectUintWithDecimals(0);
    call.result.expectTuple()["total-stacking"].expectUintWithDecimals(300000);
    call.result.expectTuple()["total-idle"].expectUintWithDecimals(500000);
    call.result.expectTuple()["total-withdrawals"].expectUintWithDecimals(0);

    result = strategy.performInflow(deployer, [50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000]);
    result.expectOk().expectBool(true);

    // Cycle info
    call = core.getCycleInfo(1);
    call.result.expectTuple()["deposited"].expectUintWithDecimals(500000);
    call.result.expectTuple()["withdraw-init"].expectUintWithDecimals(0);

    // Advance 1 cycle
    chain.mineEmptyBlock(REWARD_CYCLE_LENGTH);

    call = strategy.getPoxCycle()
    call.result.expectUint(2);

    // 
    // Deposit 10k STX, but 30k to be withdrawn
    // So net outflow of 20k STX
    //

    result = core.deposit(deployer, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    result = core.initWithdraw(deployer, 30000);
    result.expectOk().expectUint(0);

    call = strategy.getInflowOutflow();
    call.result.expectTuple()["inflow"].expectUintWithDecimals(0);
    call.result.expectTuple()["outflow"].expectUintWithDecimals(20000);
    call.result.expectTuple()["total-stacking"].expectUintWithDecimals(800000);
    call.result.expectTuple()["total-idle"].expectUintWithDecimals(10000);
    call.result.expectTuple()["total-withdrawals"].expectUintWithDecimals(30000);

    result = strategy.performOutflow(deployer, [true, false, false, false, false, false, false, false, false, false]);
    result.expectOk().expectBool(true);

    // Cycle info
    call = core.getCycleInfo(2);
    call.result.expectTuple()["deposited"].expectUintWithDecimals(10000);
    call.result.expectTuple()["withdraw-init"].expectUintWithDecimals(0);

    // Cycle info
    call = core.getCycleInfo(3);
    call.result.expectTuple()["deposited"].expectUintWithDecimals(0);
    call.result.expectTuple()["withdraw-init"].expectUintWithDecimals(30000);

    // Advance 1 cycle
    chain.mineEmptyBlock(REWARD_CYCLE_LENGTH);

    call = strategy.getPoxCycle()
    call.result.expectUint(3);

    //
    // Return STX to reserve
    //

    // Need to unlock manually in tests
    // Stacked 50k initally + 50k second time = 100k total
    result = await poxMock.unlock(deployer, qualifiedName("stacker-1"));
    result.expectOk().expectUintWithDecimals(100000);

    // Return STX
    result = strategy.stackersReturnStx(deployer);
    result.expectOk().expectBool(true);

    // 10k STX from deposit + 100k STX from stopping stacker 1
    call = reserve.getStxBalance();
    call.result.expectOk().expectUintWithDecimals(110000);

    // Was stacking 800k STX but stopped stacker with 100k STX
    call = reserve.getStxStacking();
    call.result.expectOk().expectUintWithDecimals(700000);

    call = reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(810000);

    // 
    // Deposit 30k STX, but 10k to be withdrawn
    // So net inflow of 20k STX
    //

    result = core.deposit(deployer, 30000);
    result.expectOk().expectUintWithDecimals(30000);

    result = core.initWithdraw(deployer, 10000);
    result.expectOk().expectUint(1);

    // 110k STX idle, of which 30k STX for withdrawals
    // Now there is a net inflow of 20k STX
    // So inflow should be: (110-30)+20 = 100
    call = strategy.getInflowOutflow();
    call.result.expectTuple()["inflow"].expectUintWithDecimals(100000);
    call.result.expectTuple()["outflow"].expectUintWithDecimals(0);
    call.result.expectTuple()["total-stacking"].expectUintWithDecimals(700000);
    // 100k from stopped stacker + 10k deposit + 30k deposit
    call.result.expectTuple()["total-idle"].expectUintWithDecimals(140000);
    // 30k + 10k
    call.result.expectTuple()["total-withdrawals"].expectUintWithDecimals(40000);

    // Perform inflow
    result = strategy.performInflow(deployer, [50000, 0, 0, 0, 0, 0, 0, 0, 0, 50000]);
    result.expectOk().expectBool(true);

    // Cycle info
    call = core.getCycleInfo(3);
    call.result.expectTuple()["deposited"].expectUintWithDecimals(30000);
    call.result.expectTuple()["withdraw-init"].expectUintWithDecimals(30000);

    // Cycle info
    call = core.getCycleInfo(4);
    call.result.expectTuple()["deposited"].expectUintWithDecimals(0);
    call.result.expectTuple()["withdraw-init"].expectUintWithDecimals(10000);

    // Advance 1 cycle
    chain.mineEmptyBlock(REWARD_CYCLE_LENGTH);

    call = strategy.getPoxCycle()
    call.result.expectUint(4);
  }
});

//-------------------------------------
// Calculations - Inflow per stacker
//-------------------------------------

Clarinet.test({
  name: "strategy-v1: calculate stacking inflow, nothing stacked yet",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategy = new Strategy(chain, deployer);

    // Stacking minimum
    let call = await strategy.getStackingMinimum()
    call.result.expectUintWithDecimals(50000);

    // Min stacking not reached
    call = await strategy.calculateInflow(49000);
    call.result.expectList().forEach((value: any, index: any) => {
      value.expectUintWithDecimals(0);
    })

    // Min stacking reached for 3 stackers
    call = await strategy.calculateInflow(50000 * 3);
    call.result.expectList().forEach((value: any, index: any) => {
      if (index >= 7) {
        value.expectUintWithDecimals(50000);
      } else {
        value.expectUintWithDecimals(0);
      }
    })

    // Min stacking reached for 3 stackers + 10k extra
    call = await strategy.calculateInflow(50000 * 3 + 10000);
    call.result.expectList().forEach((value: any, index: any) => {
      if (index >= 7) {
        value.expectUintWithDecimals(50000 + 10000/3);
      } else {
        value.expectUintWithDecimals(0);
      }
    })

    // Min stacking reached for all stackers
    call = await strategy.calculateInflow(50000 * 10);
    call.result.expectList().forEach((value: any, index: any) => {
      value.expectUintWithDecimals(50000);
    })

    // Min stacking reached for all stackers + 20k extra
    call = await strategy.calculateInflow(50000 * 10 + 20000);
    call.result.expectList().forEach((value: any, index: any) => {
      if (index < 5) {
        value.expectUintWithDecimals(50000);
      } else  {
        value.expectUintWithDecimals(50000 + 4000);
      }
    })
  }
});

Clarinet.test({
  name: "strategy-v1: calculate stacking inflow, already stacking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategy = new Strategy(chain, deployer);
    let core = new Core(chain, deployer);

    let result = core.deposit(deployer, 1000000);
    result.expectOk().expectUintWithDecimals(1000000);

    // Perform inflow
    result = strategy.performInflow(deployer, [0, 0, 0, 0, 0, 0, 60000, 60000, 85000, 95000]);
    result.expectOk().expectBool(true);

    // Extra 10k inflow, divided over last 5 active stackers
    // Only 4 stackers active, so adding 10k/4 per stacker
    let call = await strategy.calculateInflow(10000);
    call.result.expectList().forEach((value: any, index: any) => {
      if (index >= 6) {
        value.expectUintWithDecimals(2500);
      } else {
        value.expectUintWithDecimals(0);
      }
    })

    // Extra 80k inflow, which can be used to start 1 additional stacker
    // 30k inflow left after using 50k min stacking amount
    // 30k divided over 5 stackers, 6k per stacker extra
    call = await strategy.calculateInflow(80000);
    call.result.expectList().forEach((value: any, index: any) => {
      if (index == 5) {
        value.expectUintWithDecimals(56000);
      } else if (index > 5) {
        value.expectUintWithDecimals(6000);
      } else {
        value.expectUintWithDecimals(0);
      }
    })

    // Extra 180k inflow, which can be used to start 3 additional stackers
    // 30k inflow left after using 50k min stacking amount
    // 30k divided over last 5 stackers, 6k per stacker extra
    call = await strategy.calculateInflow(180000);
    call.result.expectList().forEach((value: any, index: any) => {
      if (index == 3 || index == 4) {
        // Min amount
        value.expectUintWithDecimals(50000);
      } else if (index == 5) {
        // Min amount + additional 6k
        value.expectUintWithDecimals(56000);
      } else if (index > 5) {
        // Additional 6k
        value.expectUintWithDecimals(6000);
      } else {
        value.expectUintWithDecimals(0);
      }
    })

  }
});

//-------------------------------------
// Calculations - Outflow per stacker
//-------------------------------------

Clarinet.test({
  name: "strategy-v1: calculate stacking outflow",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategy = new Strategy(chain, deployer);
    let core = new Core(chain, deployer);
    let poxMock = new Pox3Mock(chain, deployer);

    let result = core.deposit(deployer, 1000000);
    result.expectOk().expectUintWithDecimals(1000000);

    // Perform inflow
    result = strategy.performInflow(deployer, [50000, 50000, 50000, 50000, 50000, 80000, 80000, 80000, 80000, 80000]);
    result.expectOk().expectBool(true);

    // Should stop stacker 1
    let call = await strategy.calculateOutflow(49000);
    call.result.expectList().forEach((value: any, index: any) => {
      if (index < 1) {
        value.expectBool(true);
      } else {
        value.expectBool(false);
      }
    })

    // Should stop stacker 1, 2, 3
    call = await strategy.calculateOutflow(50000 * 3);
    call.result.expectList().forEach((value: any, index: any) => {
      if (index < 3) {
        value.expectBool(true);
      } else {
        value.expectBool(false);
      }
    })

    // Should stop stacker 1, 2, 3
    call = await strategy.calculateOutflow(50000 * 2 + 10000);
    call.result.expectList().forEach((value: any, index: any) => {
      if (index < 3) {
        value.expectBool(true);
      } else {
        value.expectBool(false);
      }
    })

    // Should stop stacker 1, 2, 3
    call = await strategy.calculateOutflow(50000 * 2 + 10000);
    call.result.expectList().forEach((value: any, index: any) => {
      if (index < 3) {
        value.expectBool(true);
      } else {
        value.expectBool(false);
      }
    })


    // Advance 1 cycle
    chain.mineEmptyBlock(REWARD_CYCLE_LENGTH);

    // Perform outflow - stop stacker 1, 2
    result = strategy.performOutflow(deployer, [true, true, false, false, false, false, false, false, false, false]);
    result.expectOk().expectBool(true);

    // Advance 1 cycle
    chain.mineEmptyBlock(REWARD_CYCLE_LENGTH);

    // Need to unlock manually in tests
    result = await poxMock.unlock(deployer, qualifiedName("stacker-1"));
    result.expectOk().expectUintWithDecimals(50000);

    result = await poxMock.unlock(deployer, qualifiedName("stacker-2"));
    result.expectOk().expectUintWithDecimals(50000);

    // Stacker 1, 2 already stopped
    // Should stop stacker 3, 4, 5
    call = await strategy.calculateOutflow(50000 * 2 + 10000);
    call.result.expectList().forEach((value: any, index: any) => {
      if (index < 5) {
        value.expectBool(true);
      } else {
        value.expectBool(false);
      }
    })

    // Stacker 1, 2 already stopped
    // Should stop stacker 3, 4, 5, 6, 7
    call = await strategy.calculateOutflow(50000 * 3 + 80000 + 10000);
    call.result.expectList().forEach((value: any, index: any) => {
      if (index < 7) {
        value.expectBool(true);
      } else {
        value.expectBool(false);
      }
    })
  }
});

//-------------------------------------
// Perform - Inflow
//-------------------------------------

Clarinet.test({
  name: "strategy-v1: perform inflow",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategy = new Strategy(chain, deployer);
    let core = new Core(chain, deployer);
    let stacker = new Stacker(chain, deployer);

    let result = core.deposit(deployer, 50000);
    result.expectOk().expectUintWithDecimals(50000);

    let call = strategy.getLastCyclePerformed();
    call.result.expectUint(0);

    // Advance to end of cycle 0
    chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH - 1);


    //
    // Initiate stacking
    //
    result = strategy.performStacking(deployer);
    result.expectOk().expectBool(true);

    // Last cycle performed increased
    call = strategy.getLastCyclePerformed();
    call.result.expectUint(1);

    // Stacker info
    call = await stacker.getStackerInfo(10);
    call.result.expectSome().expectTuple()["first-reward-cycle"].expectUint(1);
    call.result.expectSome().expectTuple()["lock-period"].expectUint(1);

    // Tokens are now locked
    call = await stacker.getStxAccount(10);
    call.result.expectTuple()["locked"].expectUintWithDecimals(50000);
    call.result.expectTuple()["unlock-height"].expectUint(2 * REWARD_CYCLE_LENGTH);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);

    // Advance to end of cycle 1
    chain.mineEmptyBlockUntil(2 * REWARD_CYCLE_LENGTH - 1);

    call = strategy.getPoxCycle()
    call.result.expectUint(1);


    //
    // Increase stacking
    //
    result = core.deposit(deployer, 10000);
    result.expectOk().expectUintWithDecimals(10000);
    result = strategy.performStacking(deployer);
    result.expectOk().expectBool(true);

    // Last cycle performed increased
    call = strategy.getLastCyclePerformed();
    call.result.expectUint(2);

    // Stacker info
    call = await stacker.getStackerInfo(10);
    call.result.expectSome().expectTuple()["first-reward-cycle"].expectUint(1);
    call.result.expectSome().expectTuple()["lock-period"].expectUint(2);

    // Tokens are now locked
    call = await stacker.getStxAccount(10);
    call.result.expectTuple()["locked"].expectUintWithDecimals(60000);
    call.result.expectTuple()["unlock-height"].expectUint(3 * REWARD_CYCLE_LENGTH);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);

    // Advance to end of cycle 2
    chain.mineEmptyBlockUntil(3 * REWARD_CYCLE_LENGTH - 1);

    call = strategy.getPoxCycle()
    call.result.expectUint(2);
    

    //
    // Extend stacking
    //
    result = strategy.performStacking(deployer);
    result.expectOk().expectBool(true);

    // Last cycle performed increased
    call = strategy.getLastCyclePerformed();
    call.result.expectUint(3);

    // Stacker info
    // When calling `stack-extend` the `first-reward-cycle` is updated to the current cycle
    call = await stacker.getStackerInfo(10);
    call.result.expectSome().expectTuple()["first-reward-cycle"].expectUint(2);
    call.result.expectSome().expectTuple()["lock-period"].expectUint(2);

    // Tokens are now locked
    call = await stacker.getStxAccount(10);
    call.result.expectTuple()["locked"].expectUintWithDecimals(60000);
    call.result.expectTuple()["unlock-height"].expectUint(4 * REWARD_CYCLE_LENGTH);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
  }
});

//-------------------------------------
// Perform - Outflow
//-------------------------------------

Clarinet.test({
  name: "strategy-v1: perform outflow",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategy = new Strategy(chain, deployer);
    let core = new Core(chain, deployer);
    let stacker = new Stacker(chain, deployer);
    let poxMock = new Pox3Mock(chain, deployer);

    let result = core.deposit(deployer, 100000);
    result.expectOk().expectUintWithDecimals(100000);

    let call = strategy.getLastCyclePerformed();
    call.result.expectUint(0);

    // Advance to end of cycle 0
    chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH - 1);


    //
    // Initiate stacking
    //
    result = strategy.performStacking(deployer);
    result.expectOk().expectBool(true);

    // Last cycle performed increased
    call = strategy.getLastCyclePerformed();
    call.result.expectUint(1);

    // Stacker info
    call = await stacker.getStackerInfo(10);
    call.result.expectSome().expectTuple()["first-reward-cycle"].expectUint(1);
    call.result.expectSome().expectTuple()["lock-period"].expectUint(1);

    call = await stacker.getStackerInfo(9);
    call.result.expectSome().expectTuple()["first-reward-cycle"].expectUint(1);
    call.result.expectSome().expectTuple()["lock-period"].expectUint(1);

    // Tokens are now locked
    call = await stacker.getStxAccount(10);
    call.result.expectTuple()["locked"].expectUintWithDecimals(50000);
    call.result.expectTuple()["unlock-height"].expectUint(2 * REWARD_CYCLE_LENGTH);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);

    call = await stacker.getStxAccount(9);
    call.result.expectTuple()["locked"].expectUintWithDecimals(50000);
    call.result.expectTuple()["unlock-height"].expectUint(2 * REWARD_CYCLE_LENGTH);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);

    // Advance to end of cycle 1
    chain.mineEmptyBlockUntil(2 * REWARD_CYCLE_LENGTH - 1);

    call = strategy.getPoxCycle()
    call.result.expectUint(1);
    

    //
    // Perform outflow - will stop stacker 9 but not stacker 10
    //
    result = core.initWithdraw(deployer, 50000);
    result.expectOk().expectUint(0);
    result = strategy.performStacking(deployer);
    result.expectOk().expectBool(true);

    // Last cycle performed increased
    call = strategy.getLastCyclePerformed();
    call.result.expectUint(2);

    // Stacker info - Still locked
    call = await stacker.getStackerInfo(10);
    call.result.expectSome().expectTuple()["first-reward-cycle"].expectUint(1);
    call.result.expectSome().expectTuple()["lock-period"].expectUint(2);

    // Stacker info - Not used anymore
    call = await stacker.getStackerInfo(9);
    call.result.expectNone();

    // Tokens are still locked
    call = await stacker.getStxAccount(10);
    call.result.expectTuple()["locked"].expectUintWithDecimals(50000);
    call.result.expectTuple()["unlock-height"].expectUint(3 * REWARD_CYCLE_LENGTH);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);

    // Advance to cycle 2 so tokens can be unlocked
    chain.mineEmptyBlockUntil(2 * REWARD_CYCLE_LENGTH + 2);

    // Unlock manually
    result = await poxMock.unlock(deployer, qualifiedName("stacker-9"));
    result.expectOk().expectUintWithDecimals(50000);

    // Tokens unlocked
    call = await stacker.getStxAccount(9);
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(50000);

    // Return STX
    result = strategy.stackersReturnStx(deployer);
    result.expectOk().expectBool(true);

    // Tokens unlocked updated
    call = await stacker.getStxAccount(9);
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);

    // Advance to end of cycle 2
    chain.mineEmptyBlockUntil(3 * REWARD_CYCLE_LENGTH - 1);

    call = strategy.getPoxCycle()
    call.result.expectUint(2);
    

    //
    // Perform outflow - stop stacker 10
    //
    result = core.initWithdraw(deployer, 50000);
    result.expectOk().expectUint(1);
    result = strategy.performStacking(deployer);
    result.expectOk().expectBool(true);

    // Last cycle performed increased
    call = strategy.getLastCyclePerformed();
    call.result.expectUint(3);

    // Advance to unlock height
    chain.mineEmptyBlockUntil(3 * REWARD_CYCLE_LENGTH + 2);

    // Need to unlock manually in tests
    // Stacked 50k initally + 50k second time = 100k total
    result = await poxMock.unlock(deployer, qualifiedName("stacker-10"));
    result.expectOk().expectUintWithDecimals(50000);

    // Return STX
    result = strategy.stackersReturnStx(deployer);
    result.expectOk().expectBool(true);

    // Stacker info
    call = await stacker.getStackerInfo(10);
    call.result.expectNone();

    // Tokens are now locked
    call = await stacker.getStxAccount(10);
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
  }
});

//-------------------------------------
// Errors 
//-------------------------------------

Clarinet.test({
  name: "strategy-v1: can not perform stacking if not in custom prepare phase",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategy = new Strategy(chain, deployer);
    let core = new Core(chain, deployer);
    let stacker = new Stacker(chain, deployer);
    let poxMock = new Pox3Mock(chain, deployer);

    let result = core.deposit(deployer, 100000);
    result.expectOk().expectUintWithDecimals(100000);

    let call = strategy.getLastCyclePerformed();
    call.result.expectUint(0);

    call = strategy.getNextCycleStartBurnHeight();
    call.result.expectUint(REWARD_CYCLE_LENGTH);

    // Advance to end of cycle 1, not in prepare phase yet
    chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH - 2);

    // Initiate stacking fails
    result = strategy.performStacking(deployer);
    result.expectErr().expectUint(12002);

    // Advance to end of cycle 1, in prepare phase
    chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH - 1);

    // Initiate stacking works
    result = strategy.performStacking(deployer);
    result.expectOk().expectBool(true);
  }
});

//-------------------------------------
// Access 
//-------------------------------------

Clarinet.test({
  name: "strategy-v1: only protocol can perform inflow/outflow",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let strategy = new Strategy(chain, deployer);

    let result = strategy.performInflow(wallet_1, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    result.expectErr().expectUint(20003);
 
    result = strategy.performOutflow(wallet_1, [true, false, false, false, false, false, false, false, false, false]);
    result.expectErr().expectUint(20003);
  }
});
