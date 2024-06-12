import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName, REWARD_CYCLE_LENGTH } from '../wrappers/tests-utils.ts';
qualifiedName("")

import { CoreV1 as Core } from '../wrappers/stacking-dao-core-helpers.ts';
import { RewardsJob } from '../wrappers/rewards-job-helpers.ts';

//-------------------------------------
// Rewards Job 
//-------------------------------------

Clarinet.test({
  name: "rewards-job: run job",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let rewardsJob = new RewardsJob(chain, deployer);
    let core = new Core(chain, deployer);

    let call:any = rewardsJob.checkJob();
    call.result.expectOk().expectBool(false);

    // Transfer 100 STX to contract
    let block = chain.mineBlock([
      Tx.transferSTX(100 * 1000000, qualifiedName("rewards-job-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    //
    // Advance to cycle 1
    //

    chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH+1);

    //
    // At beginning of PoX cycle
    //
    call = core.getPoxCycle();
    call.result.expectUint(1);

    call = core.getNextWithdrawCycle();
    call.result.expectUint(2);

    call = rewardsJob.checkJob();
    call.result.expectOk().expectBool(false);

    //
    // At end of PoX cycle
    //

    chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH + REWARD_CYCLE_LENGTH-1);

    call = core.getPoxCycle();
    call.result.expectUint(1);

    call = core.getNextWithdrawCycle();
    call.result.expectUint(3);

    call = rewardsJob.checkJob();
    call.result.expectOk().expectBool(true);

    //
    // Run job
    //

    call = core.getStxBalance(qualifiedName("rewards-job-v1"));
    call.result.expectUintWithDecimals(100);

    call = core.getStxBalance(qualifiedName("reserve-v1"));
    call.result.expectUintWithDecimals(0);

    call = core.getStxBalance(qualifiedName("commission-v1"));
    call.result.expectUintWithDecimals(0);

    call = core.getCycleInfo(0)
    call.result.expectTuple()["commission"].expectUintWithDecimals(0);
    call.result.expectTuple()["rewards"].expectUintWithDecimals(0);

    let result = await rewardsJob.runJob(deployer);
    result.expectOk().expectBool(true);

    call = core.getStxBalance(qualifiedName("rewards-job-v1"));
    call.result.expectUintWithDecimals(0);

    call = core.getStxBalance(qualifiedName("reserve-v1"));
    call.result.expectUintWithDecimals(95);

    call = core.getStxBalance(qualifiedName("commission-v1"));
    call.result.expectUintWithDecimals(5);

    call = core.getCycleInfo(1)
    call.result.expectTuple()["commission"].expectUintWithDecimals(5);
    call.result.expectTuple()["rewards"].expectUintWithDecimals(95);

  }
});

//-------------------------------------
// Admin 
//-------------------------------------

Clarinet.test({
  name: "rewards-job: protocol can retreive tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let rewardsJob = new RewardsJob(chain, deployer);
    let core = new Core(chain, deployer);

    // Transfer 100 STX to contract
    let block = chain.mineBlock([
      Tx.transferSTX(100 * 1000000, qualifiedName("rewards-job-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Contract balances
    let call = core.getStxBalance(qualifiedName("rewards-job-v1"));
    call.result.expectUintWithDecimals(100);

    // Retreive tokens
    let result = await rewardsJob.retreiveStxTokens(deployer, 10, deployer.address);
    result.expectOk().expectUintWithDecimals(10);

    // Contract balances
    call = core.getStxBalance(qualifiedName("rewards-job-v1"));
    call.result.expectUintWithDecimals(90);

  }
});

//-------------------------------------
// Access 
//-------------------------------------

Clarinet.test({
  name: "rewards-job: only protocol can retreive tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let rewardsJob = new RewardsJob(chain, deployer);

    let result = await rewardsJob.retreiveStxTokens(wallet_1, 10, wallet_1.address);
    result.expectErr().expectUint(20003);
  }
});
