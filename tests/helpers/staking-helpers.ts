import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet/index.ts';
import { qualifiedName } from './tests-utils.ts';

// ---------------------------------------------------------
// Staking
// ---------------------------------------------------------

class Staking {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getStakeOf(staker: string) {
    return this.chain.callReadOnlyFn("staking-v1", "get-stake-of", [
      types.principal(staker),
    ], this.deployer.address);
  }

  getStakeAmountOf(staker: string) {
    return this.chain.callReadOnlyFn("staking-v1", "get-stake-amount-of", [
      types.principal(staker),
    ], this.deployer.address);
  }

  getStakeCummRewardPerStakeOf(staker: string) {
    return this.chain.callReadOnlyFn("staking-v1", "get-stake-cumm-reward-per-stake-of", [
      types.principal(staker),
    ], this.deployer.address);
  }

  getTotalStaked() {
    return this.chain.callReadOnlyFn("staking-v1", "get-total-staked", [
    ], this.deployer.address);
  }

  getCummRewardPerStake() {
    return this.chain.callReadOnlyFn("staking-v1", "get-cumm-reward-per-stake", [
    ], this.deployer.address);
  }

  getLastRewardIncreaseBlock() {
    return this.chain.callReadOnlyFn("staking-v1", "get-last-reward-increase-block", [
    ], this.deployer.address);
  }

  getRewardsPerBlock() {
    return this.chain.callReadOnlyFn("staking-v1", "get-rewards-per-block", [
    ], this.deployer.address);
  }

  getRewardsEndBlock() {
    return this.chain.callReadOnlyFn("staking-v1", "get-rewards-end-block", [
    ], this.deployer.address);
  }

  stake(caller: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("staking-v1", "stake", [
        types.principal(qualifiedName("sdao-token")),
        types.uint(amount * 1000000),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  unstake(caller: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("staking-v1", "unstake", [
        types.principal(qualifiedName("sdao-token")),
        types.uint(amount * 1000000),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  getPendingRewards(staker: string) {
    return this.chain.callReadOnlyFn("staking-v1", "get-pending-rewards", [
      types.principal(staker),
    ], this.deployer.address);
  }

  claimPendingRewards(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("staking-v1", "claim-pending-rewards", [
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  increaseCummRewardPerStake(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("staking-v1", "increase-cumm-reward-per-stake", [
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  calculateCummRewardPerStake(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("staking-v1", "calculate-cumm-reward-per-stake", [
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  addRewards(caller: Account, amount: number, endBlock: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("staking-v1", "add-rewards", [
        types.uint(amount * 1000000),
        types.uint(endBlock),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

}
export { Staking };
