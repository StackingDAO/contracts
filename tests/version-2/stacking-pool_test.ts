import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import {
  hexToBytes,
  qualifiedName,
  hexDecode,
} from "../wrappers/tests-utils.ts";

import { StackingDelegate } from "../wrappers/stacking-delegate-helpers.ts";
import { StackingPool } from "../wrappers/stacking-pool-helpers.ts";
import { Pox4Mock } from "../wrappers/pox-mock-helpers.ts";

//-------------------------------------
// Signer Signature
//-------------------------------------

Clarinet.test({
  name: "stacking-pool: signer signature",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let pox = new Pox4Mock(chain, deployer);

    let call = await pox.getSignerKeyMessageHash(1, "agg-commit", 1);
    call.result.expectBuff(
      hexToBytes(
        "0x59070b7e9b7bec902fb30e35203e67aa167d92d0e7bd7428b12e8d788e54cad2"
      )
    );

    call = await pox.getSignerKeyMessageHash(2, "agg-commit", 2);
    call.result.expectBuff(
      hexToBytes(
        "0x1265212cd2a8bd891bf01706778f3f151b7ba9f6135089a416b21303352c4c75"
      )
    );

    call = await pox.getSignerKeyMessageHash(3, "agg-commit", 3);
    call.result.expectBuff(
      hexToBytes(
        "0xd1ccd2d48e5844195b94e63b8927dbc7b3452950b4ba45359e7bf2c065b571fa"
      )
    );

    call = await pox.getSignerKeyMessageHash(4, "agg-commit", 4);
    call.result.expectBuff(
      hexToBytes(
        "0x9dc63b92307397a0aca555c92b5cfdb19f9a9c20b5a28c52e900689e5502f5bd"
      )
    );

    // Public and private key for deployer (ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
    const publicKey =
      "0390a5cac7c33fda49f70bc1b0866fa0ba7a9440d9de647fecb8132ceb76a94dfa";
    // Use script 'create-signer-sig'
    const signedMessage =
      "8e20aadcf90b313731a80ff87363903a97ad75dd553fb90de90a21c44d30bb2c1bf9404441ee900519af0ee50015b398658fd6603dcf8259b0cfacf5377de45b01";

    call = await pox.verifySignerKeySig(
      1,
      "agg-commit",
      signedMessage,
      publicKey,
      1
    );
    call.result.expectOk().expectBool(true);
  },
});

//-------------------------------------
// Core
//-------------------------------------

Clarinet.test({
  name: "stacking-pool: prepare",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stackingDelegate = new StackingDelegate(chain, deployer);
    let stackingPool = new StackingPool(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    //
    // 500k STX to delegate-1-1
    //

    let block = chain.mineBlock([
      Tx.transferSTX(
        500000 * 1000000,
        qualifiedName("reserve-v1"),
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let result = stackingDelegate.requestStxToStack(
      deployer,
      "stacking-delegate-1-1",
      500000
    );
    result.expectOk().expectUintWithDecimals(500000);

    let call = await stackingPool.getStxAccount(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectTuple()["locked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(500000);
    call.result.expectTuple()["unlock-height"].expectUint(0);

    //
    // Delegate 200k
    //

    result = stackingDelegate.delegateStx(
      deployer,
      "stacking-delegate-1-1",
      200000,
      qualifiedName("stacking-pool-v1"),
      42
    );
    result.expectOk().expectBool(true);

    chain.mineEmptyBlockUntil(15);

    result = stackingPool.prepare(wallet_1);
    result.expectOk().expectBool(true);

    call = await stackingPool.getStxAccount(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectTuple()["locked"].expectUintWithDecimals(200000);
    call.result
      .expectTuple()
      ["unlocked"].expectUintWithDecimals(500000 - 200000);
    call.result.expectTuple()["unlock-height"].expectUint(42);

    //
    // Prepare again
    //

    result = stackingDelegate.revokeDelegateStx(
      deployer,
      "stacking-delegate-1-1"
    );
    result.expectOk().expectBool(true);
    result = stackingDelegate.delegateStx(
      deployer,
      "stacking-delegate-1-1",
      250000,
      qualifiedName("stacking-pool-v1"),
      42
    );
    result.expectOk().expectBool(true);

    call = await stackingPool.getCycleToIndex(1);
    call.result.expectSome().expectUint(0);

    result = stackingPool.prepare(wallet_1);
    result.expectOk().expectBool(true);

    call = await stackingPool.getStxAccount(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectTuple()["locked"].expectUintWithDecimals(250000);
    call.result
      .expectTuple()
      ["unlocked"].expectUintWithDecimals(500000 - 250000);
    call.result.expectTuple()["unlock-height"].expectUint(42);
  },
});

Clarinet.test({
  name: "stacking-pool: can prepare multiple times",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stackingDelegate = new StackingDelegate(chain, deployer);
    let stackingPool = new StackingPool(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    //
    // 500k STX to delegate-1-1
    //

    let block = chain.mineBlock([
      Tx.transferSTX(
        1000000 * 1000000,
        qualifiedName("reserve-v1"),
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let result = stackingDelegate.requestStxToStack(
      deployer,
      "stacking-delegate-1-1",
      500000
    );
    result.expectOk().expectUintWithDecimals(500000);
    result = stackingDelegate.requestStxToStack(
      deployer,
      "stacking-delegate-1-2",
      500000
    );
    result.expectOk().expectUintWithDecimals(500000);

    //
    // Delegate 200k & prepare pool
    //

    result = stackingDelegate.delegateStx(
      deployer,
      "stacking-delegate-1-1",
      200000,
      qualifiedName("stacking-pool-v1"),
      42
    );
    result.expectOk().expectBool(true);

    chain.mineEmptyBlockUntil(19);

    result = stackingPool.prepare(wallet_1);
    result.expectOk().expectBool(true);

    //
    // Prepare again - Need to have extra delegated
    //

    result = stackingDelegate.delegateStx(
      deployer,
      "stacking-delegate-1-2",
      10,
      qualifiedName("stacking-pool-v1"),
      42
    );
    result.expectOk().expectBool(true);

    result = stackingPool.prepare(wallet_1);
    result.expectOk().expectBool(true);

    //
    // Check data
    //

    let call = await stackingPool.getStxAccount(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectTuple()["locked"].expectUintWithDecimals(200000);
    call.result
      .expectTuple()
      ["unlocked"].expectUintWithDecimals(500000 - 200000);
    call.result.expectTuple()["unlock-height"].expectUint(42);

    call = await stackingPool.getStxAccount(
      qualifiedName("stacking-delegate-1-2")
    );
    call.result.expectTuple()["locked"].expectUintWithDecimals(10);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(500000 - 10);
    call.result.expectTuple()["unlock-height"].expectUint(42);
  },
});

Clarinet.test({
  name: "stacking-pool: wallet can stack directly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stackingDelegate = new StackingDelegate(chain, deployer);
    let stackingPool = new StackingPool(chain, deployer);
    let pox = new Pox4Mock(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    //
    // Delegation contract
    //

    let block = chain.mineBlock([
      Tx.transferSTX(
        500000 * 1000000,
        qualifiedName("reserve-v1"),
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let result = stackingDelegate.requestStxToStack(
      deployer,
      "stacking-delegate-1-1",
      200000
    );
    result.expectOk().expectUintWithDecimals(200000);

    result = stackingDelegate.delegateStx(
      deployer,
      "stacking-delegate-1-1",
      200000,
      qualifiedName("stacking-pool-v1"),
      42
    );
    result.expectOk().expectBool(true);

    //
    // Delegation contract
    //

    result = pox.allowContractCaller(
      wallet_1,
      qualifiedName("stacking-pool-v1")
    );
    result.expectOk().expectBool(true);

    result = stackingPool.delegateStx(wallet_1, 1000, 99);
    result.expectOk().expectBool(true);

    //
    // Pool prepare
    //

    chain.mineEmptyBlockUntil(19);

    result = stackingPool.prepare(wallet_1); // Prepares StackingDAO
    result.expectOk().expectBool(true);

    result = stackingPool.prepareDelegate(wallet_1, wallet_1.address);
    result.expectOk().expectBool(true);

    let call = await stackingPool.getStxAccount(
      qualifiedName("stacking-delegate-1-1")
    );
    call.result.expectTuple()["locked"].expectUintWithDecimals(200000);
    call.result.expectTuple()["unlocked"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-height"].expectUint(42);

    call = await stackingPool.getStxAccount(wallet_1.address);
    call.result.expectTuple()["locked"].expectUintWithDecimals(1000);
    call.result
      .expectTuple()
      ["unlocked"].expectUintWithDecimals(100000000 - 1000);
    call.result.expectTuple()["unlock-height"].expectUint(42);

    // ERR_STACKING_NO_SUCH_PRINCIPAL
    // Can not prepare again as only delegated until burn block 42.
    result = stackingPool.prepareDelegate(wallet_1, wallet_1.address);
    result.expectErr().expectUint(4);

    //
    // Revoke
    //

    call = await pox.getCheckDelegation(wallet_1.address);
    call.result.expectSome();

    result = stackingPool.revokeDelegateStx(wallet_1);
    result.expectOk().expectBool(true);

    call = await pox.getCheckDelegation(wallet_1.address);
    call.result.expectNone();
  },
});

Clarinet.test({
  name: "stacking-pool: can prepare even if threshold not met",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stackingDelegate = new StackingDelegate(chain, deployer);
    let stackingPool = new StackingPool(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    let block = chain.mineBlock([
      Tx.transferSTX(
        500000 * 1000000,
        qualifiedName("reserve-v1"),
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let result = stackingDelegate.requestStxToStack(
      deployer,
      "stacking-delegate-1-1",
      500000
    );
    result.expectOk().expectUintWithDecimals(500000);

    result = stackingDelegate.delegateStx(
      deployer,
      "stacking-delegate-1-1",
      50000,
      qualifiedName("stacking-pool-v1"),
      42
    );
    result.expectOk().expectBool(true);

    chain.mineEmptyBlockUntil(19);

    // ERR_STACKING_THRESHOLD_NOT_MET
    result = stackingPool.prepare(deployer);
    result.expectOk().expectBool(true);
  },
});

//-------------------------------------
// Admin
//-------------------------------------

Clarinet.test({
  name: "stacking-pool: can set pox reward address",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stackingPool = new StackingPool(chain, deployer);

    let call = await stackingPool.getPoxRewardAddress();
    call.result.expectTuple()["version"].expectBuff(hexToBytes("0x04"));
    call.result
      .expectTuple()
      [
        "hashbytes"
      ].expectBuff(hexToBytes("0x2fffa9a09bb7fa7dced44834d77ee81c49c5f0cc"));

    let result = stackingPool.setPoxRewardAddress(
      deployer,
      "0x01",
      "0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ab"
    );
    result.expectOk().expectBool(true);

    call = await stackingPool.getPoxRewardAddress();
    call.result.expectTuple()["version"].expectBuff(hexToBytes("0x01"));
    call.result
      .expectTuple()
      [
        "hashbytes"
      ].expectBuff(hexToBytes("0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ab"));
  },
});

//-------------------------------------
// PoX Errors
//-------------------------------------

Clarinet.test({
  name: "stacking-pool: can not delegate again without revoking first",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stackingDelegate = new StackingDelegate(chain, deployer);

    let block = chain.mineBlock([
      Tx.transferSTX(
        500000 * 1000000,
        qualifiedName("reserve-v1"),
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let result = stackingDelegate.requestStxToStack(
      deployer,
      "stacking-delegate-1-1",
      500000
    );
    result.expectOk().expectUintWithDecimals(500000);

    result = stackingDelegate.delegateStx(
      deployer,
      "stacking-delegate-1-1",
      50000,
      qualifiedName("stacking-pool-v1"),
      42
    );
    result.expectOk().expectBool(true);

    // ERR_STACKING_ALREADY_DELEGATED
    result = stackingDelegate.delegateStx(
      deployer,
      "stacking-delegate-1-1",
      200000,
      qualifiedName("stacking-pool-v1"),
      42
    );
    result.expectErr().expectUint(20);

    // Revoke
    result = stackingDelegate.revokeDelegateStx(
      deployer,
      "stacking-delegate-1-1"
    );
    result.expectOk().expectBool(true);

    // Can delegate again
    result = stackingDelegate.delegateStx(
      deployer,
      "stacking-delegate-1-1",
      200000,
      qualifiedName("stacking-pool-v1"),
      42
    );
    result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "stacking-pool: can not delegate again if already stacked",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stackingDelegate = new StackingDelegate(chain, deployer);
    let stackingPool = new StackingPool(chain, deployer);

    let block = chain.mineBlock([
      Tx.transferSTX(
        500000 * 1000000,
        qualifiedName("reserve-v1"),
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let result = stackingDelegate.requestStxToStack(
      deployer,
      "stacking-delegate-1-1",
      500000
    );
    result.expectOk().expectUintWithDecimals(500000);

    result = stackingDelegate.delegateStx(
      deployer,
      "stacking-delegate-1-1",
      200000,
      qualifiedName("stacking-pool-v1"),
      42
    );
    result.expectOk().expectBool(true);

    result = stackingPool.delegateStackStx(
      deployer,
      qualifiedName("stacking-delegate-1-1"),
      200000
    );
    result
      .expectOk()
      .expectTuple()
      ["lock-amount"].expectUintWithDecimals(200000);
    result
      .expectOk()
      .expectTuple()
      ["stacker"].expectPrincipal(qualifiedName("stacking-delegate-1-1"));
    result.expectOk().expectTuple()["unlock-burn-height"].expectUint(42);

    // ERR_STACKING_ALREADY_STACKED
    result = stackingPool.delegateStackStx(
      deployer,
      qualifiedName("stacking-delegate-1-1"),
      200000
    );
    result.expectErr().expectUint(3);

    // Revoke
    result = stackingDelegate.revokeDelegateStx(
      deployer,
      "stacking-delegate-1-1"
    );
    result.expectOk().expectBool(true);

    // Can delegate again
    result = stackingDelegate.delegateStx(
      deployer,
      "stacking-delegate-1-1",
      200000,
      qualifiedName("stacking-pool-v1"),
      42
    );
    result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "stacking-pool: can not delegate without funds",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stackingDelegate = new StackingDelegate(chain, deployer);
    let stackingPool = new StackingPool(chain, deployer);

    let result = stackingDelegate.delegateStx(
      deployer,
      "stacking-delegate-1-1",
      200000,
      qualifiedName("stacking-pool-v1"),
      42
    );
    result.expectOk().expectBool(true);

    // ERR_STACKING_INSUFFICIENT_FUNDS
    result = stackingPool.delegateStackStx(
      deployer,
      qualifiedName("stacking-delegate-1-1"),
      200000
    );
    result.expectErr().expectUint(1);
  },
});

//-------------------------------------
// Errors
//-------------------------------------

Clarinet.test({
  name: "stacking-pool: can only prepare in last blocks",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stackingDelegate = new StackingDelegate(chain, deployer);
    let stackingPool = new StackingPool(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    let block = chain.mineBlock([
      Tx.transferSTX(
        500000 * 1000000,
        qualifiedName("reserve-v1"),
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let result = stackingDelegate.requestStxToStack(
      deployer,
      "stacking-delegate-1-1",
      500000
    );
    result.expectOk().expectUintWithDecimals(500000);

    result = stackingDelegate.delegateStx(
      deployer,
      "stacking-delegate-1-1",
      200000,
      qualifiedName("stacking-pool-v1"),
      42
    );
    result.expectOk().expectBool(true);

    result = stackingPool.prepareDelegateMany(wallet_1, [
      qualifiedName("stacking-delegate-1-1"),
    ]);
    result.expectErr().expectUint(205001);

    chain.mineEmptyBlockUntil(15);

    result = stackingPool.prepareDelegateMany(wallet_1, [
      qualifiedName("stacking-delegate-1-1"),
    ]);
    result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "stacking-pool: can not prepare delegate if nothing delegated",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stackingPool = new StackingPool(chain, deployer);
    await stackingPool.addSignatures(chain, deployer);

    chain.mineEmptyBlockUntil(15);

    let result = stackingPool.prepareDelegate(
      wallet_1,
      qualifiedName("stacking-delegate-1-1")
    );
    result.expectErr().expectUint(4);

    result = stackingPool.prepareDelegateMany(wallet_1, [
      qualifiedName("stacking-delegate-1-1"),
    ]);
    result.expectErr().expectUint(4);
  },
});

//-------------------------------------
// Access
//-------------------------------------

Clarinet.test({
  name: "stacking-pool: only protocol can use pox wrapper methods",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stackingPool = new StackingPool(chain, deployer);

    let result = stackingPool.delegateStackStx(wallet_1, wallet_1.address, 100);
    result.expectErr().expectUint(20003);

    result = stackingPool.delegateStackExtend(wallet_1, wallet_1.address);
    result.expectErr().expectUint(20003);

    result = stackingPool.delegateStackIncrease(wallet_1, wallet_1.address, 10);
    result.expectErr().expectUint(20003);

    result = stackingPool.stackAggregationCommitIndexed(wallet_1, 10);
    result.expectErr().expectUint(20003);

    result = stackingPool.stackAggregationIncrease(wallet_1, 2, 2);
    result.expectErr().expectUint(20003);
  },
});

Clarinet.test({
  name: "stacking-pool: only protocol can set pox reward address",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stackingPool = new StackingPool(chain, deployer);

    let result = stackingPool.setPoxRewardAddress(
      wallet_1,
      "0x01",
      "0xf632e6f9d29bfb07bc8948ca6e0dd09358f003ab"
    );
    result.expectErr().expectUint(20003);
  },
});
