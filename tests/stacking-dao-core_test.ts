import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName, REWARD_CYCLE_LENGTH, PREPARE_PHASE_LENGTH } from './helpers/tests-utils.ts';

import { Core } from './helpers/stacking-dao-core-helpers.ts';
import { DAO } from './helpers/dao-helpers.ts';

//-------------------------------------
// Getters 
//-------------------------------------

Clarinet.test({
  name: "core: can get burn height",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let core = new Core(chain, deployer);

    let call = await core.getBurnHeight();
    call.result.expectUint(3);

    chain.mineEmptyBlock(500);

    call = await core.getBurnHeight();
    call.result.expectUint(503);
  },
});

//-------------------------------------
// Core
//-------------------------------------

Clarinet.test({
  name: "core: test STX to stSTX ratio",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let core = new Core(chain, deployer);

    // Set commission to 0 so it does not influence STX per stSTX
    let result = await core.setCommission(deployer, 0);
    result.expectOk().expectBool(true);

    // Deposit 1000 STX
    result = await core.deposit(deployer, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Deposit 2000 STX
    result = await core.deposit(wallet_1, 2000);
    result.expectOk().expectUintWithDecimals(2000);

    // STX to stSTX ratio remains 1
    let call = await core.getStxPerStstx();
    call.result.expectOk().expectUintWithDecimals(1);

    // Add 100 STX as rewards
    result = await core.addRewards(wallet_2, 100, 0);
    result.expectOk().expectUintWithDecimals(100);

    // STX to stSTX ratio increased
    // There are now 3100 STX in pool, for 3000 stSTX in supply
    // 3100/3000=1.0033333
    call = await core.getStxPerStstx();
    call.result.expectOk().expectUintWithDecimals(1.033333);

    // Deposit 1000 STX
    // 1000*1.0033333=967.742247
    result = await core.deposit(wallet_2, 1000);
    result.expectOk().expectUintWithDecimals(967.742247);

    // Deposit 2000 STX
    result = await core.deposit(wallet_3, 2000);
    result.expectOk().expectUintWithDecimals(1935.484495);

    // After deposits, STX to stSTX did not change
    call = await core.getStxPerStstx();
    call.result.expectOk().expectUintWithDecimals(1.033333);

    // Add 200 STX as rewards
    result = await core.addRewards(wallet_2, 200, 0);
    result.expectOk().expectUintWithDecimals(200);

    // There is now 6300 STX in pool, 5903 stSTX in supply
    // 6300/5903=1.067212
    call = await core.getStxPerStstx();
    call.result.expectOk().expectUintWithDecimals(1.067212);

    // Withdraw 250 stSTX tokens. Got NFT with ID 0.
    result = await core.initWithdraw(deployer, 250);
    result.expectOk().expectUint(0);

    // Advance to next cycle
    chain.mineEmptyBlock(500 + 2001);

    // 250 stSTX * 1.067212 = 266.803 STX
    result = core.withdraw(deployer, 0);
    result.expectOk().expectUintWithDecimals(266.803);
  },
});

Clarinet.test({
  name: "core: test deposit, STX to stSTX ratio and withdrawals",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let core = new Core(chain, deployer);

    // Set commission to 0 so it does not influence STX per stSTX
    let result = await core.setCommission(deployer, 0);
    result.expectOk().expectBool(true);

    // Deposit 1,000,000 STX
    result = await core.deposit(deployer, 1000000);
    result.expectOk().expectUintWithDecimals(1000000);

    // Got 1,000,000 stSTX
    let call = await chain.callReadOnlyFn("ststx-token", "get-balance", [
      types.principal(deployer.address),
    ], wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000000);

    // Advance to next cycle
    chain.mineEmptyBlock(REWARD_CYCLE_LENGTH + 1);

    // Add rewards
    result = await core.addRewards(wallet_2, 10000, 0);
    result.expectOk().expectUintWithDecimals(10000);

    // STX per stSTX ratio increased
    call = await core.getStxPerStstx();
    call.result.expectOk().expectUintWithDecimals(1.01);

    // Deposit 1M STX
    result = await core.deposit(wallet_1, 1000000);
    result.expectOk().expectUintWithDecimals(990099.0099);

    // Advance to next cycle
    chain.mineEmptyBlock(REWARD_CYCLE_LENGTH + 1);

    // Add rewards
    result = await core.addRewards(wallet_2, 18000, 1);
    result.expectOk().expectUintWithDecimals(18000);

    // Now let's see what the stSTX to STX ratio is
    call = await core.getStxPerStstx();
    call.result.expectOk().expectUintWithDecimals(1.019044); 

    // Current PoX cycle
    call = await core.getPoxCycle();
    call.result.expectUint(2); 

    // Let's test withdrawals
    // We are in cycle 2, so cycle 3 is the first we can withdraw (hence u5 as second param)
    result = await core.initWithdraw(deployer, 10000);
    result.expectOk().expectUint(0);

    // Deployer should have 10k stSTX less
    call = await chain.callReadOnlyFn("ststx-token", "get-balance", [
      types.principal(deployer.address),
    ], wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(990000);

    // Deployer did not get STX back
    call = await core.getStxBalance(deployer.address);
    call.result.expectUintWithDecimals(99000000); // 99M

    // Let's go 1 cycle further now
    chain.mineEmptyBlock(REWARD_CYCLE_LENGTH + PREPARE_PHASE_LENGTH);

    // Current PoX cycle
    call = await core.getPoxCycle();
    call.result.expectUint(3); 

    // Withdraw
    result = core.withdraw(deployer, 0);
    result.expectOk().expectUintWithDecimals(10190.44);

    // STX balance
    call = core.getStxBalance(deployer.address);
    call.result.expectUintWithDecimals(99010190.44);

    // After deployer pulled all their capital + rewards, the ratio remains the same
    call = await core.getStxPerStstx();
    call.result.expectOk().expectUintWithDecimals(1.019044);
  },
});

//-------------------------------------
// Admin 
//-------------------------------------

Clarinet.test({
  name: "core: protocol can set commission",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let core = new Core(chain, deployer);

    let call = await core.getCommission();
    call.result.expectUint(500);

    let result = await core.setCommission(deployer, 0.2);
    result.expectOk().expectBool(true);

    call = await core.getCommission();
    call.result.expectUint(0.2 * 10000);

    result = await core.addRewards(deployer, 100, 0);
    result.expectOk().expectUintWithDecimals(100);

    // 100 STX added as rewards, 20% taken as commission
    // Commission contract keeps 100%
    // 100 * 0.2 = 20 STX
    call = await core.getStxBalance(qualifiedName("commission-v1"));
    call.result.expectUintWithDecimals(20);
  },
});

Clarinet.test({
  name: "core: protocol can shut down deposits",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let core = new Core(chain, deployer);

    // Deposit 1,000,000 STX
    let result = await core.deposit(deployer, 1000000);
    result.expectOk().expectUintWithDecimals(1000000);

    // Advance to next cycle
    chain.mineEmptyBlock(REWARD_CYCLE_LENGTH + 1);

    // Init withdraw
    result = await core.initWithdraw(deployer, 100);
    result.expectOk().expectUint(0);

    // Check shutdown
    let call = await core.getShutdownDeposits();
    call.result.expectBool(false);

    // Shutdown deposits
    result = await core.setShutdownDeposits(deployer, true);
    result.expectOk().expectBool(true)

    // Can not deposit anymore
    result = await core.deposit(deployer, 1000000);
    result.expectErr().expectUint(19002);

    // Enable deposits
    result = await core.setShutdownDeposits(deployer, false);
    result.expectOk().expectBool(true)

    // Can not deposit again
    result = await core.deposit(deployer, 100);
    result.expectOk().expectUintWithDecimals(100);
  },
});

//-------------------------------------
// Errors 
//-------------------------------------

Clarinet.test({
  name: "core: check if can withdraw",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);

    // PoX cycle 0
    let call = await core.getPoxCycle();
    call.result.expectUint(0); 

    // Advance to next cycle
    chain.mineEmptyBlock(REWARD_CYCLE_LENGTH);

    // PoX cycle 1
    call = await core.getPoxCycle();
    call.result.expectUint(1); 

    // We are in cycle 1, so next cycle to withdraw in is 2
    call = await core.getNextWithdrawCycle();
    call.result.expectUint(2); 

    // Deposit some STX
    let result = await core.deposit(deployer, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Initiate withdraw (for cycle 2)
    result = await core.initWithdraw(deployer, 10);
    result.expectOk().expectUint(0);

    // Can not withdraw as still in cycle 1
    result = await core.withdraw(deployer, 0);
    result.expectErr().expectUint(19001);

    // Advance to next cycle
    chain.mineEmptyBlock(REWARD_CYCLE_LENGTH);

    // PoX cycle 2
    call = await core.getPoxCycle();
    call.result.expectUint(2); 

    // Can not withdraw as not owner of NFT
    result = await core.withdraw(wallet_1, 0);
    result.expectErr().expectUint(19004);

    // Can withdraw
    result = await core.withdraw(deployer, 0);
    result.expectOk().expectUintWithDecimals(10);

    // Can not withdraw again
    result = await core.withdraw(deployer, 0);
    result.expectErr().expectUint(19005);
  },
});

Clarinet.test({
  name: "core: check init withdraw, taking into account prepare phase",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let core = new Core(chain, deployer);

    // PoX cycle 0
    let call = await core.getPoxCycle();
    call.result.expectUint(0); 

    // Advance to next cycle
    chain.mineEmptyBlock(REWARD_CYCLE_LENGTH);

    // PoX cycle 1
    call = await core.getPoxCycle();
    call.result.expectUint(1); 

    // Advance to prepare phase
    chain.mineEmptyBlock(REWARD_CYCLE_LENGTH - PREPARE_PHASE_LENGTH - 1);

    // Still in cycle 1
    call = await core.getPoxCycle();
    call.result.expectUint(1);

    // In prepare phase, so can not withdraw in next cycle (2)
    // Need to withdraw in cycle after (3)
    call = await core.getNextWithdrawCycle();
    call.result.expectUint(3); 

    // Deposit some STX
    let result = await core.deposit(deployer, 10000);
    result.expectOk().expectUintWithDecimals(10000);

    // Init withdraw for cycle 3
    result = await core.initWithdraw(deployer, 10);
    result.expectOk().expectUint(0);

    // Can not withdraw as still in cycle 1
    result = await core.withdraw(deployer, 0);
    result.expectErr().expectUint(19001);

    // Advance to next cycle
    // chain.mineEmptyBlock(REWARD_CYCLE_LENGTH);

    // PoX cycle 2
    call = await core.getPoxCycle();
    call.result.expectUint(2);

    // Can not withdraw as cycle 3 not started
    result = await core.withdraw(deployer, 0);
    result.expectErr().expectUint(19001);

    // Advance to next cycle
    chain.mineEmptyBlock(REWARD_CYCLE_LENGTH + PREPARE_PHASE_LENGTH);

    // PoX cycle 3
    call = await core.getPoxCycle();
    call.result.expectUint(3); 

    // Can withdraw
    result = await core.withdraw(deployer, 0);
    result.expectOk().expectUintWithDecimals(10);
  },
});

Clarinet.test({
  name: "core: can not deposit, withdraw or add rewards if protocol not enabled",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let core = new Core(chain, deployer);
    let dao = new DAO(chain, deployer);

    let result = await dao.setContractsEnabled(deployer, false);
    result.expectOk().expectBool(true);

    result = await core.deposit(deployer, 1000);
    result.expectErr().expectUint(20002);

    result = await core.addRewards(deployer, 100, 0);
    result.expectErr().expectUint(20002);

    result = await core.initWithdraw(deployer, 10);
    result.expectErr().expectUint(20002);

    result = await core.withdraw(deployer, 0);
    result.expectErr().expectUint(20002);
  },
});

Clarinet.test({
  name: "core: can not set commission higher than max",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let core = new Core(chain, deployer);

    let call = await core.getCommission();
    call.result.expectUint(500);

    let result = await core.setCommission(deployer, 0.21);
    result.expectErr().expectUint(19006);
  },
});

Clarinet.test({ 
  name: "core: can not deposit with wrong reserve",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall("stacking-dao-core-v1", "deposit", [
        types.principal(qualifiedName("fake-reserve")),
        types.uint(10 * 1000000),
        types.none()
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);
  },
});

Clarinet.test({
  name: "core: prints event on deposit with referrer",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall("stacking-dao-core-v1", "deposit", [
        types.principal(qualifiedName("reserve-v1")),
        types.uint(10 * 1000000),
        types.some(types.principal('ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'))
      ], deployer.address)
    ]);
    block.receipts[0].events.expectPrintEvent(
      qualifiedName('stacking-dao-core-v1'),
      '{action: "deposit", data: {amount: u10000000, block-height: u4, referrer: (some ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC), stacker: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM}}'
    )
  },
});

Clarinet.test({
  name: "core: prints event on deposit without referrer",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall("stacking-dao-core-v1", "deposit", [
        types.principal(qualifiedName("reserve-v1")),
        types.uint(10 * 1000000),
        types.none()
      ], deployer.address)
    ]);
    block.receipts[0].events.expectPrintEvent(
      qualifiedName('stacking-dao-core-v1'),
      '{action: "deposit", data: {amount: u10000000, block-height: u4, referrer: none, stacker: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM}}'
    )
  },
});

//-------------------------------------
// Access 
//-------------------------------------

Clarinet.test({
  name: "core: only protocol can use admin functions",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);

    let result = await core.setCommission(wallet_1, 0.1);
    result.expectErr().expectUint(20003);

    result = await core.setShutdownDeposits(wallet_1, true);
    result.expectErr().expectUint(20003);
  },
});
