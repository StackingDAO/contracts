import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "../wrappers/tests-utils.ts";

import { Rewards } from "../wrappers/rewards-helpers.ts";
import { Reserve } from "../wrappers/reserve-helpers.ts";
import { DataPools } from "../wrappers/data-pools-helpers.ts";
import { CoreV1 } from "../wrappers/stacking-dao-core-helpers.ts";
import { SBtcToken } from "../wrappers/sbtc-token-helpers.ts";
import { StStxBtcToken } from "../wrappers/ststxbtc-token-helpers.ts";

//-------------------------------------
// Core
//-------------------------------------

Clarinet.test({
  name: "rewards: add rewards and process",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let rewards = new Rewards(chain, deployer);
    let reserve = new Reserve(chain, deployer);
    let sBtcToken = new SBtcToken(chain, deployer);
    let stStxBtcToken = new StStxBtcToken(chain, deployer);

    let result = await sBtcToken.protocolMint(
      deployer,
      100000,
      deployer.address
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcToken.mintForProtocol(
      deployer,
      1000,
      deployer.address
    );
    result.expectOk().expectBool(true);

    let call = await rewards.getCycleRewardsStStx(0);
    call.result.expectTuple()["processed"].expectBool(false);
    call.result.expectTuple()["total-stx"].expectUintWithDecimals(0);
    call.result.expectTuple()["commission-stx"].expectUintWithDecimals(0);
    call.result.expectTuple()["protocol-stx"].expectUintWithDecimals(0);

    call = await rewards.getCycleRewardsStStxBtc(0);
    call.result.expectTuple()["processed"].expectBool(false);
    call.result.expectTuple()["total-sbtc"].expectUintWithDecimals(0);
    call.result.expectTuple()["commission-sbtc"].expectUintWithDecimals(0);
    call.result.expectTuple()["protocol-sbtc"].expectUintWithDecimals(0);

    result = await rewards.addRewards(
      deployer,
      qualifiedName("stacking-pool-v1"),
      100
    );
    result.expectOk().expectBool(true);
    result = await rewards.addRewardsSBtc(
      deployer,
      qualifiedName("stacking-pool-v1"),
      10
    );
    result.expectOk().expectBool(true);

    call = await rewards.getCycleRewardsStStx(0);
    call.result.expectTuple()["processed"].expectBool(false);
    call.result.expectTuple()["total-stx"].expectUintWithDecimals(100);
    call.result.expectTuple()["commission-stx"].expectUintWithDecimals(5);
    call.result.expectTuple()["protocol-stx"].expectUintWithDecimals(95);

    call = await rewards.getCycleRewardsStStxBtc(0);
    call.result.expectTuple()["processed"].expectBool(false);
    call.result.expectTuple()["total-sbtc"].expectUintWithDecimals(10);
    call.result.expectTuple()["commission-sbtc"].expectUintWithDecimals(0.5);
    call.result.expectTuple()["protocol-sbtc"].expectUintWithDecimals(9.5);

    // Go to end of cycle
    await chain.mineEmptyBlockUntil(19);

    result = await rewards.processRewards(deployer, 0);
    result.expectOk().expectBool(true);

    call = await rewards.getCycleRewardsStStx(0);
    call.result.expectTuple()["processed"].expectBool(true);
    call.result.expectTuple()["total-stx"].expectUintWithDecimals(100);
    call.result.expectTuple()["commission-stx"].expectUintWithDecimals(5);
    call.result.expectTuple()["protocol-stx"].expectUintWithDecimals(95);

    call = await rewards.getCycleRewardsStStxBtc(0);
    call.result.expectTuple()["processed"].expectBool(true);
    call.result.expectTuple()["total-sbtc"].expectUintWithDecimals(10);
    call.result.expectTuple()["commission-sbtc"].expectUintWithDecimals(0.5);
    call.result.expectTuple()["protocol-sbtc"].expectUintWithDecimals(9.5);

    call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(95);
  },
});

Clarinet.test({
  name: "rewards: rewards cycle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let rewards = new Rewards(chain, deployer);

    let call = await rewards.getRewardsCycle();
    call.result.expectUint(0);

    // Go to end of cycle
    await chain.mineEmptyBlockUntil(21 - 10 + 1);

    call = await rewards.getRewardsCycle();
    call.result.expectUint(1);

    // Go to begin of next cycle
    await chain.mineEmptyBlockUntil(21 + 10);

    call = await rewards.getRewardsCycle();
    call.result.expectUint(1);

    // Go to begin of next cycle
    await chain.mineEmptyBlockUntil(21 + 13);

    call = await rewards.getRewardsCycle();
    call.result.expectUint(2);
  },
});

Clarinet.test({
  name: "rewards: pool owner share",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let rewards = new Rewards(chain, deployer);
    let dataPools = new DataPools(chain, deployer);
    let coreV1 = new CoreV1(chain, deployer);
    let sBtcToken = new SBtcToken(chain, deployer);
    let stStxBtcToken = new StStxBtcToken(chain, deployer);

    let result = await sBtcToken.protocolMint(
      deployer,
      100000,
      deployer.address
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcToken.mintForProtocol(
      deployer,
      1000,
      deployer.address
    );
    result.expectOk().expectBool(true);

    let call = await rewards.getCycleRewardsStStx(0);
    call.result.expectTuple()["processed"].expectBool(false);
    call.result.expectTuple()["total-stx"].expectUintWithDecimals(0);
    call.result.expectTuple()["commission-stx"].expectUintWithDecimals(0);
    call.result.expectTuple()["protocol-stx"].expectUintWithDecimals(0);

    call = await rewards.getCycleRewardsStStxBtc(0);
    call.result.expectTuple()["processed"].expectBool(false);
    call.result.expectTuple()["total-sbtc"].expectUintWithDecimals(0);
    call.result.expectTuple()["commission-sbtc"].expectUintWithDecimals(0);
    call.result.expectTuple()["protocol-sbtc"].expectUintWithDecimals(0);

    result = dataPools.setPoolOwnerCommission(
      deployer,
      qualifiedName("stacking-pool-v1"),
      wallet_1.address,
      0.1
    );
    result.expectOk().expectBool(true);

    call = await dataPools.getPoolOwnerCommission(
      qualifiedName("stacking-pool-v1")
    );
    call.result.expectTuple()["receiver"].expectPrincipal(wallet_1.address);
    call.result.expectTuple()["share"].expectUint(0.1 * 10000);

    call = await coreV1.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000);

    result = await rewards.addRewards(
      deployer,
      qualifiedName("stacking-pool-v1"),
      100
    );
    result.expectOk().expectBool(true);
    result = await rewards.addRewardsSBtc(
      deployer,
      qualifiedName("stacking-pool-v1"),
      10
    );
    result.expectOk().expectBool(true);

    // 100 STX rewards, 5% total commission = 5 STX
    // Pool owner gets 10%
    call = await coreV1.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000 + 0.5);

    // 10 sBTC rewards, 5% total commission = 0.5 sBTC
    // Pool owner gets 10%
    call = await sBtcToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(0.05);

    call = await rewards.getCycleRewardsStStx(0);
    call.result.expectTuple()["processed"].expectBool(false);
    call.result.expectTuple()["total-stx"].expectUintWithDecimals(100);
    call.result.expectTuple()["commission-stx"].expectUintWithDecimals(4.5);
    call.result.expectTuple()["protocol-stx"].expectUintWithDecimals(95);

    call = await rewards.getCycleRewardsStStxBtc(0);
    call.result.expectTuple()["processed"].expectBool(false);
    call.result.expectTuple()["total-sbtc"].expectUintWithDecimals(10);
    call.result.expectTuple()["commission-sbtc"].expectUintWithDecimals(0.45);
    call.result.expectTuple()["protocol-sbtc"].expectUintWithDecimals(9.5);
  },
});

Clarinet.test({
  name: "rewards: get stx and sbtc",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let rewards = new Rewards(chain, deployer);
    let sBtcToken = new SBtcToken(chain, deployer);

    let result = await sBtcToken.protocolMint(
      deployer,
      100000,
      deployer.address
    );
    result.expectOk().expectBool(true);

    result = await rewards.addRewards(
      deployer,
      qualifiedName("stacking-pool-v1"),
      100
    );
    result.expectOk().expectBool(true);

    result = await rewards.addRewardsSBtc(
      deployer,
      qualifiedName("stacking-pool-v1"),
      10
    );
    result.expectOk().expectBool(true);

    result = rewards.getStx(deployer, 100, deployer.address);
    result.expectOk().expectUintWithDecimals(100);

    result = rewards.getSBtc(deployer, 10, deployer.address);
    result.expectOk().expectUintWithDecimals(10);
  },
});

//-------------------------------------
// Errors
//-------------------------------------

Clarinet.test({
  name: "rewards: can only process rewards once, at end of cycle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let rewards = new Rewards(chain, deployer);

    let result = await rewards.addRewards(
      deployer,
      qualifiedName("stacking-pool-v1"),
      100
    );
    result.expectOk().expectBool(true);

    // Can not process rewards
    result = await rewards.processRewards(deployer, 0);
    result.expectErr().expectUint(203001);

    // Go to end of cycle
    await chain.mineEmptyBlockUntil(21 - 10 + 2);

    // Can process rewards
    result = await rewards.processRewards(deployer, 0);
    result.expectOk().expectBool(true);

    // Already processed
    result = await rewards.processRewards(deployer, 0);
    result.expectErr().expectUint(203002);
  },
});

Clarinet.test({
  name: "rewards: can not add rewards with wrong commission contracts",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let rewards = new Rewards(chain, deployer);
    let sBtcToken = new SBtcToken(chain, deployer);
    let stStxBtcToken = new StStxBtcToken(chain, deployer);

    let result = await sBtcToken.protocolMint(
      deployer,
      100000,
      deployer.address
    );
    result.expectOk().expectBool(true);
    result = await stStxBtcToken.mintForProtocol(
      deployer,
      1000,
      deployer.address
    );
    result.expectOk().expectBool(true);

    // Add rewards
    result = await rewards.addRewards(
      deployer,
      qualifiedName("stacking-pool-v1"),
      100
    );
    result.expectOk().expectBool(true);
    result = await rewards.addRewardsSBtc(
      deployer,
      qualifiedName("stacking-pool-v1"),
      100
    );
    result.expectOk().expectBool(true);

    // Go to end of cycle
    await chain.mineEmptyBlockUntil(19);

    // Check commission contracts
    let call = await rewards.getStStxCommissionContract();
    call.result.expectPrincipal(qualifiedName("commission-v2"));
    call = await rewards.getStStxBtcCommissionContract();
    call.result.expectPrincipal(qualifiedName("commission-btc-v1"));

    // Can not add rewards if contracts are wrong
    let block = chain.mineBlock([
      Tx.contractCall(
        "rewards-v3",
        "process-rewards",
        [
          types.uint(0),
          types.principal(qualifiedName("commission-btc-v1")),
          types.principal(qualifiedName("commission-v2")),
          types.principal(qualifiedName("staking-v1")),
          types.principal(qualifiedName("reserve-v1")),
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(203003);

    // Switch commission contracts
    result = await rewards.setStStxCommissionContract(
      deployer,
      qualifiedName("commission-btc-v1")
    );
    result.expectOk().expectBool(true);
    result = await rewards.setStStxBtcCommissionContract(
      deployer,
      qualifiedName("commission-v2")
    );
    result.expectOk().expectBool(true);

    call = await rewards.getStStxCommissionContract();
    call.result.expectPrincipal(qualifiedName("commission-btc-v1"));
    call = await rewards.getStStxBtcCommissionContract();
    call.result.expectPrincipal(qualifiedName("commission-v2"));

    // Can get rewards
    block = chain.mineBlock([
      Tx.contractCall(
        "rewards-v3",
        "process-rewards",
        [
          types.uint(0),
          types.principal(qualifiedName("commission-btc-v1")),
          types.principal(qualifiedName("commission-v2")),
          types.principal(qualifiedName("staking-v1")),
          types.principal(qualifiedName("reserve-v1")),
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  },
});

//-------------------------------------
// Access
//-------------------------------------

Clarinet.test({
  name: "rewards: only protocol can get stx and sbtc",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let rewards = new Rewards(chain, deployer);

    let result = rewards.getStx(wallet_1, 200, wallet_1.address);
    result.expectErr().expectUint(20003);

    result = rewards.getSBtc(wallet_1, 200, wallet_1.address);
    result.expectErr().expectUint(20003);
  },
});

Clarinet.test({
  name: "rewards: only protocol can set commission contracts",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let rewards = new Rewards(chain, deployer);

    let result = rewards.setStStxCommissionContract(wallet_1, wallet_1.address);
    result.expectErr().expectUint(20003);

    result = rewards.setStStxBtcCommissionContract(wallet_1, wallet_1.address);
    result.expectErr().expectUint(20003);
  },
});
