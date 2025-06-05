import {
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "./tests-utils.ts";

// ---------------------------------------------------------
// Swap stSTX / stSTXbtc
// ---------------------------------------------------------

class SwapStStxBtc {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  swapStStxForStStxBtc(caller: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "swap-ststx-ststxbtc-v2",
        "swap-ststx-for-ststxbtc",
        [
          types.uint(amount * 1000000),
          types.principal(qualifiedName("reserve-v1")),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  swapStStxBtcForStStx(caller: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "swap-ststx-ststxbtc-v2",
        "swap-ststxbtc-for-ststx",
        [
          types.uint(amount * 1000000),
          types.principal(qualifiedName("reserve-v1")),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }
}
export { SwapStStxBtc };
