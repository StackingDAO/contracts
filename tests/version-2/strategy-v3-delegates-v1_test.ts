import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName, REWARD_CYCLE_LENGTH } from "../wrappers/tests-utils.ts";

import { StrategyV3, StrategyV3DelegatesV1 } from '../wrappers/strategy-helpers.ts';
import { StackingPool } from '../wrappers/stacking-pool-helpers.ts';


//-------------------------------------
// Strategy V3 - Delegates V1 
//-------------------------------------

Clarinet.test({
  name: "strategy-v3-delegates-v1: calculate stacking per delegate",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategyV3DelegatesV1 = new StrategyV3DelegatesV1(chain, deployer)
    let strategyV3 = new StrategyV3(chain, deployer)
    let stackingPool = new StackingPool(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    // 150k STX to reserve
    let block = chain.mineBlock([
      Tx.transferSTX(200000 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    //
    // Calculate stacking per delegate - inflow
    //

    // 50% to first, 30% to second, 20% to third
    let call = await strategyV3DelegatesV1.calculateStackingPerDelegate(qualifiedName("stacking-pool-v1"), 140000);
    call.result.expectList()[0].expectTuple()["delegate"].expectPrincipal(qualifiedName("stacking-delegate-1-1"))
    call.result.expectList()[0].expectTuple()["stacking-amount"].expectUintWithDecimals(70000)
    call.result.expectList()[1].expectTuple()["delegate"].expectPrincipal(qualifiedName("stacking-delegate-1-2"))
    call.result.expectList()[1].expectTuple()["stacking-amount"].expectUintWithDecimals(42000)
    call.result.expectList()[2].expectTuple()["delegate"].expectPrincipal(qualifiedName("stacking-delegate-1-3"))
    call.result.expectList()[2].expectTuple()["stacking-amount"].expectUintWithDecimals(28000)

    // 
    // Stack and lock amount for pool
    //

    // Move to end of cycle 1, where we can prepare
    await chain.mineEmptyBlockUntil(REWARD_CYCLE_LENGTH + 15);

    let result = await strategyV3.preparePools(deployer);
    result.expectOk().expectBool(true);

    result = await strategyV3.prepareDelegates(deployer, qualifiedName("stacking-pool-v1"));
    result.expectOk().expectBool(true);

    result = await strategyV3.execute(
      deployer,
      qualifiedName("stacking-pool-v1"),
      [qualifiedName("stacking-delegate-1-1"), qualifiedName("stacking-delegate-1-2"), qualifiedName("stacking-delegate-1-3")]
    );
    result.expectOk().expectBool(true);

    result = await stackingPool.prepare(deployer);
    result.expectOk().expectBool(true);


    //
    // Calculate stacking per delegate - outflow
    //

    call = await strategyV3DelegatesV1.calculateLockedForPool(qualifiedName("stacking-pool-v1"));
    call.result.expectUintWithDecimals(140000);

    // Outflow of 40k. So best is to stop delegate-1-2.
    call = await strategyV3DelegatesV1.calculateStackingPerDelegate(qualifiedName("stacking-pool-v1"), 100000);
    call.result.expectList()[0].expectTuple()["delegate"].expectPrincipal(qualifiedName("stacking-delegate-1-1"))
    call.result.expectList()[0].expectTuple()["stacking-amount"].expectUintWithDecimals(70000)
    call.result.expectList()[1].expectTuple()["delegate"].expectPrincipal(qualifiedName("stacking-delegate-1-2"))
    call.result.expectList()[1].expectTuple()["stacking-amount"].expectUintWithDecimals(0)
    call.result.expectList()[2].expectTuple()["delegate"].expectPrincipal(qualifiedName("stacking-delegate-1-3"))
    call.result.expectList()[2].expectTuple()["stacking-amount"].expectUintWithDecimals(28000)

  }
});
