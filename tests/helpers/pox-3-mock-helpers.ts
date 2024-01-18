import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet/index.ts';
import { qualifiedName } from './tests-utils.ts';

// ---------------------------------------------------------
// PoX-3 Mock
// ---------------------------------------------------------

class Pox3Mock {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  unlock(caller: Account, account: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("pox-3-mock", "unlock-mock", [
        types.principal(account),
      ], caller.address)
    ]);
    return block.receipts[0].result;
  }

}
export { Pox3Mock };
