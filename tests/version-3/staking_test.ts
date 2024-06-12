import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { PREPARE_PHASE_LENGTH, qualifiedName, REWARD_CYCLE_LENGTH } from "../wrappers/tests-utils.ts";

import { DAO } from '../wrappers/dao-helpers.ts';
import { Staking } from '../wrappers/staking-helpers.ts';
import { CoreV1 as Core } from '../wrappers/stacking-dao-core-helpers.ts';
import { SDAOToken } from '../wrappers/sdao-token-helpers.ts';
import { Commission } from "../wrappers/commission-helpers.ts";

//-------------------------------------
// Core 
//-------------------------------------

Clarinet.test({
  name: "staking: can stake and unstake, variables are updated",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let staking = new Staking(chain, deployer);
    let sDaoToken = new SDAOToken(chain, deployer);

    let result = sDaoToken.mintForProtocol(deployer, 1000, wallet_1.address);
    result.expectOk().expectBool(true);

    result = await staking.stake(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    let call = await staking.getStakeAmountOf(wallet_1.address);
    call.result.expectUintWithDecimals(1000);

    call = await staking.getTotalStaked();
    call.result.expectUintWithDecimals(1000);

    call = await staking.getStakeOf(wallet_1.address)
    call.result.expectTuple()["amount"].expectUintWithDecimals(1000);

    result = await staking.unstake(wallet_1, 800);
    result.expectOk().expectUintWithDecimals(800);

    call = await staking.getStakeAmountOf(wallet_1.address);
    call.result.expectUintWithDecimals(200);

    call = await staking.getTotalStaked();
    call.result.expectUintWithDecimals(200);

    call = await staking.getStakeOf(wallet_1.address)
    call.result.expectTuple()["amount"].expectUintWithDecimals(200);
  }
});

Clarinet.test({
  name: "staking: stake and unstake next block",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let staking = new Staking(chain, deployer);
    let core = new Core(chain, deployer);
    let sDaoToken = new SDAOToken(chain, deployer);
    let commission = new Commission(chain, deployer);

    let result = sDaoToken.mintForProtocol(deployer, 1000, wallet_1.address);
    result.expectOk().expectBool(true);

    result = sDaoToken.mintForProtocol(deployer, 1000, wallet_2.address);
    result.expectOk().expectBool(true);

    let call = await commission.getCycleRewardsEndBlock();
    call.result.expectUint(REWARD_CYCLE_LENGTH * 2 + PREPARE_PHASE_LENGTH);

    // Current burn-block-height is 8, rewards end block is 21*2+3
    // (21*2+3)-8 = 37
    // Adding 37 STX as rewards
    result = await staking.addRewards(deployer, 37, REWARD_CYCLE_LENGTH * 2 + PREPARE_PHASE_LENGTH);
    result.expectOk().expectUintWithDecimals(37);

    // Added 40 STX, for 40 blocks = 1 STX per block
    call = await staking.getRewardsPerBlock();
    call.result.expectUintWithDecimals(1);

    result = await staking.stake(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    call = await core.getStxBalance(wallet_2.address);
    call.result.expectUintWithDecimals(100000000);

    result = await staking.stake(wallet_2, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Got half of 1 block rewards
    call = await staking.getPendingRewards(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(0.5);

    result = await staking.unstake(wallet_2, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Got rewards
    call = await core.getStxBalance(wallet_2.address);
    call.result.expectUintWithDecimals(100000000.5);
  }
});

Clarinet.test({
  name: "staking: add and claim rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let staking = new Staking(chain, deployer);
    let core = new Core(chain, deployer);
    let sDaoToken = new SDAOToken(chain, deployer);

    let result = sDaoToken.mintForProtocol(deployer, 1000, wallet_1.address);
    result.expectOk().expectBool(true);

    result = sDaoToken.mintForProtocol(deployer, 2000, wallet_2.address);
    result.expectOk().expectBool(true);

    result = sDaoToken.mintForProtocol(deployer, 3000, wallet_3.address);
    result.expectOk().expectBool(true);

    result = await staking.stake(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    result = await staking.stake(wallet_2, 2000);
    result.expectOk().expectUintWithDecimals(2000);

    result = await staking.stake(wallet_3, 3000);
    result.expectOk().expectUintWithDecimals(3000);

    // Current burn-block-height is 12
    result = await staking.addRewards(deployer, REWARD_CYCLE_LENGTH + PREPARE_PHASE_LENGTH - 12, REWARD_CYCLE_LENGTH + PREPARE_PHASE_LENGTH);
    result.expectOk().expectUintWithDecimals(12);

    // 1 STX per block
    let call = await staking.getRewardsPerBlock();
    call.result.expectUintWithDecimals(1);

    // Advance half cycle
    chain.mineEmptyBlock(9); // 9 blocks

    // 10 STX * 16.66% = 1.666 STX
    call = await staking.getPendingRewards(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1.666666);

    // 10 STX * 33.33% = 3.333 STX
    call = await staking.getPendingRewards(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(3.333333);

    // 10 STX * 50% = 5 STX
    call = await staking.getPendingRewards(wallet_3.address);
    call.result.expectOk().expectUintWithDecimals(4.999999);

    call = await core.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000);

    result = await staking.claimPendingRewards(wallet_1);
    result.expectOk().expectUintWithDecimals(1.666666);

    call = await core.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000 + 1.666666);

    call = await core.getStxBalance(wallet_2.address);
    call.result.expectUintWithDecimals(100000000);

    // 3.333 + 0.333 extra after 1 block
    result = await staking.claimPendingRewards(wallet_2);
    result.expectOk().expectUintWithDecimals(3.666666);

    call = await core.getStxBalance(wallet_2.address);
    call.result.expectUintWithDecimals(100000000 + 3.666666);

    // 5 + 1 extra after 2 blocks
    result = await staking.claimPendingRewards(wallet_3);
    result.expectOk().expectUintWithDecimals(5.999999);
  }
});

Clarinet.test({
  name: "staking: reward tracking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let staking = new Staking(chain, deployer);
    let sDaoToken = new SDAOToken(chain, deployer);

    let result = sDaoToken.mintForProtocol(deployer, 1000, wallet_1.address);
    result.expectOk().expectBool(true);

    result = sDaoToken.mintForProtocol(deployer, 2000, wallet_2.address);
    result.expectOk().expectBool(true);

    // Cumm reward per stake still 0
    let call = await staking.getCummRewardPerStake();
    call.result.expectUintWithDecimals(0);

    result = await staking.calculateCummRewardPerStake(deployer);
    result.expectOk().expectUintWithDecimals(0);

    // Last increase block
    call = staking.getLastRewardIncreaseBlock();
    call.result.expectUint(4);

    // Pending rewards should be 0
    call = await staking.getPendingRewards(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(0);

    // Initial stake should be 0
    call = await staking.getStakeAmountOf(wallet_1.address);
    call.result.expectUintWithDecimals(0);

    call = await staking.getTotalStaked();
    call.result.expectUintWithDecimals(0);

    // Stake 1000 STX
    result = await staking.stake(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Last increase block
    call = staking.getLastRewardIncreaseBlock();
    call.result.expectUint(9);

    // New stake amounts
    call = await staking.getStakeAmountOf(wallet_1.address);
    call.result.expectUintWithDecimals(1000);

    call = await staking.getTotalStaked();
    call.result.expectUintWithDecimals(1000);

    // Not advanced blocks yet.  
    call = await staking.getCummRewardPerStake();
    call.result.expectUintWithDecimals(0);

    // Burn block height is 10
    result = await staking.addRewards(deployer, REWARD_CYCLE_LENGTH + PREPARE_PHASE_LENGTH - 10, REWARD_CYCLE_LENGTH + PREPARE_PHASE_LENGTH);
    result.expectOk().expectUintWithDecimals(14);

    // Add 1 STX per block
    call = await staking.getRewardsPerBlock();
    call.result.expectUintWithDecimals(1);

    // 1 STX reward per block, over 1000 STX staked = 0.001 STX rewards per STX staked
    result = await staking.calculateCummRewardPerStake(deployer);
    result.expectOk().expectUintWithDecimals(100000);

    // Start at 0
    call = staking.getStakeCummRewardPerStakeOf(wallet_1.address);
    call.result.expectUintWithDecimals(0);

    // Advanced 1 block after staking (because of adding rewards)
    // Taking into account the extra block, so 2 STX rewards
    call = staking.getPendingRewards(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(2);

    // Advance 3 blocks
    chain.mineEmptyBlock(3);

    // Total stake did not change, so cumm reward per stake should not change either
    call = staking.getCummRewardPerStake();
    call.result.expectUintWithDecimals(0);

    // Advanced 5 blocks. 
    // 5 blocks / 1000 STX staked = 0.005
    result = await staking.calculateCummRewardPerStake(deployer);
    result.expectOk().expectUintWithDecimals(500000);

    // Advanced 5 blocks, taking into account 1 extra block
    // 6 blocks * 1 STX = 6 STX
    call = staking.getPendingRewards(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(6);

    // Stake with wallet_2
    result = await staking.stake(wallet_2, 2000);
    result.expectOk().expectUintWithDecimals(2000);

    // Total staked
    call = await staking.getTotalStaked();
    call.result.expectUintWithDecimals(3000);

    // Cummulative reward per stake was 0.005
    // One extra block so becomes 0.006 (1 STX / 1000 STX extra)
    call = staking.getStakeCummRewardPerStakeOf(wallet_2.address);
    call.result.expectUintWithDecimals(600000);

    // Should be same as previous check (get-stake-cumm-reward-per-stake-of)
    call = await staking.getCummRewardPerStake();
    call.result.expectUintWithDecimals(600000);

    // Started with 0.006
    // Adding (1 STX per block / 3000 STX staked) = 0.000333
    result = await staking.increaseCummRewardPerStake(deployer);
    result.expectOk().expectUintWithDecimals(633333.333333);

    // Wallet_1 has 33%, so gets 33% of 1 STX
    // For 2 blocks that's 0.666 STX extra
    call = staking.getPendingRewards(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(6.666666);

    // Wallet_2 has 66%, so gets 66% of 1 STX
    // For 2 blocks that's 1.333 STX extra
    call = staking.getPendingRewards(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(1.333333);

    // Unstake 700 STX
    result = staking.unstake(wallet_1, 700);
    result.expectOk().expectUintWithDecimals(700);

    // Last increase block
    call = staking.getLastRewardIncreaseBlock();
    call.result.expectUint(18);

    // New cumm reward per stake
    // Was 0.006333, adding 0.000333 (1 STX per block / 3000 STX staked)
    call = staking.getCummRewardPerStake();
    call.result.expectUintWithDecimals(666666.666666);

    // New cumm reward per stake
    // Was 0.006666, adding 0.000434 (1 STX per block / 2300 STX staked)
    result = await staking.calculateCummRewardPerStake(deployer);
    result.expectOk().expectUintWithDecimals(710144.927535);
  }
});

Clarinet.test({
  name: "staking: rewards distribution - end block reached",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let staking = new Staking(chain, deployer);
    let sDaoToken = new SDAOToken(chain, deployer);

    let result = sDaoToken.mintForProtocol(deployer, 1000, wallet_1.address);
    result.expectOk().expectBool(true);

    result = await staking.stake(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Add rewards
    result = await staking.addRewards(deployer, 100, 50);
    result.expectOk().expectUintWithDecimals(100);

    chain.mineEmptyBlock(50);

    result = await staking.increaseCummRewardPerStake(deployer);
    result.expectOk();

    let call = await staking.getPendingRewards(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(99.999984);
  }
});

Clarinet.test({
  name: "staking: rewards distribution - add rewards multiple times",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let staking = new Staking(chain, deployer);
    let sDaoToken = new SDAOToken(chain, deployer);

    let result = sDaoToken.mintForProtocol(deployer, 1000, wallet_1.address);
    result.expectOk().expectBool(true);

    result = await staking.stake(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Add rewards
    result = await staking.addRewards(deployer, 100, REWARD_CYCLE_LENGTH + PREPARE_PHASE_LENGTH);
    result.expectOk().expectUintWithDecimals(100);

    chain.mineEmptyBlock(2);

    // Add rewards
    result = await staking.addRewards(deployer, 200, REWARD_CYCLE_LENGTH + PREPARE_PHASE_LENGTH);
    result.expectOk().expectUintWithDecimals(200);

    chain.mineEmptyBlock(50);

    let call = await staking.getRewardsEndBlock();
    call.result.expectUint(24);

    // When adding first rewards, burn height was 7, so 100/(24-8) = 6.25 per block
    // When adding rewards again, burn height was 10, so 200/(24-10) = 15.38 per block
    // So total is 17.763 per block
    call = await staking.getRewardsPerBlock();
    call.result.expectUintWithDecimals(21.634615);

    call = await staking.getPendingRewards(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(299.999995);

    chain.mineEmptyBlock(50);

    // All rewards distributed, so no extra pending rewards
    call = await staking.getPendingRewards(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(299.999995);

    result = await staking.claimPendingRewards(wallet_1);
    result.expectOk().expectUintWithDecimals(299.999995);

    call = await staking.getPendingRewards(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(0);
  }
});

//-------------------------------------
// Errors 
//-------------------------------------

Clarinet.test({
  name: "staking: can not stake/unstake with wrong token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall("staking-v1", "stake", [
        types.principal(qualifiedName("ststx-token")),
        types.uint(10 * 1000000),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(12002);

    block = chain.mineBlock([
      Tx.contractCall("staking-v1", "unstake", [
        types.principal(qualifiedName("ststx-token")),
        types.uint(10 * 1000000),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(12002);
  }
});

Clarinet.test({
  name: "staking: can not unstake more than staked",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let staking = new Staking(chain, deployer);
    let sDaoToken = new SDAOToken(chain, deployer);

    let result = sDaoToken.mintForProtocol(deployer, 1000, deployer.address);
    result.expectOk().expectBool(true);

    result = await staking.stake(deployer, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    result = await staking.unstake(deployer, 1001);
    result.expectErr().expectUint(12003);
  }
});

Clarinet.test({
  name: "staking: can not stake, unstake or claim pending rewards when protocol disabled",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let staking = new Staking(chain, deployer);
    let dao = new DAO(chain, deployer);

    let result = await dao.setContractsEnabled(deployer, false);
    result.expectOk().expectBool(true);

    result = await staking.stake(deployer, 1000);
    result.expectErr().expectUint(20002);

    result = await staking.unstake(deployer, 1001);
    result.expectErr().expectUint(20002);

    result = await staking.claimPendingRewards(deployer);
    result.expectErr().expectUint(20002);
  }
});

Clarinet.test({
  name: "staking: only protocol can add rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let staking = new Staking(chain, deployer);

    let result = await staking.addRewards(wallet_1, 40, 200);
    result.expectErr().expectUint(20003);
  }
});

Clarinet.test({
  name: "staking: rounding error",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;
    let wallet_4 = accounts.get("wallet_4")!;
    let wallet_5 = accounts.get("wallet_5")!;

    let staking = new Staking(chain, deployer);
    let core = new Core(chain, deployer);
    let sDaoToken = new SDAOToken(chain, deployer);

    // mint sDaoToken to test wallet address for test
    let result = sDaoToken.mintForProtocol(deployer, 900000, wallet_1.address);
    result = sDaoToken.mintForProtocol(deployer, 900000, wallet_2.address);
    result.expectOk().expectBool(true);
    result = sDaoToken.mintForProtocol(deployer, 900000, wallet_3.address);
    result.expectOk().expectBool(true);
    result = sDaoToken.mintForProtocol(deployer, 900000, wallet_4.address);
    result.expectOk().expectBool(true);
    result = sDaoToken.mintForProtocol(deployer, 900000, wallet_5.address);
    result.expectOk().expectBool(true);

    // stake sDaoToken
    result = await staking.stake(wallet_1, 2000);
    result = await staking.stake(wallet_2, 3000);
    result = await staking.stake(wallet_3, 900000);
    result = await staking.stake(wallet_4, 900000);
    result = await staking.stake(wallet_5, 900000);

    let cycle = 0;

    // Test if after 50 reward cycles, 200 stx rewards are added each time
    for (cycle = 0; cycle <= 50; cycle++) {

        let result = await core.getBurnHeight();
        let current =  parseInt(result.result.substring(1).toString());

        result = await staking.addRewards(deployer, 200, current + 7);

        chain.mineEmptyBlock(7); // 7 blocks

        // all user claim pending rewards
        result = await staking.claimPendingRewards(wallet_1);
        result = await staking.claimPendingRewards(wallet_2);
        result = await staking.claimPendingRewards(wallet_3);
        result = await staking.claimPendingRewards(wallet_4);
        result = await staking.claimPendingRewards(wallet_5);
    }

    // end 50 cycle
    // check staking-v1.clar stx balance
    let call = await core.getStxBalance(qualifiedName("staking-v1"));
    call.result.expectUintWithDecimals(0.000357);
  }
});
