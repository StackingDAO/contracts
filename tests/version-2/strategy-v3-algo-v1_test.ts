import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";

import { StrategyV3AlgoV1 } from '../wrappers/strategy-helpers.ts';

//-------------------------------------
// Strategy V3 - Algo V1 
//-------------------------------------

Clarinet.test({
  name: "strategy-v3-algo-v1: calculate reach target",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategyV3AlgoV1 = new StrategyV3AlgoV1(chain, deployer)

    // Overall outflow
    let call = await strategyV3AlgoV1.calculateReachTarget(
      [147000, 63000],
      [175000, 75000]
    );
    call.result.expectList()[0].expectUintWithDecimals(147000);
    call.result.expectList()[1].expectUintWithDecimals(63000);

    // Overall inflow
    call = await strategyV3AlgoV1.calculateReachTarget(
      [120000, 210000, 230000, 130000, 90000],
      [210000, 110000, 180000, 130000, 120000]
    );
    call.result.expectList()[0].expectUintWithDecimals(210000);
    call.result.expectList()[1].expectUintWithDecimals(130000);
    call.result.expectList()[2].expectUintWithDecimals(190000);
    call.result.expectList()[3].expectUintWithDecimals(130000);
    call.result.expectList()[4].expectUintWithDecimals(120000);  // Outflow so stay at locked

    // Overall inflow
    call = await strategyV3AlgoV1.calculateReachTarget(
      [110000, 80000, 120000, 110000, 90000],
      [100000, 100000, 100000, 100000, 100000]
    );
    call.result.expectList()[0].expectUintWithDecimals(102500);
    call.result.expectList()[1].expectUintWithDecimals(100000); // Outflow so stay at locked
    call.result.expectList()[2].expectUintWithDecimals(105000);
    call.result.expectList()[3].expectUintWithDecimals(102500);
    call.result.expectList()[4].expectUintWithDecimals(100000); // Outflow so stay at locked

    // Overall outflow
    call = await strategyV3AlgoV1.calculateReachTarget(
      [80000, 70000, 130000, 110000, 90000],
      [100000, 100000, 100000, 100000, 100000]
    );
    call.result.expectList()[0].expectUintWithDecimals(93333.333334);
    call.result.expectList()[1].expectUintWithDecimals(90000);
    call.result.expectList()[2].expectUintWithDecimals(100000); // Inflow so stay at locked
    call.result.expectList()[3].expectUintWithDecimals(100000); // Inflow so stay at locked
    call.result.expectList()[4].expectUintWithDecimals(96666.666667);
  }
});

Clarinet.test({
  name: "strategy-v3-algo-v1: calculate lowest combination",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategyV3AlgoV1 = new StrategyV3AlgoV1(chain, deployer)

    // Stop 1
    let call = await strategyV3AlgoV1.calculateLowestCombination(19000, [65000, 26000, 19500, 11000, 6500]);
    call.result.expectList()[0].expectUintWithDecimals(65000);
    call.result.expectList()[1].expectUintWithDecimals(26000);
    call.result.expectList()[2].expectUintWithDecimals(0);
    call.result.expectList()[3].expectUintWithDecimals(11000);
    call.result.expectList()[4].expectUintWithDecimals(6500);

    // Stop at beginning
    call = await strategyV3AlgoV1.calculateLowestCombination(70000, [65000, 26000, 19500, 13000, 6500]);
    call.result.expectList()[0].expectUintWithDecimals(0);
    call.result.expectList()[1].expectUintWithDecimals(0);
    call.result.expectList()[2].expectUintWithDecimals(19500);
    call.result.expectList()[3].expectUintWithDecimals(13000);
    call.result.expectList()[4].expectUintWithDecimals(6500);

    // Stop at end
    call = await strategyV3AlgoV1.calculateLowestCombination(38000, [65000, 26000, 19500, 13000, 6500]);
    call.result.expectList()[0].expectUintWithDecimals(65000);
    call.result.expectList()[1].expectUintWithDecimals(26000);
    call.result.expectList()[2].expectUintWithDecimals(0);
    call.result.expectList()[3].expectUintWithDecimals(0);
    call.result.expectList()[4].expectUintWithDecimals(0);
  }
});

Clarinet.test({
  name: "strategy-v3-algo-v1: calculate if nothing changes",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let strategyV3AlgoV1 = new StrategyV3AlgoV1(chain, deployer)

    // Reach target
    let call = await strategyV3AlgoV1.calculateReachTarget(
      [175000, 75000],
      [175000, 75000]
    );
    call.result.expectList()[0].expectUintWithDecimals(175000);
    call.result.expectList()[1].expectUintWithDecimals(75000);

    // Lowest combination
    call = await strategyV3AlgoV1.calculateLowestCombination(0, [65000, 26000, 19500, 11000, 6500]);
    call.result.expectList()[0].expectUintWithDecimals(65000);
    call.result.expectList()[1].expectUintWithDecimals(26000);
    call.result.expectList()[2].expectUintWithDecimals(19500);
    call.result.expectList()[3].expectUintWithDecimals(11000);
    call.result.expectList()[4].expectUintWithDecimals(6500);

  }
});
