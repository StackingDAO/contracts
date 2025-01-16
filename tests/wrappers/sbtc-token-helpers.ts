import {
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "./tests-utils.ts";

// ---------------------------------------------------------
// sBTC token
// ---------------------------------------------------------

class SBtcToken {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getTotalSupply() {
    return this.chain.callReadOnlyFn(
      "sbtc-token",
      "get-total-supply",
      [],
      this.deployer.address
    );
  }

  getName() {
    return this.chain.callReadOnlyFn(
      "sbtc-token",
      "get-name",
      [],
      this.deployer.address
    );
  }

  getSymbol() {
    return this.chain.callReadOnlyFn(
      "sbtc-token",
      "get-symbol",
      [],
      this.deployer.address
    );
  }

  getDecimals() {
    return this.chain.callReadOnlyFn(
      "sbtc-token",
      "get-decimals",
      [],
      this.deployer.address
    );
  }

  getBalance(account: string) {
    return this.chain.callReadOnlyFn(
      "sbtc-token",
      "get-balance",
      [types.principal(account)],
      this.deployer.address
    );
  }

  getTokenUri() {
    return this.chain.callReadOnlyFn(
      "sbtc-token",
      "get-token-uri",
      [],
      this.deployer.address
    );
  }

  transfer(caller: Account, amount: number, receiver: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "sbtc-token",
        "transfer",
        [
          types.uint(amount * 100000000),
          types.principal(caller.address),
          types.principal(receiver),
          types.none(),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  protocolMint(caller: Account, amount: number, receiver: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "sbtc-token",
        "protocol-mint",
        [types.uint(amount * 100000000), types.principal(receiver)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  protocolBurn(caller: Account, amount: number, receiver: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "sbtc-token",
        "protocol-burn",
        [types.uint(amount * 100000000), types.principal(receiver)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }
}
export { SBtcToken };
