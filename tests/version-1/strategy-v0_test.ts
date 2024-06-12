import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { hexToBytes, qualifiedName, REWARD_CYCLE_LENGTH } from "../wrappers/tests-utils.ts";
qualifiedName('')

import { StrategyV0 as Strategy } from '../wrappers/strategy-helpers.ts';
import { CoreV1 as Core } from '../wrappers/stacking-dao-core-helpers.ts';
import { Reserve } from '../wrappers/reserve-helpers.ts';
import { Stacker } from '../wrappers/stacker-helpers.ts';
import { Pox3Mock } from '../wrappers/pox-mock-helpers.ts';

//-------------------------------------
// Reward address
//-------------------------------------

Clarinet.test({
  name: "strategy-v0: get and set reward address",
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
  name: "strategy-v0: get PoX info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategy = new Strategy(chain, deployer);

    let call = await strategy.getPoxCycle();
    call.result.expectUint(0);

    call = await strategy.getNextCycleStartBurnHeight();
    call.result.expectUint(REWARD_CYCLE_LENGTH);
  }
});

//-------------------------------------
// Calculations - Get inflow/outflow
//-------------------------------------

Clarinet.test({
  name: "strategy-v0: calculate inflow/outflow",
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
// Perform - Inflow
//-------------------------------------

Clarinet.test({
  name: "strategy-v0: perform inflow",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategy = new Strategy(chain, deployer);
    let core = new Core(chain, deployer);
    let stacker = new Stacker(chain, deployer);

    let result = core.deposit(deployer, 300000);
    result.expectOk().expectUintWithDecimals(300000);

    let call = strategy.getLastCyclePerformed();
    call.result.expectUint(0);

    // Initiate stacking
    result = strategy.performInflow(deployer, [50000, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    result.expectOk().expectBool(true);

    // Last cycle performed increased
    call = strategy.getLastCyclePerformed();
    call.result.expectUint(1);

    // Stacker info
    call = await stacker.getStackerInfo(1);
    call.result.expectSome().expectTuple()["first-reward-cycle"].expectUint(1);
    call.result.expectSome().expectTuple()["lock-period"].expectUint(1);

    // Tokens are now locked
    call = await stacker.getStxAccount(1);
    call.result.expectTuple()["locked"].expectUintWithDecimals(50000);
    call.result.expectTuple()["unlock-height"].expectUint(2 * REWARD_CYCLE_LENGTH);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);

    // Advance 1 cycle
    chain.mineEmptyBlock(REWARD_CYCLE_LENGTH);

    call = strategy.getPoxCycle()
    call.result.expectUint(1);

    // Increase stacking
    result = strategy.performInflow(deployer, [10000, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    result.expectOk().expectBool(true);

    // Last cycle performed increased
    call = strategy.getLastCyclePerformed();
    call.result.expectUint(2);

    // Stacker info
    call = await stacker.getStackerInfo(1);
    call.result.expectSome().expectTuple()["first-reward-cycle"].expectUint(1);
    call.result.expectSome().expectTuple()["lock-period"].expectUint(2);

    // Tokens are now locked
    call = await stacker.getStxAccount(1);
    call.result.expectTuple()["locked"].expectUintWithDecimals(60000);
    call.result.expectTuple()["unlock-height"].expectUint(3 * REWARD_CYCLE_LENGTH);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);

    // Advance 1 cycle
    chain.mineEmptyBlock(REWARD_CYCLE_LENGTH);

    call = strategy.getPoxCycle()
    call.result.expectUint(2);
    
    // Extend stacking
    result = strategy.performInflow(deployer, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    result.expectOk().expectBool(true);

    // Last cycle performed increased
    call = strategy.getLastCyclePerformed();
    call.result.expectUint(3);

    // Stacker info
    // When calling `stack-extend` the `first-reward-cycle` is updated to the current cycle
    call = await stacker.getStackerInfo(1);
    call.result.expectSome().expectTuple()["first-reward-cycle"].expectUint(2);
    call.result.expectSome().expectTuple()["lock-period"].expectUint(2);

    // Tokens are now locked
    call = await stacker.getStxAccount(1);
    call.result.expectTuple()["locked"].expectUintWithDecimals(60000);
    call.result.expectTuple()["unlock-height"].expectUint(4 * REWARD_CYCLE_LENGTH);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
  }
});

//-------------------------------------
// Perform - Outflow
//-------------------------------------

Clarinet.test({
  name: "strategy-v0: perform outflow",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategy = new Strategy(chain, deployer);
    let core = new Core(chain, deployer);
    let stacker = new Stacker(chain, deployer);
    let poxMock = new Pox3Mock(chain, deployer);

    let result = core.deposit(deployer, 300000);
    result.expectOk().expectUintWithDecimals(300000);

    let call = strategy.getLastCyclePerformed();
    call.result.expectUint(0);

    // Initiate stacking
    result = strategy.performInflow(deployer, [50000, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    result.expectOk().expectBool(true);

    // Last cycle performed increased
    call = strategy.getLastCyclePerformed();
    call.result.expectUint(1);

    // Stacker info
    call = await stacker.getStackerInfo(1);
    call.result.expectSome().expectTuple()["first-reward-cycle"].expectUint(1);
    call.result.expectSome().expectTuple()["lock-period"].expectUint(1);

    // Tokens are now locked
    call = await stacker.getStxAccount(1);
    call.result.expectTuple()["locked"].expectUintWithDecimals(50000);
    call.result.expectTuple()["unlock-height"].expectUint(2 * REWARD_CYCLE_LENGTH);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);

    // Advance 1 cycle
    chain.mineEmptyBlock(REWARD_CYCLE_LENGTH);

    call = strategy.getPoxCycle()
    call.result.expectUint(1);
    
    // Perform outflow - do not stop stacker 1
    result = strategy.performOutflow(deployer, [false, false, false, false, false, false, false, false, false, false]);
    result.expectOk().expectBool(true);

    // Last cycle performed increased
    call = strategy.getLastCyclePerformed();
    call.result.expectUint(2);

    // Stacker info
    call = await stacker.getStackerInfo(1);
    call.result.expectSome().expectTuple()["first-reward-cycle"].expectUint(1);
    call.result.expectSome().expectTuple()["lock-period"].expectUint(2);

    // Tokens are now locked
    call = await stacker.getStxAccount(1);
    call.result.expectTuple()["locked"].expectUintWithDecimals(50000);
    call.result.expectTuple()["unlock-height"].expectUint(3 * REWARD_CYCLE_LENGTH);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);

    // Advance 1 cycle
    chain.mineEmptyBlock(REWARD_CYCLE_LENGTH);

    call = strategy.getPoxCycle()
    call.result.expectUint(2);
    
    // Perform outflow - stop stacker 1
    result = strategy.performOutflow(deployer, [true, false, false, false, false, false, false, false, false, false]);
    result.expectOk().expectBool(true);

    // Last cycle performed increased
    call = strategy.getLastCyclePerformed();
    call.result.expectUint(3);

    // Advance to unlock height
    chain.mineEmptyBlock(3 * REWARD_CYCLE_LENGTH);

    // Need to unlock manually in tests
    // Stacked 50k initally + 50k second time = 100k total
    result = await poxMock.unlock(deployer, qualifiedName("stacker-1"));
    result.expectOk().expectUintWithDecimals(50000);

    // Return STX
    result = strategy.stackersReturnStx(deployer);
    result.expectOk().expectBool(true);

    // Stacker info
    call = await stacker.getStackerInfo(1);
    call.result.expectNone();

    // Tokens are now locked
    call = await stacker.getStxAccount(1);
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
  }
});

//-------------------------------------
// Access 
//-------------------------------------

Clarinet.test({
  name: "strategy-v0: only protocol can perform inflow/outflow",
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
