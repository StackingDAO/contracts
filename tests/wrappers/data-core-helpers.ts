import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet/index.ts';
import { qualifiedName } from './tests-utils.ts';

// ---------------------------------------------------------
// Data Core
// ---------------------------------------------------------

class DataCore {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getStxPerStStx(reserveContract: string) {
    return this.chain.callReadOnlyFn("data-core-v1", "get-stx-per-ststx", [
        types.principal(reserveContract)
    ], this.deployer.address);
  }

  getStxPerStStxHelper(amount: number) {
    return this.chain.callReadOnlyFn("data-core-v1", "get-stx-per-ststx-helper", [
        types.uint(amount * 1000000)
    ], this.deployer.address);
  }

  getCycleWithdrawOffset() {
    return this.chain.callReadOnlyFn("data-core-v1", "get-cycle-withdraw-offset", [
    ], this.deployer.address);
  }

  setCycleWithdrawOffset(caller: Account, offset: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("data-core-v1", "set-cycle-withdraw-offset", [
        types.uint(offset)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  getMigratedNft(nftId: number) {
    return this.chain.callReadOnlyFn("data-core-v1", "get-migrated-nft", [
        types.uint(nftId)
    ], this.deployer.address);
  }

  getWithdrawalsByNft(nftId: number) {
    return this.chain.callReadOnlyFn("data-core-v1", "get-withdrawals-by-nft", [
        types.uint(nftId)
    ], this.deployer.address);
  }

  setWithdrawalsByNft(caller: Account, nftId: number, stxAmount: number, stStxAmount: number, unlockBurnHeight: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("data-core-v1", "set-withdrawals-by-nft", [
        types.uint(nftId),
        types.uint(stxAmount * 1000000),
        types.uint(stStxAmount * 1000000),
        types.uint(unlockBurnHeight)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  deleteWithdrawalsByNft(caller: Account, nftId: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("data-core-v1", "delete-withdrawals-by-nft", [
        types.uint(nftId),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

}
export { DataCore };
