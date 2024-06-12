import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { hexToBytes, qualifiedName, hexDecode } from "../wrappers/tests-utils.ts";

import { StackingPool } from '../wrappers/stacking-pool-helpers.ts';
import { StackingPoolPayout } from '../wrappers/stacking-pool-payout-helpers.ts';
import { Pox4Mock } from '../wrappers/pox-mock-helpers.ts';
import { CoreV1 } from '../wrappers/stacking-dao-core-helpers.ts';

//-------------------------------------
// Core 
//-------------------------------------

Clarinet.test({
  name: "stacking-pool-payout: add rewards and distribute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let stackingPool = new StackingPool(chain, deployer);
    let stackingPoolPayout = new StackingPoolPayout(chain, deployer);
    let pox = new Pox4Mock(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    //
    // Stack
    //

    let result = pox.allowContractCaller(wallet_1, qualifiedName("stacking-pool-v1"))
    result.expectOk().expectBool(true);
    result = stackingPool.delegateStx(wallet_1, 50000, 99);
    result.expectOk().expectBool(true);

    result = pox.allowContractCaller(wallet_2, qualifiedName("stacking-pool-v1"))
    result.expectOk().expectBool(true);
    result = stackingPool.delegateStx(wallet_2, 100000, 99);
    result.expectOk().expectBool(true);

    result = pox.allowContractCaller(wallet_3, qualifiedName("stacking-pool-v1"))
    result.expectOk().expectBool(true);
    result = stackingPool.delegateStx(wallet_3, 10000, 99);
    result.expectOk().expectBool(true);

    chain.mineEmptyBlockUntil(19);

    result = stackingPool.prepareDelegate(wallet_1, wallet_1.address);
    result.expectOk().expectBool(true);
    result = stackingPool.prepareDelegate(wallet_2, wallet_2.address);
    result.expectOk().expectBool(true);
    result = stackingPool.prepareDelegate(wallet_3, wallet_3.address);
    result.expectOk().expectBool(true);

    chain.mineEmptyBlockUntil(23);

    //
    // Getters
    //

    let call = await stackingPoolPayout.getTotalStacked(1);
    call.result.expectOk().expectUintWithDecimals(50000 + 100000 + 10000);

    call = await stackingPoolPayout.getUserStacked(wallet_1.address, 1)
    call.result.expectOk().expectUintWithDecimals(50000);

    call = await stackingPoolPayout.getUserStacked(wallet_2.address, 1)
    call.result.expectOk().expectUintWithDecimals(100000);

    call = await stackingPoolPayout.getUserStacked(wallet_3.address, 1)
    call.result.expectOk().expectUintWithDecimals(10000);

    //
    // Deposit rewards
    //

    result = stackingPoolPayout.depositRewards(deployer, 200, 1);
    result.expectOk().expectBool(true);

    call = await stackingPoolPayout.getLastRewardId();
    call.result.expectUint(1);

    call = await stackingPoolPayout.getRewardsInfo(0);
    call.result.expectTuple()["amount"].expectUintWithDecimals(200);
    call.result.expectTuple()["amount-distributed"].expectUintWithDecimals(0);
    call.result.expectTuple()["cycle"].expectUint(1);
    call.result.expectTuple()["total-stacked"].expectUintWithDecimals(50000 + 100000 + 10000);

    //
    // Distribute rewards
    //

    // Wallet_1 has 31.25% of total stacked
    // 31.25% of 200 STX rewards = 62.5
    result = stackingPoolPayout.distributeRewards(deployer, [wallet_1.address], 0);
    result.expectOk().expectUintWithDecimals(62.5);

    call = await stackingPoolPayout.getRewardsInfo(0);
    call.result.expectTuple()["amount"].expectUintWithDecimals(200);
    call.result.expectTuple()["amount-distributed"].expectUintWithDecimals(62.5);
    call.result.expectTuple()["cycle"].expectUint(1);
    call.result.expectTuple()["total-stacked"].expectUintWithDecimals(50000 + 100000 + 10000);

    result = stackingPoolPayout.distributeRewards(deployer, [wallet_2.address, wallet_3.address], 0);
    result.expectOk().expectUintWithDecimals(200 - 62.5);

    call = await stackingPoolPayout.getRewardsInfo(0);
    call.result.expectTuple()["amount"].expectUintWithDecimals(200);
    call.result.expectTuple()["amount-distributed"].expectUintWithDecimals(200);
    call.result.expectTuple()["cycle"].expectUint(1);
    call.result.expectTuple()["total-stacked"].expectUintWithDecimals(50000 + 100000 + 10000);
  }
});

Clarinet.test({
  name: "stacking-pool-payout: rewards are only distributed once per user",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let stackingPool = new StackingPool(chain, deployer);
    let stackingPoolPayout = new StackingPoolPayout(chain, deployer);
    let pox = new Pox4Mock(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    //
    // Stack
    //

    let result = pox.allowContractCaller(wallet_1, qualifiedName("stacking-pool-v1"))
    result.expectOk().expectBool(true);
    result = stackingPool.delegateStx(wallet_1, 50000, 99);
    result.expectOk().expectBool(true);

    result = pox.allowContractCaller(wallet_2, qualifiedName("stacking-pool-v1"))
    result.expectOk().expectBool(true);
    result = stackingPool.delegateStx(wallet_2, 100000, 99);
    result.expectOk().expectBool(true);

    result = pox.allowContractCaller(wallet_3, qualifiedName("stacking-pool-v1"))
    result.expectOk().expectBool(true);
    result = stackingPool.delegateStx(wallet_3, 10000, 99);
    result.expectOk().expectBool(true);

    chain.mineEmptyBlockUntil(19);

    result = stackingPool.prepareDelegate(wallet_1, wallet_1.address);
    result.expectOk().expectBool(true);
    result = stackingPool.prepareDelegate(wallet_2, wallet_2.address);
    result.expectOk().expectBool(true);
    result = stackingPool.prepareDelegate(wallet_3, wallet_3.address);
    result.expectOk().expectBool(true);

    chain.mineEmptyBlockUntil(23);

    //
    // Deposit rewards
    //

    result = stackingPoolPayout.depositRewards(deployer, 200, 1);
    result.expectOk().expectBool(true);

    //
    // Distribute rewards
    //

    // Wallet_1 has 31.25% of total stacked
    // 31.25% of 200 STX rewards = 62.5
    result = stackingPoolPayout.distributeRewards(deployer, [wallet_1.address], 0);
    result.expectOk().expectUintWithDecimals(62.5);

    let call = await stackingPoolPayout.getRewardsInfo(0);
    call.result.expectTuple()["amount"].expectUintWithDecimals(200);
    call.result.expectTuple()["amount-distributed"].expectUintWithDecimals(62.5);
    call.result.expectTuple()["cycle"].expectUint(1);
    call.result.expectTuple()["total-stacked"].expectUintWithDecimals(50000 + 100000 + 10000);

    result = stackingPoolPayout.distributeRewards(deployer, [wallet_1.address], 0);
    result.expectOk().expectUintWithDecimals(0);

    call = await stackingPoolPayout.getRewardsInfo(0);
    call.result.expectTuple()["amount"].expectUintWithDecimals(200);
    call.result.expectTuple()["amount-distributed"].expectUintWithDecimals(62.5);
    call.result.expectTuple()["cycle"].expectUint(1);
    call.result.expectTuple()["total-stacked"].expectUintWithDecimals(50000 + 100000 + 10000);
  }
});

//-------------------------------------
// Admin 
//-------------------------------------

Clarinet.test({
  name: "stacking-pool-payout: get stx",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stackingPool = new StackingPool(chain, deployer);
    let stackingPoolPayout = new StackingPoolPayout(chain, deployer);
    let pox = new Pox4Mock(chain, deployer);
    let coreV1 = new CoreV1(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    //
    // Stack
    //

    let result = pox.allowContractCaller(wallet_1, qualifiedName("stacking-pool-v1"))
    result.expectOk().expectBool(true);
    result = stackingPool.delegateStx(wallet_1, 200000, 99);
    result.expectOk().expectBool(true);

    chain.mineEmptyBlockUntil(19);

    result = stackingPool.prepareDelegate(wallet_1, wallet_1.address);
    result.expectOk().expectBool(true);

    chain.mineEmptyBlockUntil(23);

    //
    // Deposit rewards
    //

    result = stackingPoolPayout.depositRewards(deployer, 200, 1);
    result.expectOk().expectBool(true);

    //
    // Get STX
    //

    let call = await coreV1.getStxBalance(deployer.address);
    call.result.expectUintWithDecimals(99999800);

    call = await coreV1.getStxBalance(qualifiedName("stacking-pool-payout-v1"));
    call.result.expectUintWithDecimals(200);

    result = stackingPoolPayout.getStx(deployer, 200, deployer.address);
    result.expectOk().expectUintWithDecimals(200);

    call = await coreV1.getStxBalance(deployer.address);
    call.result.expectUintWithDecimals(99999800 + 200);

    call = await coreV1.getStxBalance(qualifiedName("stacking-pool-payout-v1"));
    call.result.expectUintWithDecimals(0);
  }
});

//-------------------------------------
// Errors 
//-------------------------------------

Clarinet.test({
  name: "stacking-pool-payout: can not get user stacked for future cycle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stackingPoolPayout = new StackingPoolPayout(chain, deployer);

    let call = await stackingPoolPayout.getUserStacked(wallet_1.address, 1)
    call.result.expectErr().expectUint(2015001);
  }
});

Clarinet.test({
  name: "stacking-pool-payout: can not get total stacked for future cycle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stackingPoolPayout = new StackingPoolPayout(chain, deployer);

    let call = await stackingPoolPayout.getTotalStacked(1)
    call.result.expectErr().expectUint(2015002);
  }
});

Clarinet.test({
  name: "stacking-pool-payout: can not add rewards for future cycle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stackingPoolPayout = new StackingPoolPayout(chain, deployer);

    let result = stackingPoolPayout.depositRewards(deployer, 200, 1);
    result.expectErr().expectUint(2015004);
  }
});


//-------------------------------------
// Access 
//-------------------------------------

Clarinet.test({
  name: "stacking-pool-payout: only protocol can get stx",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stackingPoolPayout = new StackingPoolPayout(chain, deployer);

    let result = stackingPoolPayout.getStx(wallet_1, 200, wallet_1.address);
    result.expectErr().expectUint(20003);
  }
});
