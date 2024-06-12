import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "../wrappers/tests-utils.ts";

import { Rewards } from '../wrappers/rewards-helpers.ts';
import { Reserve } from '../wrappers/reserve-helpers.ts';
import { DataPools } from '../wrappers/data-pools-helpers.ts';
import { CoreV1 } from '../wrappers/stacking-dao-core-helpers.ts';

//-------------------------------------
// Core 
//-------------------------------------

Clarinet.test({
  name: "rewards: add rewards and process",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let rewards = new Rewards(chain, deployer);
    let reserve = new Reserve(chain, deployer);

    let call = await rewards.getTotalCommission();
    call.result.expectUintWithDecimals(0);
    call = await rewards.getTotalRewardsLeft();
    call.result.expectUintWithDecimals(0);

    let result = await rewards.addRewards(deployer, qualifiedName("stacking-pool-v1"), 100);
    result.expectOk().expectBool(true);

    call = await rewards.getTotalCommission();
    call.result.expectUintWithDecimals(5);
    call = await rewards.getTotalRewardsLeft();
    call.result.expectUintWithDecimals(95);

    // Go to end of cycle
    await chain.mineEmptyBlockUntil(19);

    result = await rewards.processRewards(deployer);
    result.expectOk().expectBool(true);

    call = await rewards.getTotalCommission();
    call.result.expectUintWithDecimals(0);
    call = await rewards.getTotalRewardsLeft();
    call.result.expectUintWithDecimals(0);

    call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(95);

    result = await rewards.processRewards(deployer);
    result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "rewards: next rewards unlock",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let rewards = new Rewards(chain, deployer);

    let result = await rewards.addRewards(deployer, qualifiedName("stacking-pool-v1"), 100);
    result.expectOk().expectBool(true);

    let call = await rewards.nextRewardsUnlock();
    call.result.expectUint(21 - 10);

    // Go to end of cycle
    await chain.mineEmptyBlockUntil(21 - 10 + 2);

    call = await rewards.nextRewardsUnlock();
    call.result.expectUint(21 - 10);

    // Go to begin of next cycle
    await chain.mineEmptyBlockUntil(21 + 10);

    call = await rewards.nextRewardsUnlock();
    call.result.expectUint(42 - 10);
  }
});

Clarinet.test({
  name: "rewards: pool owner share",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let rewards = new Rewards(chain, deployer);
    let dataPools = new DataPools(chain, deployer);
    let coreV1 = new CoreV1(chain, deployer);

    let call = await rewards.getTotalCommission();
    call.result.expectUintWithDecimals(0);
    call = await rewards.getTotalRewardsLeft();
    call.result.expectUintWithDecimals(0);

    let result = dataPools.setPoolOwnerCommission(deployer, qualifiedName("stacking-pool-v1"), wallet_1.address, 0.1)
    result.expectOk().expectBool(true);

    call = await dataPools.getPoolOwnerCommission(qualifiedName("stacking-pool-v1"))
    call.result.expectTuple()["receiver"].expectPrincipal(wallet_1.address);
    call.result.expectTuple()["share"].expectUint(0.1 * 10000);

    call = await coreV1.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000);

    result = await rewards.addRewards(deployer, qualifiedName("stacking-pool-v1"), 100);
    result.expectOk().expectBool(true);

    // 100 STX rewards, 5% total commission = 5 STX
    // Pool owner gets 10%
    call = await coreV1.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000 + 0.5);

    call = await rewards.getTotalCommission();
    call.result.expectUintWithDecimals(4.5);
    call = await rewards.getTotalRewardsLeft();
    call.result.expectUintWithDecimals(95);
  }
});

Clarinet.test({
  name: "rewards: get stx",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let rewards = new Rewards(chain, deployer);

    let result = await rewards.addRewards(deployer, qualifiedName("stacking-pool-v1"), 100);
    result.expectOk().expectBool(true);

    result = rewards.getStx(deployer, 100, deployer.address);
    result.expectOk().expectUintWithDecimals(100);
  }
});

//-------------------------------------
// Errors 
//-------------------------------------

Clarinet.test({
  name: "rewards: can only process rewards at end of cycle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let rewards = new Rewards(chain, deployer);

    let result = await rewards.addRewards(deployer, qualifiedName("stacking-pool-v1"), 100);
    result.expectOk().expectBool(true);

    let call = await rewards.getRewardsUnlock();
    call.result.expectUint(21 - 10);

    // Can not process rewards
    result = await rewards.processRewards(deployer);
    result.expectErr().expectUint(203001);

    // Go to end of cycle
    await chain.mineEmptyBlockUntil(21 - 10 + 2);

    // Can process rewards
    result = await rewards.processRewards(deployer);
    result.expectOk().expectBool(true);
  }
});

//-------------------------------------
// Access 
//-------------------------------------

Clarinet.test({
  name: "rewards: only protocol can get stx",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let rewards = new Rewards(chain, deployer);

    let result = rewards.getStx(wallet_1, 200, wallet_1.address);
    result.expectErr().expectUint(20003);
  }
});

