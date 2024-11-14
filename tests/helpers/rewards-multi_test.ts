import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "../wrappers/tests-utils.ts";

import { Rewards } from '../wrappers/rewards-helpers.ts';
import { Reserve } from '../wrappers/reserve-helpers.ts';

//-------------------------------------
// Core 
//-------------------------------------

Clarinet.test({
  name: "rewards-multi: add rewards and process",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let rewards = new Rewards(chain, deployer);
    let reserve = new Reserve(chain, deployer);

    let call = await rewards.getTotalCommission();
    call.result.expectUintWithDecimals(0);
    call = await rewards.getTotalRewardsLeft();
    call.result.expectUintWithDecimals(0);

    let block = chain.mineBlock([
      Tx.contractCall("rewards-multi-v1", "add-rewards", [
        types.principal(qualifiedName("commission-v2")),
        types.principal(qualifiedName("staking-v1")),
        types.principal(qualifiedName("reserve-v1")),
        types.list([
          types.tuple({ pool: types.principal(qualifiedName("pool-1")), amount: types.uint(70 * 1000000) }),
          types.tuple({ pool: types.principal(qualifiedName("pool-2")), amount: types.uint(20 * 1000000) }),
          types.tuple({ pool: types.principal(qualifiedName("pool-3")), amount: types.uint(10 * 1000000) })
        ])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(false);

    call = await rewards.getTotalCommission();
    call.result.expectUintWithDecimals(5);
    call = await rewards.getTotalRewardsLeft();
    call.result.expectUintWithDecimals(95);

    call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(0);

    // Go to end of cycle
    await chain.mineEmptyBlockUntil(19);

    block = chain.mineBlock([
      Tx.contractCall("rewards-multi-v1", "add-rewards", [
        types.principal(qualifiedName("commission-v2")),
        types.principal(qualifiedName("staking-v1")),
        types.principal(qualifiedName("reserve-v1")),
        types.list([
          types.tuple({ pool: types.principal(qualifiedName("pool-1")), amount: types.uint(70 * 1000000) }),
          types.tuple({ pool: types.principal(qualifiedName("pool-2")), amount: types.uint(20 * 1000000) }),
          types.tuple({ pool: types.principal(qualifiedName("pool-3")), amount: types.uint(10 * 1000000) })
        ])
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    call = await rewards.getTotalCommission();
    call.result.expectUintWithDecimals(0);
    call = await rewards.getTotalRewardsLeft();
    call.result.expectUintWithDecimals(0);

    call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(190);
  }
});
