import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet/index.ts';
import { qualifiedName } from './tests-utils.ts';

// ---------------------------------------------------------
// Stacking Rewards Job
// ---------------------------------------------------------

class RewardsJob {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  checkJob() {
    return this.chain.callReadOnlyFn("rewards-job-v1", "check-job", [], this.deployer.address);
  }

  runJob(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("rewards-job-v1", "run-job", [
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

  retreiveStxTokens(caller: Account, amount: number, receiver: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("rewards-job-v1", "retreive-stx-tokens", [
        types.uint(amount * 1000000),
        types.principal(receiver)
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }
}
export { RewardsJob };
