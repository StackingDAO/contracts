import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet/index.ts';

// ---------------------------------------------------------
// Stacking Pool Payout Helpers
// ---------------------------------------------------------

class StackingPoolPayout {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getLastRewardId() {
    return this.chain.callReadOnlyFn("stacking-pool-payout-v1", "get-last-reward-id", [], this.deployer.address);
  }

  getRewardsInfo(rewardsId: number) {
    return this.chain.callReadOnlyFn("stacking-pool-payout-v1", "get-rewards-info", [
      types.uint(rewardsId),
    ], this.deployer.address);
  }

  getTotalStacked(cycle: number) {
    return this.chain.callReadOnlyFn("stacking-pool-payout-v1", "get-total-stacked", [
      types.uint(cycle),
    ], this.deployer.address);
  }

  getUserStacked(user: string, cycle: number) {
    return this.chain.callReadOnlyFn("stacking-pool-payout-v1", "get-user-stacked", [
      types.principal(user),
      types.uint(cycle),
    ], this.deployer.address);
  }

  depositRewards(caller: Account, amount: number, cycle: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-pool-payout-v1", "deposit-rewards", [
        types.uint(amount * 1000000),
        types.uint(cycle)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  distributeRewards(caller: Account, users: string[], rewardId: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-pool-payout-v1", "distribute-rewards", [
        types.list(users.map(user => types.principal(user))),
        types.uint(rewardId)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  getStx(caller: Account, amount: number, receiver: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-pool-payout-v1", "get-stx", [
        types.uint(amount * 1000000),
        types.principal(receiver),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }
  
}
export { StackingPoolPayout };
