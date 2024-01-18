import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName, REWARD_CYCLE_LENGTH } from "./helpers/tests-utils.ts";

import { DAO } from './helpers/dao-helpers.ts';
import { Reserve } from './helpers/reserve-helpers.ts';
import { Core } from './helpers/stacking-dao-core-helpers.ts';
import { Stacker } from './helpers/stacker-helpers.ts';
import { Pox3Mock } from './helpers/pox-3-mock-helpers.ts';

//-------------------------------------
// Core 
//-------------------------------------

Clarinet.test({
  name: "stacker: can initiate stacking, increase and extend",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let core = new Core(chain, deployer);
    let stacker = new Stacker(chain, deployer);

    // Check PoX info
    let call = await stacker.getPoxInfo(1);
    call.result.expectTuple()["reward-cycle-id"].expectUint(0);
    call.result.expectTuple()["reward-cycle-length"].expectUint(REWARD_CYCLE_LENGTH);
    call.result.expectTuple()["min-amount-ustx"].expectUintWithDecimals(50000);

    // Deposit 150k STX to reserve
    let result = await core.deposit(deployer, 150000);
    result.expectOk().expectUintWithDecimals(150000);

    call = stacker.getStxBalance(1);
    call.result.expectUintWithDecimals(0);

    // No stacker info yet
    call = await stacker.getStackerInfo(1);
    call.result.expectNone();

    // Nothing locked yet. Unlocked 0 as stacker does not have any tokens.
    call = await stacker.getStxAccount(1);
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);

    // In cycle 0
    call = await stacker.getPoxInfo(1);
    call.result.expectTuple()["reward-cycle-id"].expectUintWithDecimals(0);

    //
    // Start stacking
    //
    result = await stacker.initiateStacking(1, deployer, 125000, 0, 1);
    result.expectOk().expectUintWithDecimals(125000);

    // Check if burn height updated
    call = await stacker.getStackingUnlockBurnHeight(1);
    call.result.expectUint(2 * REWARD_CYCLE_LENGTH);

    // Check if STX stacked updated
    call = await stacker.getStxStacked(1);
    call.result.expectUintWithDecimals(125000);

    call = await stacker.getStackingStxStacked(1);
    call.result.expectUintWithDecimals(125000);

    // Stacker info
    call = await stacker.getStackerInfo(1);
    call.result.expectSome().expectTuple()["first-reward-cycle"].expectUint(1);
    call.result.expectSome().expectTuple()["lock-period"].expectUint(1);

    // Tokens are now locked
    call = await stacker.getStxAccount(1);
    call.result.expectTuple()["locked"].expectUintWithDecimals(125000);
    call.result.expectTuple()["unlock-height"].expectUint(2 * REWARD_CYCLE_LENGTH);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);

    //
    // Extend with 1 cycle
    //
    result = await stacker.stackExtend(1, deployer, 1);
    result.expectOk().expectUint(1);

    // Check if burn height updated
    call = await stacker.getStackingUnlockBurnHeight(1);
    call.result.expectUint(3 * REWARD_CYCLE_LENGTH);

    // Check if STX stacked updated
    call = await stacker.getStxStacked(1);
    call.result.expectUintWithDecimals(125000);

    // Stacker info
    call = await stacker.getStackerInfo(1);
    call.result.expectSome().expectTuple()["first-reward-cycle"].expectUint(1);
    call.result.expectSome().expectTuple()["lock-period"].expectUint(2);

    // Tokens are now locked for extra <REWARD_CYCLE_LENGTH> blocks
    call = await stacker.getStxAccount(1);
    call.result.expectTuple()["locked"].expectUintWithDecimals(125000);
    call.result.expectTuple()["unlock-height"].expectUint(3 * REWARD_CYCLE_LENGTH);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);

    //
    // Increase with 5k STX
    //
    result = await stacker.stackIncrease(1, deployer, 5000);
    result.expectOk().expectUintWithDecimals(5000);

    // Check if burn height updated
    call = await stacker.getStackingUnlockBurnHeight(1);
    call.result.expectUint(3 * REWARD_CYCLE_LENGTH);

    // Check if STX stacked updated
    call = await stacker.getStxStacked(1);
    call.result.expectUintWithDecimals(130000);

    // Stacker info
    call = await stacker.getStackerInfo(1);
    call.result.expectSome().expectTuple()["first-reward-cycle"].expectUint(1);
    call.result.expectSome().expectTuple()["lock-period"].expectUint(2);

    // Locked increased
    call = await stacker.getStxAccount(1);
    call.result.expectTuple()["locked"].expectUintWithDecimals(130000);
    call.result.expectTuple()["unlock-height"].expectUint(3 * REWARD_CYCLE_LENGTH);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
  }
});

Clarinet.test({
  name: "stacker: when stacking stopped, STX can be returned to reserve",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let reserve = new Reserve(chain, deployer);
    let core = new Core(chain, deployer);
    let stacker = new Stacker(chain, deployer);
    let poxMock = new Pox3Mock(chain, deployer);

    // Deposit 150k STX to reserve
    let result = await core.deposit(deployer, 150000);
    result.expectOk().expectUintWithDecimals(150000);

    //
    // Start stacking
    //
    result = await stacker.initiateStacking(1, deployer, 125000, 0, 1);
    result.expectOk().expectUintWithDecimals(125000);

    // Tokens are now locked
    let call = await stacker.getStxAccount(1);
    call.result.expectTuple()["locked"].expectUintWithDecimals(125000);
    call.result.expectTuple()["unlock-height"].expectUint(2 * REWARD_CYCLE_LENGTH);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);

    //
    // Stop stacking
    //

    // Advance to unlock height
    chain.mineEmptyBlock(2 * REWARD_CYCLE_LENGTH);

    // Unlock (125k STX will be unlocked)
    result = await poxMock.unlock(deployer, qualifiedName("stacker-1"));
    result.expectOk().expectUintWithDecimals(125000);

    // Check if burn height updated
    call = await stacker.getStackingUnlockBurnHeight(1);
    call.result.expectUint(2 * REWARD_CYCLE_LENGTH);

    // Check if STX stacked updated
    call = await stacker.getStxStacked(1);
    call.result.expectUintWithDecimals(0);

    // This var is not reset, which is intended
    call = await stacker.getStackingStxStacked(1);
    call.result.expectUintWithDecimals(125000);

    // Stacker info
    call = await stacker.getStackerInfo(1);
    call.result.expectNone()

    // Account updated
    call = await stacker.getStxAccount(1);
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(125000);

    //
    // STX tokens to reserve
    //

    call = await stacker.getStxBalance(1);
    call.result.expectUintWithDecimals(125000);

    call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(150000);

    call = await reserve.getStxBalance();
    call.result.expectOk().expectUintWithDecimals(25000);

    call = await reserve.getStxStacking();
    call.result.expectOk().expectUintWithDecimals(125000);

    result = await stacker.returnStx(1, deployer);
    result.expectOk().expectUintWithDecimals(125000);

    call = await stacker.getStxBalance(1);
    call.result.expectUintWithDecimals(0);

    call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(150000);

    call = await reserve.getStxBalance();
    call.result.expectOk().expectUintWithDecimals(150000);

    call = await reserve.getStxStacking();
    call.result.expectOk().expectUintWithDecimals(0);

    // Account updated
    call = await stacker.getStxAccount(1);
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
  }
});

Clarinet.test({
  name: "stacker: can call return STX even when no balance",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stacker = new Stacker(chain, deployer);

    let result = await stacker.returnStx(1, deployer);
    result.expectOk().expectUintWithDecimals(0)
  }
});

//-------------------------------------
// Errors 
//-------------------------------------

Clarinet.test({
  name: "stacker: stacker can stack errors",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let core = new Core(chain, deployer);

    let stacker = new Stacker(chain, deployer);

    // Deposit 150k STX to reserve
    let result = await core.deposit(deployer, 150000);
    result.expectOk().expectUintWithDecimals(150000);

    // ERR_INVALID_START_BURN_HEIGHT = 24
    result = await stacker.initiateStacking(1, deployer, 125000, 100000, 1);
    result.expectErr().expectUint(24);
  }
});

Clarinet.test({
  name: "stacker: initiate stacking errors",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let core = new Core(chain, deployer);

    let stacker = new Stacker(chain, deployer);

    // Not enough balance
    let result = await stacker.initiateStacking(1, deployer, 125000, 0, 1);
    result.expectErr().expectUint(1);

    result = await core.deposit(deployer, 150000);
    result.expectOk().expectUintWithDecimals(150000);

    // Invalid start burn height
    result = await stacker.initiateStacking(1, deployer, 125000, 100000, 1);
    result.expectErr().expectUint(24);
  }
});

Clarinet.test({
  name: "stacker: stacking extend errors",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stacker = new Stacker(chain, deployer);

    // Noting locked
    let result = await stacker.stackExtend(1, deployer, 1);
    result.expectErr().expectUint(26);
  }
});

Clarinet.test({
  name: "stacker: stacking increase errors",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let core = new Core(chain, deployer);

    let stacker = new Stacker(chain, deployer);

    // Insufficient funds
    let result = await stacker.stackIncrease(1, deployer, 100);
    result.expectErr().expectUint(1);

    result = await core.deposit(deployer, 150000);
    result.expectOk().expectUintWithDecimals(150000);

    // Nothing locked
    result = await stacker.stackIncrease(1, deployer, 100);
    result.expectErr().expectUint(27);
  }
});

//-------------------------------------
// Access 
//-------------------------------------

Clarinet.test({
  name: "stacker: only protocol can initiate stacking, only if protocol enabled, with correct reserve",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dao = new DAO(chain, deployer);
    let stacker = new Stacker(chain, deployer);

    let result = await stacker.initiateStacking(1, wallet_1, 125000, 0, 1);
    result.expectErr().expectUint(20003);

    let block = chain.mineBlock([
      Tx.contractCall("stacker-1", "initiate-stacking", [
        types.principal(qualifiedName("fake-reserve")),
        types.tuple({ 'version': '0x00', 'hashbytes': '0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ac'}),
        types.uint(100 * 1000000),
        types.uint(0), 
        types.uint(1) 
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);

    // Set protocol is inactive
    result = await dao.setContractsEnabled(deployer, false);
    result.expectOk().expectBool(true);

    result = await stacker.initiateStacking(1, deployer, 125000, 0, 1);
    result.expectErr().expectUint(20002);
  }
});

Clarinet.test({
  name: "stacker: only protocol can increase stacking, only if protocol enabled, with correct reserve",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dao = new DAO(chain, deployer);
    let stacker = new Stacker(chain, deployer);

    let result = await stacker.stackIncrease(1, wallet_1, 125000);
    result.expectErr().expectUint(20003);

    let block = chain.mineBlock([
      Tx.contractCall("stacker-1", "stack-increase", [
        types.principal(qualifiedName("fake-reserve")),
        types.uint(100 * 1000000)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);

    // Set protocol is inactive
    result = await dao.setContractsEnabled(deployer, false);
    result.expectOk().expectBool(true);

    result = await stacker.stackIncrease(1, deployer, 125000);
    result.expectErr().expectUint(20002);
  }
});

Clarinet.test({
  name: "stacker: only protocol can extend stacking, only if protocol enabled",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dao = new DAO(chain, deployer);
    let stacker = new Stacker(chain, deployer);

    let result = await stacker.stackExtend(1, wallet_1, 1);
    result.expectErr().expectUint(20003);

    // Set protocol is inactive
    result = await dao.setContractsEnabled(deployer, false);
    result.expectOk().expectBool(true);

    result = await stacker.stackExtend(1, deployer, 1);
    result.expectErr().expectUint(20002);
  }
});

Clarinet.test({
  name: "stacker: can only return STX if protocol enabled, with correct reserve",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dao = new DAO(chain, deployer);
    let stacker = new Stacker(chain, deployer);

    let block = chain.mineBlock([
      Tx.contractCall("stacker-1", "return-stx", [
        types.principal(qualifiedName("fake-reserve")),
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);

    // Set protocol is inactive
    let result = await dao.setContractsEnabled(deployer, false);
    result.expectOk().expectBool(true);

    result = await stacker.returnStx(1, deployer);
    result.expectErr().expectUint(20002);
  }
});
