import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet/index.ts';
import { qualifiedName } from './tests-utils.ts';

// ---------------------------------------------------------
// Fomo
// ---------------------------------------------------------

class Fomo {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getCurrentWinner() {
    return this.chain.callReadOnlyFn("fomo", "get-current-winner", [], this.deployer.address);
  }

  getClaimCost() {
    return this.chain.callReadOnlyFn("fomo", "get-claim-cost", [], this.deployer.address);
  }

  getIncrement() {
    return this.chain.callReadOnlyFn("fomo", "get-increment", [], this.deployer.address);
  }

  hasGameEnded() {
    return this.chain.callReadOnlyFn("fomo", "has-game-ended", [], this.deployer.address);
  }

  setClaimCost(caller: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("fomo", "set-claim-cost", [
        types.uint(amount * 1000000)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  setIncrement(caller: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("fomo", "set-increment", [
        types.uint(amount * 1000000)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  buyClaim(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("fomo", "buy-claim", [], caller.address)
    ]);
    return block.receipts[0].result;
  }

  retrieveWinner(caller: Account, nftId: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("fomo", "retrieve-winner", [
        types.uint(nftId)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  retrieveLoser(caller: Account, nftId: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("fomo", "retrieve-loser", [
        types.uint(nftId)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  retrieveFees(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("fomo", "retrieve-fees", [], caller.address)
    ]);
    return block.receipts[0].result;
  }

  rescueFunds(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("fomo", "rescue-funds", [], caller.address)
    ]);
    return block.receipts[0].result;
  }

  startGame(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("fomo", "start-game", [], caller.address)
    ]);
    return block.receipts[0].result;
  }
}

export { Fomo };
