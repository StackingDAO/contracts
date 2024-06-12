import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "../wrappers/tests-utils.ts";

import { DataDirectStacking } from '../wrappers/data-direct-stacking-helpers.ts';

//-------------------------------------
// Protocol 
//-------------------------------------

Clarinet.test({
  name: "data-direct-stacking: protocol can update direct stacking dependence",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let dataDirectStacking = new DataDirectStacking(chain, deployer);

    let call = await dataDirectStacking.getDirectStackingDependence();
    call.result.expectUint(2000);

    let result = await dataDirectStacking.setDirectStackingDependence(deployer, 3000);
    result.expectOk().expectBool(true);
  
    call = await dataDirectStacking.getDirectStackingDependence();
    call.result.expectUint(3000);
  }
});

Clarinet.test({
  name: "data-direct-stacking: protocol can update total direct stacking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let dataDirectStacking = new DataDirectStacking(chain, deployer);

    let call = await dataDirectStacking.getTotalDirectStacking();
    call.result.expectUintWithDecimals(0);

    let result = await dataDirectStacking.setTotalDirectStacking(deployer, 500)
    result.expectOk().expectBool(true);
  
    call = await dataDirectStacking.getTotalDirectStacking();
    call.result.expectUintWithDecimals(500);
  }
});

Clarinet.test({
  name: "data-direct-stacking: protocol can update total direct stacking for pool",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let dataDirectStacking = new DataDirectStacking(chain, deployer);

    let call = await dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"));
    call.result.expectUintWithDecimals(0);

    let result = await dataDirectStacking.setDirectStackingPoolAmount(deployer, qualifiedName("stacking-pool-v1"), 500)
    result.expectOk().expectBool(true);
  
    call = await dataDirectStacking.getDirectStackingPoolAmount(qualifiedName("stacking-pool-v1"));
    call.result.expectUintWithDecimals(500);
  }
});

Clarinet.test({
  name: "data-direct-stacking: protocol can update total direct stacking for user",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dataDirectStacking = new DataDirectStacking(chain, deployer);

    let call = await dataDirectStacking.getDirectStackingUser(wallet_1.address)
    call.result.expectNone();

    let result = await dataDirectStacking.setDirectStackingUser(deployer, wallet_1.address, qualifiedName("stacking-pool-v1"), 500);
    result.expectOk().expectBool(true);
  
    call = await dataDirectStacking.getDirectStackingUser(wallet_1.address)
    call.result.expectSome().expectTuple()["amount"].expectUintWithDecimals(500);
    call.result.expectSome().expectTuple()["pool"].expectPrincipal(qualifiedName("stacking-pool-v1"));
  }
});

Clarinet.test({
  name: "data-direct-stacking: protocol can delete direct stacking for user",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dataDirectStacking = new DataDirectStacking(chain, deployer);

    let result = await dataDirectStacking.setDirectStackingUser(deployer, wallet_1.address, qualifiedName("stacking-pool-v1"), 500);
    result.expectOk().expectBool(true);
  
    let call = await dataDirectStacking.getDirectStackingUser(wallet_1.address)
    call.result.expectSome().expectTuple()["amount"].expectUintWithDecimals(500);
    call.result.expectSome().expectTuple()["pool"].expectPrincipal(qualifiedName("stacking-pool-v1"));

    result = await dataDirectStacking.deleteDirectStackingUser(deployer, wallet_1.address);
    result.expectOk().expectBool(true);

    call = await dataDirectStacking.getDirectStackingUser(wallet_1.address)
    call.result.expectNone();
  }
});

Clarinet.test({
  name: "data-direct-stacking: protocol can set supported protocols",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let dataDirectStacking = new DataDirectStacking(chain, deployer);

    let call = await dataDirectStacking.getSupportedProtocols();
    call.result.expectList()[0].expectPrincipal(qualifiedName("protocol-arkadiko-mock"));

    let result = await dataDirectStacking.setSupportedProtocols(deployer, [qualifiedName("new-protocol"), qualifiedName("protocol-arkadiko-v1")])
    result.expectOk().expectBool(true);
  
    call = await dataDirectStacking.getSupportedProtocols();
    call.result.expectList()[0].expectPrincipal(qualifiedName("new-protocol"));
    call.result.expectList()[1].expectPrincipal(qualifiedName("protocol-arkadiko-v1"));
  }
});

//-------------------------------------
// Access 
//-------------------------------------

Clarinet.test({
  name: "data-direct-stacking: only protocol can use setters",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dataDirectStacking = new DataDirectStacking(chain, deployer);

    let result = await dataDirectStacking.setDirectStackingDependence(wallet_1, 3000);
    result.expectErr().expectUint(20003);

    result = await dataDirectStacking.setTotalDirectStacking(wallet_1, 500)
    result.expectErr().expectUint(20003);

    result = await dataDirectStacking.setDirectStackingPoolAmount(wallet_1, qualifiedName("stacking-pool-v1"), 500)
    result.expectErr().expectUint(20003);

    result = await dataDirectStacking.setDirectStackingUser(wallet_1, wallet_1.address, qualifiedName("stacking-pool-v1"), 500);
    result.expectErr().expectUint(20003);

    result = await dataDirectStacking.deleteDirectStackingUser(wallet_1, wallet_1.address);
    result.expectErr().expectUint(20003);

    result = await dataDirectStacking.setSupportedProtocols(wallet_1, [qualifiedName("new-protocol"), qualifiedName("protocol-arkadiko-v1")])
    result.expectErr().expectUint(20003);
  }
});

//-------------------------------------
// Errors 
//-------------------------------------

Clarinet.test({
  name: "data-direct-stacking: direct stacking dependence max is 100%",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let dataDirectStacking = new DataDirectStacking(chain, deployer);

    let result = await dataDirectStacking.setDirectStackingDependence(deployer, 10000 + 1);
    result.expectErr().expectUint(243001);

  }
});
