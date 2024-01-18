import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet/index.ts';
import { qualifiedName } from './tests-utils.ts';

// ---------------------------------------------------------
// Return STX Job
// ---------------------------------------------------------

class ReturnStxJob {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  checkJob() {
    return this.chain.callReadOnlyFn("return-stx-job-v1", "check-job", [], this.deployer.address);
  }

  runJob(caller: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("return-stx-job-v1", "run-job", [
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

}
export { ReturnStxJob };
