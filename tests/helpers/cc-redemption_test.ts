import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "../wrappers/tests-utils.ts";

import { Reserve } from "../wrappers/reserve-helpers.ts";

//-------------------------------------
// Core
//-------------------------------------

Clarinet.test({
  name: "cc-redemption: deposit and withdraw for normal stacking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let reserve = new Reserve(chain, deployer);

    let call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(0);

    let block = chain.mineBlock([
      Tx.contractCall(
        "stacking-dao-core-v2",
        "deposit",
        [
          types.principal(qualifiedName("reserve-v1")),
          types.principal(qualifiedName("commission-v2")),
          types.principal(qualifiedName("staking-v1")),
          types.principal(qualifiedName("direct-helpers-v2")),
          types.uint(100 * 1000000),
          types.none(),
          types.none(),
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectUintWithDecimals(100);

    call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(100);
  },
});
