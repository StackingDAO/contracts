import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from './helpers/tests-utils.ts';
qualifiedName("")

import { Core } from './helpers/stacking-dao-core-helpers.ts';
import { ReturnStxJob } from './helpers/return-stx-job-helpers.ts';
import { Reserve } from './helpers/reserve-helpers.ts';

//-------------------------------------
// Return STX Job 
//-------------------------------------

Clarinet.test({
  name: "return-stx-job: run job",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let returnStxJob = new ReturnStxJob(chain, deployer);
    let core = new Core(chain, deployer);
    let reserve = new Reserve(chain, deployer);

    // Transfer 200 STX to reserve
    let block = chain.mineBlock([
      Tx.transferSTX(200 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Request 200 STX to stack
    // Needed so we can actually return in later in the test
    let result = await reserve.requestStxToStack(deployer, 200);
    result.expectOk().expectUintWithDecimals(200);

    // 200 STX stacking
    let call:any = await reserve.getStxStacking();
    call.result.expectOk().expectUintWithDecimals(200);

    // Stacker does not have STX
    call = returnStxJob.checkJob();
    call.result.expectOk().expectBool(false);

    // Reserve has no STX left
    call = core.getStxBalance(qualifiedName("reserve-v1"));
    call.result.expectUintWithDecimals(0);

    // Transfer 10 STX to stacker-1
    block = chain.mineBlock([
      Tx.transferSTX(10 * 1000000, qualifiedName("stacker-1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Stacker has STX, can return to reserve
    call = returnStxJob.checkJob();
    call.result.expectOk().expectBool(true);

    // Run job to return STX to reserve
    result = await returnStxJob.runJob(deployer);
    result.expectOk().expectBool(true);

    // Should not run again
    call = returnStxJob.checkJob();
    call.result.expectOk().expectBool(false);

    // 10 STX back in reserve
    call = core.getStxBalance(qualifiedName("reserve-v1"));
    call.result.expectUintWithDecimals(10);

    // 10 STX returned
    call = await reserve.getStxStacking();
    call.result.expectOk().expectUintWithDecimals(200 - 10);
  }
});
