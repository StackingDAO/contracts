import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { hexToBytes, qualifiedName } from "../wrappers/tests-utils.ts";

import { StackingDelegate } from '../wrappers/stacking-delegate-helpers.ts';
import { StackingPoolSigner } from '../wrappers/stacking-pool-signer-helpers.ts';
import { DataPools } from '../wrappers/data-pools-helpers.ts';

//-------------------------------------
// Core 
//-------------------------------------

Clarinet.test({
  name: "stacking-pool-signer: prepare",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dataPools = new DataPools(chain, deployer);
    let stackingDelegate = new StackingDelegate(chain, deployer);
    let stackingPool = new StackingPoolSigner(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    //
    // Setup pool
    //
    let result = dataPools.setActivePools(deployer, [qualifiedName("stacking-pool-signer-v1")])
    result.expectOk().expectBool(true);

    result = dataPools.setPoolDelegates(deployer, qualifiedName("stacking-pool-signer-v1"), [qualifiedName("stacking-delegate-1-1")])
    result.expectOk().expectBool(true);

    //
    // 500k STX to delegate-1-1
    //

    let block = chain.mineBlock([
      Tx.transferSTX(500000 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    result = stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 500000);
    result.expectOk().expectUintWithDecimals(500000);

    let call = await stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"))
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(500000);
    call.result.expectTuple()["unlock-height"].expectUint(0);

    //
    // Delegate 200k
    //

    result = stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-signer-v1"), 42);
    result.expectOk().expectBool(true);

    chain.mineEmptyBlockUntil(15);

    result = stackingPool.prepare(wallet_1);
    result.expectOk().expectBool(true);

    call = await stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"))
    call.result.expectTuple()["locked"].expectUintWithDecimals(200000);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(500000 - 200000);
    call.result.expectTuple()["unlock-height"].expectUint(42);

    //
    // Prepare again
    //

    result = stackingDelegate.revokeDelegateStx(deployer, "stacking-delegate-1-1");
    result.expectOk().expectBool(true);
    result = stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 250000, qualifiedName("stacking-pool-signer-v1"), 42);
    result.expectOk().expectBool(true);

    call = await stackingPool.getCycleToIndex(1);
    call.result.expectSome().expectUint(0);

    result = stackingPool.prepare(wallet_1);
    result.expectOk().expectBool(true);

    call = await stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"))
    call.result.expectTuple()["locked"].expectUintWithDecimals(250000);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(500000 - 250000);
    call.result.expectTuple()["unlock-height"].expectUint(42);
  }
});

Clarinet.test({
  name: "stacking-pool-signer: can prepare multiple times",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dataPools = new DataPools(chain, deployer);
    let stackingDelegate = new StackingDelegate(chain, deployer);
    let stackingPool = new StackingPoolSigner(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    //
    // Setup pool
    //
    let result = dataPools.setActivePools(deployer, [qualifiedName("stacking-pool-signer-v1")])
    result.expectOk().expectBool(true);

    result = dataPools.setPoolDelegates(deployer, qualifiedName("stacking-pool-signer-v1"), [qualifiedName("stacking-delegate-1-1"), qualifiedName("stacking-delegate-1-2")])
    result.expectOk().expectBool(true);

    //
    // 500k STX to delegate-1-1
    //

    let block = chain.mineBlock([
      Tx.transferSTX(1000000 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    result = stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 500000);
    result.expectOk().expectUintWithDecimals(500000);
    result = stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-2", 500000);
    result.expectOk().expectUintWithDecimals(500000);

    //
    // Delegate 200k & prepare pool
    //

    result = stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-signer-v1"), 42);
    result.expectOk().expectBool(true);

    chain.mineEmptyBlockUntil(19);

    result = stackingPool.prepare(wallet_1);
    result.expectOk().expectBool(true);

    //
    // Prepare again - Need to have extra delegated
    //

    result = stackingDelegate.delegateStx(deployer, "stacking-delegate-1-2", 10, qualifiedName("stacking-pool-signer-v1"), 42);
    result.expectOk().expectBool(true);

    result = stackingPool.prepare(wallet_1);
    result.expectOk().expectBool(true);

    //
    // Check data
    //

    let call = await stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-1"))
    call.result.expectTuple()["locked"].expectUintWithDecimals(200000);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(500000 - 200000);
    call.result.expectTuple()["unlock-height"].expectUint(42);

    call = await stackingPool.getStxAccount(qualifiedName("stacking-delegate-1-2"))
    call.result.expectTuple()["locked"].expectUintWithDecimals(10);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(500000 - 10);
    call.result.expectTuple()["unlock-height"].expectUint(42);
  }
});

Clarinet.test({
  name: "stacking-pool-signer: can prepare even if threshold not met",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let dataPools = new DataPools(chain, deployer);
    let stackingDelegate = new StackingDelegate(chain, deployer);
    let stackingPool = new StackingPoolSigner(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    //
    // Setup pool
    //
    let result = dataPools.setActivePools(deployer, [qualifiedName("stacking-pool-signer-v1")])
    result.expectOk().expectBool(true);

    result = dataPools.setPoolDelegates(deployer, qualifiedName("stacking-pool-signer-v1"), [qualifiedName("stacking-delegate-1-1"), qualifiedName("stacking-delegate-1-2")])
    result.expectOk().expectBool(true);

    //
    //
    //
    let block = chain.mineBlock([
      Tx.transferSTX(500000 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    result = stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 500000);
    result.expectOk().expectUintWithDecimals(500000);

    result = stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 50000, qualifiedName("stacking-pool-signer-v1"), 42);
    result.expectOk().expectBool(true);

    chain.mineEmptyBlockUntil(19);

    // ERR_STACKING_THRESHOLD_NOT_MET
    result = stackingPool.prepare(deployer);
    result.expectOk().expectBool(true);
  }
});

//-------------------------------------
// Admin 
//-------------------------------------

Clarinet.test({
  name: "stacking-pool-signer: can set new owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stackingPool = new StackingPoolSigner(chain, deployer);

    let call = await stackingPool.getPoolOwner();
    call.result.expectPrincipal(deployer.address);

    let result = stackingPool.setPoolOwner(deployer, wallet_1.address);
    result.expectOk().expectBool(true);

    call = await stackingPool.getPoolOwner();
    call.result.expectPrincipal(wallet_1.address);
  }
});

Clarinet.test({
  name: "stacking-pool-signer: can set pox reward address",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stackingPool = new StackingPoolSigner(chain, deployer);

    let call = await stackingPool.getPoxRewardAddress();
    call.result.expectTuple()["version"].expectBuff(hexToBytes("0x04"));
    call.result.expectTuple()["hashbytes"].expectBuff(hexToBytes("0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc"));

    let result = stackingPool.setPoxRewardAddress(deployer, "0x01", "0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ab");
    result.expectOk().expectBool(true);

    call = await stackingPool.getPoxRewardAddress();
    call.result.expectTuple()["version"].expectBuff(hexToBytes("0x01"));
    call.result.expectTuple()["hashbytes"].expectBuff(hexToBytes("0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ab"));
  }
});

//-------------------------------------
// PoX Errors 
//-------------------------------------

Clarinet.test({
  name: "stacking-pool-signer: can not delegate again without revoking first",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stackingDelegate = new StackingDelegate(chain, deployer);

    let block = chain.mineBlock([
      Tx.transferSTX(500000 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let result = stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 500000);
    result.expectOk().expectUintWithDecimals(500000);

    result = stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 50000, qualifiedName("stacking-pool-signer-v1"), 42);
    result.expectOk().expectBool(true);

    // ERR_STACKING_ALREADY_DELEGATED 
    result = stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-signer-v1"), 42);
    result.expectErr().expectUint(20);

    // Revoke
    result = stackingDelegate.revokeDelegateStx(deployer,  "stacking-delegate-1-1");
    result.expectOk().expectBool(true);

    // Can delegate again
    result = stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-signer-v1"), 42);
    result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "stacking-pool-signer: can not delegate again if already stacked",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stackingDelegate = new StackingDelegate(chain, deployer);
    let stackingPool = new StackingPoolSigner(chain, deployer);

    let block = chain.mineBlock([
      Tx.transferSTX(500000 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let result = stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 500000);
    result.expectOk().expectUintWithDecimals(500000);

    result = stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-signer-v1"), 42);
    result.expectOk().expectBool(true);

    result = stackingPool.delegateStackStx(deployer, qualifiedName("stacking-delegate-1-1"), 200000);
    result.expectOk().expectTuple()["lock-amount"].expectUintWithDecimals(200000);
    result.expectOk().expectTuple()["stacker"].expectPrincipal(qualifiedName("stacking-delegate-1-1"));
    result.expectOk().expectTuple()["unlock-burn-height"].expectUint(42);

    // ERR_STACKING_ALREADY_STACKED
    result = stackingPool.delegateStackStx(deployer, qualifiedName("stacking-delegate-1-1"), 200000);
    result.expectErr().expectUint(3);

    // Revoke
    result = stackingDelegate.revokeDelegateStx(deployer,  "stacking-delegate-1-1");
    result.expectOk().expectBool(true);

    // Can delegate again
    result = stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-signer-v1"), 42);
    result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "stacking-pool-signer: can not delegate without funds",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stackingDelegate = new StackingDelegate(chain, deployer);
    let stackingPool = new StackingPoolSigner(chain, deployer);

    let result = stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-signer-v1"), 42);
    result.expectOk().expectBool(true);

    // ERR_STACKING_INSUFFICIENT_FUNDS
    result = stackingPool.delegateStackStx(deployer, qualifiedName("stacking-delegate-1-1"), 200000);
    result.expectErr().expectUint(1);
  }
});

//-------------------------------------
// Errors 
//-------------------------------------

Clarinet.test({
  name: "stacking-pool-signer: can only prepare in last blocks",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dataPools = new DataPools(chain, deployer);

    //
    // Setup pool
    //
    let result = dataPools.setActivePools(deployer, [qualifiedName("stacking-pool-signer-v1")])
    result.expectOk().expectBool(true);

    result = dataPools.setPoolDelegates(deployer, qualifiedName("stacking-pool-signer-v1"), [qualifiedName("stacking-delegate-1-1")])
    result.expectOk().expectBool(true);

    // Go to next cycle
    chain.mineEmptyBlockUntil(22);

    //
    // Prepare
    //
    let stackingDelegate = new StackingDelegate(chain, deployer);
    let stackingPool = new StackingPoolSigner(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    let block = chain.mineBlock([
      Tx.transferSTX(500000 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    result = stackingDelegate.requestStxToStack(deployer, "stacking-delegate-1-1", 500000);
    result.expectOk().expectUintWithDecimals(500000);

    result = stackingDelegate.delegateStx(deployer, "stacking-delegate-1-1", 200000, qualifiedName("stacking-pool-signer-v1"), 63);
    result.expectOk().expectBool(true);

    result = stackingPool.prepare(wallet_1)
    result.expectErr().expectUint(99502);

    chain.mineEmptyBlockUntil(41);

    result = stackingPool.prepare(wallet_1)
    result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "stacking-pool-signer: can not prepare delegate if nothing delegated",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stackingPool = new StackingPoolSigner(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    chain.mineEmptyBlockUntil(15);

    let result = stackingPool.prepare(wallet_1)
    result.expectErr().expectUint(4);
  }
});

//-------------------------------------
// Access 
//-------------------------------------

Clarinet.test({
  name: "stacking-pool-signer: only pool owner can use pox wrapper methods",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stackingPool = new StackingPoolSigner(chain, deployer);

    let result = stackingPool.delegateStackStx(wallet_1, wallet_1.address, 100);
    result.expectErr().expectUint(99501);

    result = stackingPool.delegateStackExtend(wallet_1, wallet_1.address);
    result.expectErr().expectUint(99501);

    result = stackingPool.delegateStackIncrease(wallet_1, wallet_1.address, 10);
    result.expectErr().expectUint(99501);

    result = stackingPool.stackAggregationCommitIndexed(wallet_1, 10);
    result.expectErr().expectUint(99501);

    result = stackingPool.stackAggregationIncrease(wallet_1, 2, 2);
    result.expectErr().expectUint(99501);

  }
});

Clarinet.test({
  name: "stacking-pool-signer: only pool owner can use admin functions",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stackingPool = new StackingPoolSigner(chain, deployer);

    let result = stackingPool.setPoxRewardAddress(wallet_1, "0x01", "0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ab");
    result.expectErr().expectUint(99501);

    result = stackingPool.setPoolOwner(wallet_1, deployer.address);
    result.expectErr().expectUint(99501);
  }
});
