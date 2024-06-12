import { Account, Chain, Clarinet, Tx, type } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "../wrappers/tests-utils.ts";
qualifiedName("")

import { FastPoolV2 } from '../wrappers/pox-fast-pool-v2-helpers.ts';
import { StackingPool } from '../wrappers/stacking-pool-helpers.ts';
import { Pox4Mock } from '../wrappers/pox-mock-helpers.ts';


//-------------------------------------
// Core 
//-------------------------------------

Clarinet.test({
  name: "fast-pool-v2: ",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    
    let fastPool = new FastPoolV2(chain, deployer);
    let stackingPool = new StackingPool(chain, deployer);
    let pox = new Pox4Mock(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    // Need to allow the pool to manage our stacking
    // Because delegating & locking is done for the user by the contract
    let result = await pox.allowContractCaller(deployer, qualifiedName("pox-fast-pool-v2-mock"));
    result.expectOk().expectBool(true);
    result = await pox.allowContractCaller(wallet_1, qualifiedName("pox-fast-pool-v2-mock"));
    result.expectOk().expectBool(true);
    result = await pox.allowContractCaller(wallet_2, qualifiedName("pox-fast-pool-v2-mock"));
    result.expectOk().expectBool(true);


    //
    // Move to cycle 1
    //
    await chain.mineEmptyBlockUntil(22);


    let call = await pox.getPoxInfo();
    // console.log("Block:", chain.blockHeight);
    // console.log("PoX Info:", call.result);

    // Commit failed as minimum not reached
    // TODO: Keeps 1 STX. Why?
    // Currently in cycle 1, so next cycle starts at block 42 and end ad block 63
    result = await fastPool.delegateStx(deployer, 1000);
    result.expectOk().expectTuple()["commit-result"].expectBool(false);
    result.expectOk().expectTuple()["lock-result"].expectTuple()["lock-amount"].expectUintWithDecimals(1000 - 1);
    result.expectOk().expectTuple()["lock-result"].expectTuple()["stacker"].expectPrincipal(deployer.address);
    result.expectOk().expectTuple()["lock-result"].expectTuple()["unlock-burn-height"].expectUint(63);

    // Commit succeeded as minimum reached
    // result = await fastPool.delegateStx(wallet_1, 200000);
    // result.expectOk().expectTuple()["commit-result"].expectBool(true);
    // result.expectOk().expectTuple()["lock-result"].expectTuple()["lock-amount"].expectUintWithDecimals(200000 - 1);
    // result.expectOk().expectTuple()["lock-result"].expectTuple()["stacker"].expectPrincipal(wallet_1.address);
    // result.expectOk().expectTuple()["lock-result"].expectTuple()["unlock-burn-height"].expectUint(63);

    // // STX account
    // call = await fastPool.getStxAccount(deployer.address);
    // call.result.expectTuple()["locked"].expectUintWithDecimals(999);
    // call.result.expectTuple()["unlocked"].expectUintWithDecimals(99999001);
    // call.result.expectTuple()["unlock-height"].expectUint(63);

    // // Stacker info
    // call = await pox.getStackerInfo(deployer.address);
    // call.result.expectSome().expectTuple()["first-reward-cycle"].expectUint(2);
    // call.result.expectSome().expectTuple()["lock-period"].expectUint(1);
    // call.result.expectSome().expectTuple()["delegated-to"].expectSome().expectPrincipal(qualifiedName("pox-fast-pool-v2-mock"));
    // // TODO: check pox-addr reward-set-indexes

    // // Locked info
    // call = await fastPool.getLockedInfoUser(deployer.address);
    // call.result.expectTuple()["current-cycle"].expectUint(1);
    // call.result.expectTuple()["unlock-height"].expectUint(63);
    // call.result.expectTuple()["not-locked"].expectBool(false);

    // // Can not execute as not reached half of cycle
    // result = await fastPool.delegateStackStx(deployer, deployer.address);
    // result.expectErr().expectUint(500);


    // //
    // // Move to mid of cycle 1
    // //

    // await chain.mineEmptyBlockUntil(21 + 15);

    // call = await pox.getPoxInfo();
    // // console.log("Block:", chain.blockHeight);
    // // console.log("PoX Info:", call.result);

    // // Already locked for next cycle
    // call = await fastPool.notLockedForCycle(63, 1 + 1)
    // call.result.expectBool(false);

    // // User delegates STX. Will aggregate-increase
    // result = await fastPool.delegateStx(wallet_2, 2000);
    // result.expectOk().expectTuple()["commit-result"].expectBool(true);
    // result.expectOk().expectTuple()["lock-result"].expectTuple()["lock-amount"].expectUintWithDecimals(2000 - 1);
    // result.expectOk().expectTuple()["lock-result"].expectTuple()["stacker"].expectPrincipal(wallet_2.address);
    // result.expectOk().expectTuple()["lock-result"].expectTuple()["unlock-burn-height"].expectUint(63);

    // // All was done when delegating STX
    // result = await fastPool.delegateStackStx(deployer, wallet_2.address);
    // result.expectErr().expectUint(603);


    //
    // TODO: next cycle we should only be able to delegateStackStx once half of cycle is over
    // TODO: we can not delegateStackSTX if 
    //

  }
});

//-------------------------------------
// Errors 
//-------------------------------------

//-------------------------------------
// Access 
//-------------------------------------
