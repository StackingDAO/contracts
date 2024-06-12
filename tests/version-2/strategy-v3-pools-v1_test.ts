import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "../wrappers/tests-utils.ts";

import { StrategyV3PoolsV1 } from '../wrappers/strategy-helpers.ts';
import { Reserve } from '../wrappers/reserve-helpers.ts';
import { DataDirectStacking } from '../wrappers/data-direct-stacking-helpers.ts';

//-------------------------------------
// Strategy V3 - Pools V1 
//-------------------------------------

Clarinet.test({
  name: "strategy-v3-pools-v1: calculate stacking per pool",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategyV3PoolsV1 = new StrategyV3PoolsV1(chain, deployer)
    let reserve = new Reserve(chain, deployer);

    // 150k STX to reserve
    let block = chain.mineBlock([
      Tx.transferSTX(150000 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // 70% to stacking pool, 20% to fast pool
    let call = await strategyV3PoolsV1.calculateStackingPerPool()
    call.result.expectList()[0].expectTuple()["pool"].expectPrincipal(qualifiedName("stacking-pool-v1"))
    call.result.expectList()[0].expectTuple()["stacking-amount"].expectUintWithDecimals(105000)
    call.result.expectList()[1].expectTuple()["pool"].expectPrincipal(qualifiedName("pox-fast-pool-v2-mock"))
    call.result.expectList()[1].expectTuple()["stacking-amount"].expectUintWithDecimals(45000)

    // Lock for withdrawal to create outflow
    let result = await reserve.lockStxForWithdrawal(deployer, 40000);
    result.expectOk().expectUintWithDecimals(40000);

    // Reduced both pools
    call = await strategyV3PoolsV1.calculateStackingPerPool()
    call.result.expectList()[0].expectTuple()["pool"].expectPrincipal(qualifiedName("stacking-pool-v1"))
    call.result.expectList()[0].expectTuple()["stacking-amount"].expectUintWithDecimals(77000)
    call.result.expectList()[1].expectTuple()["pool"].expectPrincipal(qualifiedName("pox-fast-pool-v2-mock"))
    call.result.expectList()[1].expectTuple()["stacking-amount"].expectUintWithDecimals(33000)
  }
});

Clarinet.test({
  name: "strategy-v3-pools-v1: calculate stacking per pool with direct stacking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategyV3PoolsV1 = new StrategyV3PoolsV1(chain, deployer)
    let reserve = new Reserve(chain, deployer);
    let dataDirectStacking = new DataDirectStacking(chain, deployer);

    // 150k STX to reserve
    let block = chain.mineBlock([
      Tx.transferSTX(150000 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);


    // Set direct stacking
    let result = dataDirectStacking.setTotalDirectStacking(deployer, 20000 + 5000);
    result.expectOk().expectBool(true);
    result = dataDirectStacking.setDirectStackingPoolAmount(deployer, qualifiedName("stacking-pool-v1"), 20000);
    result.expectOk().expectBool(true);
    result = dataDirectStacking.setDirectStackingPoolAmount(deployer, qualifiedName("pox-fast-pool-v2-mock"), 5000);
    result.expectOk().expectBool(true);

    // Check amounts
    let call = await strategyV3PoolsV1.calculateNewAmounts();
    call.result.expectTuple()["new-total-direct-stacking"].expectUintWithDecimals(20000 + 5000)
    call.result.expectTuple()["new-total-normal-stacking"].expectUintWithDecimals(150000 - (20000 + 5000))
    call.result.expectTuple()["inflow"].expectUintWithDecimals(150000)
    call.result.expectTuple()["outflow"].expectUintWithDecimals(0)

    // 25k direct stacking, 125k normal stacking
    // For direct stacking:
    // - 20k to pool
    // For normal stacking:
    // - 80% as normal = 100k - pool has 70%, so gets 70k
    // - 20% as direct = 25k - pool has 80% of direct stacking, so gets 20k
    call = await strategyV3PoolsV1.calculateStackingTargetForPool(qualifiedName("stacking-pool-v1"), 150000 - (20000 + 5000), 20000 + 5000)
    call.result.expectUintWithDecimals(20000 + 70000 + 20000);

    // 25k direct stacking, 125k normal stacking
    // For direct stacking:
    // - 20k to pool
    // For normal stacking:
    // - 80% as normal = 100k - pool has 30%, so gets 30k
    // - 20% as direct = 25k - pool has 20% of direct stacking, so gets 5k
    call = await strategyV3PoolsV1.calculateStackingTargetForPool(qualifiedName("pox-fast-pool-v2-mock"), 150000 - (20000 + 5000), 20000 + 5000)
    call.result.expectUintWithDecimals(5000 + 30000 + 5000);

    // Calculate
    call = await strategyV3PoolsV1.calculateStackingPerPool()
    call.result.expectList()[0].expectTuple()["pool"].expectPrincipal(qualifiedName("stacking-pool-v1"))
    call.result.expectList()[0].expectTuple()["stacking-amount"].expectUintWithDecimals(20000 + 70000 + 20000)
    call.result.expectList()[1].expectTuple()["pool"].expectPrincipal(qualifiedName("pox-fast-pool-v2-mock"))
    call.result.expectList()[1].expectTuple()["stacking-amount"].expectUintWithDecimals(5000 + 30000 + 5000)
  }
});
