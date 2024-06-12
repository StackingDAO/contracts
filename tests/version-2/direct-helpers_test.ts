import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "../wrappers/tests-utils.ts";

import { DirectHelpers } from '../wrappers/direct-helpers-helpers.ts';
import { DataDirectStacking } from '../wrappers/data-direct-stacking-helpers.ts';
import { StStxToken } from '../wrappers/ststx-token-helpers.ts';

//-------------------------------------
// Core 
//-------------------------------------

Clarinet.test({
  name: "direct-helpers: add and subtract direct stacking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dataDirectStacking = new DataDirectStacking(chain, deployer);
    let directHelpers = new DirectHelpers(chain, deployer);

    let call = await dataDirectStacking.getTotalDirectStacking()
    call.result.expectUintWithDecimals(0);
    call = await dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))
    call.result.expectUintWithDecimals(0);
    call = await dataDirectStacking.getDirectStackingUser(wallet_1.address);
    call.result.expectNone();


    // Add to direct stacking with pool
    let result = await directHelpers.addDirectStacking(deployer, wallet_1.address, qualifiedName("stacking-pool-v1"), 100)
    result.expectOk().expectBool(true);

    call = await dataDirectStacking.getTotalDirectStacking()
    call.result.expectUintWithDecimals(100);
    call = await dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))
    call.result.expectUintWithDecimals(100);
    call = await dataDirectStacking.getDirectStackingUser(wallet_1.address);
    call.result.expectSome().expectTuple()["amount"].expectUintWithDecimals(100);
    call.result.expectSome().expectTuple()["pool"].expectPrincipal(qualifiedName("stacking-pool-v1"));


    // Subtract from direct stacking
    result = await directHelpers.subtractDirectStacking(deployer, wallet_1.address, 20)
    result.expectOk().expectBool(true);

    call = await dataDirectStacking.getTotalDirectStacking()
    call.result.expectUintWithDecimals(100 - 20);
    call = await dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))
    call.result.expectUintWithDecimals(100 - 20);
    call = await dataDirectStacking.getDirectStackingUser(wallet_1.address);
    call.result.expectSome().expectTuple()["amount"].expectUintWithDecimals(100 - 20);
    call.result.expectSome().expectTuple()["pool"].expectPrincipal(qualifiedName("stacking-pool-v1"));


    // Subtract from direct stacking, more than total
    // So direct stacking for user will be stopped
    result = await directHelpers.subtractDirectStacking(deployer, wallet_1.address, 90)
    result.expectOk().expectBool(true);
    call = await dataDirectStacking.getTotalDirectStacking()
    call.result.expectUintWithDecimals(0);
    call = await dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))
    call.result.expectUintWithDecimals(0);
    call = await dataDirectStacking.getDirectStackingUser(wallet_1.address);
    call.result.expectNone();
  }
});

Clarinet.test({
  name: "direct-helpers: add direct stacking multiple times",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dataDirectStacking = new DataDirectStacking(chain, deployer);
    let directHelpers = new DirectHelpers(chain, deployer);

    //
    // No pool, so no direct stacking
    //

    let result = await directHelpers.addDirectStacking(deployer, wallet_1.address, undefined, 100)
    result.expectOk().expectBool(true);

    let call = await dataDirectStacking.getTotalDirectStacking()
    call.result.expectUintWithDecimals(0);
    call = await dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))
    call.result.expectUintWithDecimals(0);
    call = await dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("pox-fast-pool-v2-mock"))
    call.result.expectUintWithDecimals(0);
    call = await dataDirectStacking.getDirectStackingUser(wallet_1.address);
    call.result.expectNone();

    //
    // Still no pool, so no direct stacking
    //

    result = await directHelpers.addDirectStacking(deployer, wallet_1.address, undefined, 200)
    result.expectOk().expectBool(true);

    call = await dataDirectStacking.getTotalDirectStacking()
    call.result.expectUintWithDecimals(0);
    call = await dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))
    call.result.expectUintWithDecimals(0);
    call = await dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("pox-fast-pool-v2-mock"))
    call.result.expectUintWithDecimals(0);
    call = await dataDirectStacking.getDirectStackingUser(wallet_1.address);
    call.result.expectNone();

    //
    // Direct stack
    //

    result = await directHelpers.addDirectStacking(deployer, wallet_1.address, qualifiedName("stacking-pool-v1"), 500)
    result.expectOk().expectBool(true);

    call = await dataDirectStacking.getTotalDirectStacking()
    call.result.expectUintWithDecimals(500);
    call = await dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))
    call.result.expectUintWithDecimals(500);
    call = await dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("pox-fast-pool-v2-mock"))
    call.result.expectUintWithDecimals(0);
    call = await dataDirectStacking.getDirectStackingUser(wallet_1.address);
    call.result.expectSome().expectTuple()["amount"].expectUintWithDecimals(500);
    call.result.expectSome().expectTuple()["pool"].expectPrincipal(qualifiedName("stacking-pool-v1"));

    //
    // Direct stack - Different pool
    //

    result = await directHelpers.addDirectStacking(deployer, wallet_1.address, qualifiedName("pox-fast-pool-v2-mock"), 100)
    result.expectOk().expectBool(true);

    call = await dataDirectStacking.getTotalDirectStacking()
    call.result.expectUintWithDecimals(600);
    call = await dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))
    call.result.expectUintWithDecimals(0);
    call = await dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("pox-fast-pool-v2-mock"))
    call.result.expectUintWithDecimals(600);
    call = await dataDirectStacking.getDirectStackingUser(wallet_1.address);
    call.result.expectSome().expectTuple()["amount"].expectUintWithDecimals(600);
    call.result.expectSome().expectTuple()["pool"].expectPrincipal(qualifiedName("pox-fast-pool-v2-mock"));

    //
    // Direct stack - Same pool
    //

    result = await directHelpers.addDirectStacking(deployer, wallet_1.address, qualifiedName("pox-fast-pool-v2-mock"), 50)
    result.expectOk().expectBool(true);

    call = await dataDirectStacking.getTotalDirectStacking()
    call.result.expectUintWithDecimals(650);
    call = await dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))
    call.result.expectUintWithDecimals(0);
    call = await dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("pox-fast-pool-v2-mock"))
    call.result.expectUintWithDecimals(650);
    call = await dataDirectStacking.getDirectStackingUser(wallet_1.address);
    call.result.expectSome().expectTuple()["amount"].expectUintWithDecimals(650);
    call.result.expectSome().expectTuple()["pool"].expectPrincipal(qualifiedName("pox-fast-pool-v2-mock"));

    //
    // Normal stacking, stops direct stacking
    //

    result = await directHelpers.addDirectStacking(deployer, wallet_1.address, undefined, 50)
    result.expectOk().expectBool(true);

    call = await dataDirectStacking.getTotalDirectStacking()
    call.result.expectUintWithDecimals(0);
    call = await dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))
    call.result.expectUintWithDecimals(0);
    call = await dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("pox-fast-pool-v2-mock"))
    call.result.expectUintWithDecimals(0);
    call = await dataDirectStacking.getDirectStackingUser(wallet_1.address);
    call.result.expectNone();

    result = await directHelpers.stopDirectStackingUser(wallet_1);
    result.expectOk().expectBool(true);
  }
});

//-------------------------------------
// Core - User
//-------------------------------------

Clarinet.test({
  name: "direct-helpers: user can subtract direct stacking and stop",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dataDirectStacking = new DataDirectStacking(chain, deployer);
    let directHelpers = new DirectHelpers(chain, deployer);

    //
    // Direct stack
    //

    let result = await directHelpers.addDirectStacking(deployer, wallet_1.address, qualifiedName("stacking-pool-v1"), 500)
    result.expectOk().expectBool(true);

    let call = await dataDirectStacking.getTotalDirectStacking()
    call.result.expectUintWithDecimals(500);
    call = await dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))
    call.result.expectUintWithDecimals(500);
    call = await dataDirectStacking.getDirectStackingUser(wallet_1.address);
    call.result.expectSome().expectTuple()["amount"].expectUintWithDecimals(500);
    call.result.expectSome().expectTuple()["pool"].expectPrincipal(qualifiedName("stacking-pool-v1"));


    //
    // Subtract
    //

    result = await directHelpers.subtractDirectStackingUser(wallet_1, 100);
    result.expectOk().expectBool(true);

    call = await dataDirectStacking.getTotalDirectStacking()
    call.result.expectUintWithDecimals(400);
    call = await dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))
    call.result.expectUintWithDecimals(400);
    call = await dataDirectStacking.getDirectStackingUser(wallet_1.address);
    call.result.expectSome().expectTuple()["amount"].expectUintWithDecimals(400);
    call.result.expectSome().expectTuple()["pool"].expectPrincipal(qualifiedName("stacking-pool-v1"));

    //
    // Stop
    //

    result = await directHelpers.stopDirectStackingUser(wallet_1);
    result.expectOk().expectBool(true);

    call = await dataDirectStacking.getTotalDirectStacking()
    call.result.expectUintWithDecimals(0);
    call = await dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"))
    call.result.expectUintWithDecimals(0);
    call = await dataDirectStacking.getDirectStackingUser(wallet_1.address);
    call.result.expectNone();
  }
});

//-------------------------------------
// Core - Supported protocols
//-------------------------------------

Clarinet.test({
  name: "direct-helpers: stSTX moved to unsupported protocol, subtract direct stacking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let dataDirectStacking = new DataDirectStacking(chain, deployer);
    let directHelpers = new DirectHelpers(chain, deployer);
    let stStxToken = new StStxToken(chain, deployer);

    // Setup: 100 stSTX for wallet_1, 100 STX to reserve
    let result = await stStxToken.mintForProtocol(deployer, 100, wallet_1.address);
    result.expectOk().expectBool(true);
    let block = chain.mineBlock([
      Tx.transferSTX(100 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let call = await directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1.address);
    call.result.expectOk().expectTuple()["balance-ststx"].expectUintWithDecimals(100);
    call.result.expectOk().expectTuple()["direct-stacking-stx"].expectUintWithDecimals(0);
    call.result.expectOk().expectTuple()["direct-stacking-ststx"].expectUintWithDecimals(0);

    // Add direct stacking
    result = await directHelpers.addDirectStacking(deployer, wallet_1.address, qualifiedName("stacking-pool-v1"), 100)
    result.expectOk().expectBool(true);

    call = await directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1.address);
    call.result.expectOk().expectTuple()["balance-ststx"].expectUintWithDecimals(100);
    call.result.expectOk().expectTuple()["direct-stacking-stx"].expectUintWithDecimals(100);
    call.result.expectOk().expectTuple()["direct-stacking-ststx"].expectUintWithDecimals(100);


    // Transfer stSTX
    result = await stStxToken.transfer(wallet_1, 20, wallet_2.address);
    result.expectOk().expectBool(true);

    call = await directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1.address);
    call.result.expectOk().expectTuple()["balance-ststx"].expectUintWithDecimals(100 - 20);
    call.result.expectOk().expectTuple()["direct-stacking-stx"].expectUintWithDecimals(100);
    call.result.expectOk().expectTuple()["direct-stacking-ststx"].expectUintWithDecimals(100);

    // Update direct stacking
    result = await directHelpers.updateDirectStacking(wallet_2, [qualifiedName("protocol-arkadiko-mock")], wallet_1.address);
    result.expectOk().expectBool(true);

    call = await directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1.address);
    call.result.expectOk().expectTuple()["balance-ststx"].expectUintWithDecimals(100 - 20);
    call.result.expectOk().expectTuple()["direct-stacking-stx"].expectUintWithDecimals(100 - 20);
    call.result.expectOk().expectTuple()["direct-stacking-ststx"].expectUintWithDecimals(100 - 20);

    // Update direct stacking
    result = await directHelpers.updateDirectStacking(wallet_2, [qualifiedName("protocol-arkadiko-mock")], wallet_1.address);
    result.expectOk().expectBool(true);

    call = await directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1.address);
    call.result.expectOk().expectTuple()["balance-ststx"].expectUintWithDecimals(100 - 20);
    call.result.expectOk().expectTuple()["direct-stacking-stx"].expectUintWithDecimals(100 - 20);
    call.result.expectOk().expectTuple()["direct-stacking-ststx"].expectUintWithDecimals(100 - 20);


    // Transfer all stSTX
    result = await stStxToken.transfer(wallet_1, 80, wallet_2.address);
    result.expectOk().expectBool(true);

    // Update direct stacking
    result = await directHelpers.updateDirectStacking(wallet_2, [qualifiedName("protocol-arkadiko-mock")], wallet_1.address);
    result.expectOk().expectBool(true);

    call = await directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1.address);
    call.result.expectOk().expectTuple()["balance-ststx"].expectUintWithDecimals(0);
    call.result.expectOk().expectTuple()["direct-stacking-stx"].expectUintWithDecimals(0);
    call.result.expectOk().expectTuple()["direct-stacking-ststx"].expectUintWithDecimals(0);
  }
});

Clarinet.test({
  name: "direct-helpers: stSTX moved to unsupported protocol, but still have enough STX so do not subtract direct stacking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let directHelpers = new DirectHelpers(chain, deployer);
    let stStxToken = new StStxToken(chain, deployer);

    // Setup: 200 stSTX for wallet_1, 200 STX to reserve
    let result = await stStxToken.mintForProtocol(deployer, 200, wallet_1.address);
    result.expectOk().expectBool(true);
    let block = chain.mineBlock([
      Tx.transferSTX(200 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let call = await directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1.address);
    call.result.expectOk().expectTuple()["balance-ststx"].expectUintWithDecimals(200);
    call.result.expectOk().expectTuple()["direct-stacking-stx"].expectUintWithDecimals(0);

    // Add direct stacking
    result = await directHelpers.addDirectStacking(deployer, wallet_1.address, qualifiedName("stacking-pool-v1"), 100)
    result.expectOk().expectBool(true);

    call = await directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1.address);
    call.result.expectOk().expectTuple()["balance-ststx"].expectUintWithDecimals(200);
    call.result.expectOk().expectTuple()["direct-stacking-stx"].expectUintWithDecimals(100);


    // Transfer stSTX
    result = await stStxToken.transfer(wallet_1, 20, wallet_2.address);
    result.expectOk().expectBool(true);

    call = await directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1.address);
    call.result.expectOk().expectTuple()["balance-ststx"].expectUintWithDecimals(200 - 20);
    call.result.expectOk().expectTuple()["direct-stacking-stx"].expectUintWithDecimals(100);

    // Update direct stacking
    result = await directHelpers.updateDirectStacking(wallet_2, [qualifiedName("protocol-arkadiko-mock")], wallet_1.address);
    result.expectOk().expectBool(true);

    call = await directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1.address);
    call.result.expectOk().expectTuple()["balance-ststx"].expectUintWithDecimals(200 - 20);
    call.result.expectOk().expectTuple()["direct-stacking-stx"].expectUintWithDecimals(100);
  }
});

Clarinet.test({
  name: "direct-helpers: stSTX moved to supported protocol",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let directHelpers = new DirectHelpers(chain, deployer);
    let stStxToken = new StStxToken(chain, deployer);

    // Setup: 100 stSTX for wallet_1, 100 STX to reserve
    let result = await stStxToken.mintForProtocol(deployer, 100, wallet_1.address);
    result.expectOk().expectBool(true);
    let block = chain.mineBlock([
      Tx.transferSTX(100 * 1000000, qualifiedName("reserve-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let call = await directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1.address);
    call.result.expectOk().expectTuple()["balance-ststx"].expectUintWithDecimals(100);
    call.result.expectOk().expectTuple()["direct-stacking-stx"].expectUintWithDecimals(0);

    // Add direct stacking
    result = await directHelpers.addDirectStacking(deployer, wallet_1.address, qualifiedName("stacking-pool-v1"), 100)
    result.expectOk().expectBool(true);

    call = await directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1.address);
    call.result.expectOk().expectTuple()["balance-ststx"].expectUintWithDecimals(100);
    call.result.expectOk().expectTuple()["direct-stacking-stx"].expectUintWithDecimals(100);


    // Transfer stSTX to supported protocol
    block = chain.mineBlock([
      Tx.contractCall("protocol-arkadiko-mock", "add-user-balance", [
        types.uint(20 * 1000000)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);


    call = await directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1.address);
    call.result.expectOk().expectTuple()["balance-ststx"].expectUintWithDecimals(100);
    call.result.expectOk().expectTuple()["direct-stacking-stx"].expectUintWithDecimals(100);

    // Update direct stacking
    result = await directHelpers.updateDirectStacking(wallet_2, [qualifiedName("protocol-arkadiko-mock")], wallet_1.address);
    result.expectOk().expectBool(true);

    call = await directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1.address);
    call.result.expectOk().expectTuple()["balance-ststx"].expectUintWithDecimals(100);
    call.result.expectOk().expectTuple()["direct-stacking-stx"].expectUintWithDecimals(100);


    // Transfer stSTX from supported protocol
    block = chain.mineBlock([
      Tx.contractCall("protocol-arkadiko-mock", "remove-user-balance", [
        types.uint(10 * 1000000)
      ], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Update direct stacking
    result = await directHelpers.updateDirectStacking(wallet_2, [qualifiedName("protocol-arkadiko-mock")], wallet_1.address);
    result.expectOk().expectBool(true);

    call = await directHelpers.calculateDirectStackingInfo([qualifiedName("protocol-arkadiko-mock")], wallet_1.address);
    call.result.expectOk().expectTuple()["balance-ststx"].expectUintWithDecimals(100);
    call.result.expectOk().expectTuple()["direct-stacking-stx"].expectUintWithDecimals(100);
  }
});

//-------------------------------------
// Errors 
//-------------------------------------

Clarinet.test({
  name: "direct-helpers: can not update direct stacking with wrong reserve",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall("direct-helpers-v1", "update-direct-stacking", [
        types.principal(qualifiedName("fake-reserve")),
        types.list([qualifiedName("protocol-arkadiko-mock")].map(protocol => types.principal(protocol))),
        types.principal(wallet_1.address),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);
  }
});

Clarinet.test({
  name: "direct-helpers: can not update direct stacking with wrong protocols",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let directHelpers = new DirectHelpers(chain, deployer);

    let result = await directHelpers.updateDirectStacking(wallet_2, [qualifiedName("fake-protocol")], wallet_1.address);
    result.expectErr().expectUint(202001);
  }
});

//-------------------------------------
// Access 
//-------------------------------------

Clarinet.test({
  name: "direct-helpers: only protocol can add, subtract or stop direct stacking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let directHelpers = new DirectHelpers(chain, deployer);

    let result = await directHelpers.addDirectStacking(wallet_1, wallet_2.address, qualifiedName("stacking-pool-v1"), 100)
    result.expectErr().expectUint(20003);

    result = await directHelpers.subtractDirectStacking(wallet_1, wallet_2.address, 20)
    result.expectErr().expectUint(20003);

    result = await directHelpers.stopDirectStacking(wallet_1, wallet_2.address);
    result.expectErr().expectUint(20003);
  }
});
