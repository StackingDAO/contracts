import {
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet/index.ts";

// ---------------------------------------------------------
// Position Mock
// ---------------------------------------------------------

class PositionMock {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getBalance(user: string) {
    return this.chain.callReadOnlyFn(
      "position-mock",
      "get-balance",
      [types.principal(user)],
      this.deployer.address
    );
  }

  setBalance(caller: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "position-mock",
        "set-balance",
        [types.uint(amount * 1000000)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }
}
export { PositionMock };
