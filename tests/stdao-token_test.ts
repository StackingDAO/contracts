import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "./helpers/tests-utils.ts";
qualifiedName("")

import { SDAOToken } from './helpers/sdao-token-helpers.ts';

//-------------------------------------
// Getters 
//-------------------------------------

Clarinet.test({
  name: "sdao-token: can get token info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_4 = accounts.get("wallet_4")!

    let sDaoToken = new SDAOToken(chain, deployer);

    let result = sDaoToken.mintForProtocol(deployer, 100, deployer.address);
    result.expectOk().expectBool(true);

    let call = await sDaoToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(100);

    call = await sDaoToken.getName();
    call.result.expectOk().expectAscii("StackingDAO Token");

    call = await sDaoToken.getSymbol();
    call.result.expectOk().expectAscii("sDAO");

    call = await sDaoToken.getDecimals();
    call.result.expectOk().expectUint(6);

    call = await sDaoToken.getBalance(deployer.address);
    call.result.expectOk().expectUintWithDecimals(100);

    call = await sDaoToken.getBalance(wallet_4.address);
    call.result.expectOk().expectUintWithDecimals(0);

    call = await sDaoToken.getTokenUri();
    call.result.expectOk().expectSome().expectUtf8("");
  }
});

//-------------------------------------
// Core 
//-------------------------------------

Clarinet.test({
  name: "sdao-token: can mint/burn as protocol",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let sDaoToken = new SDAOToken(chain, deployer);

    let call = await sDaoToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(0);

    call = await sDaoToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(0);

    let result = await sDaoToken.mintForProtocol(deployer, 100, wallet_1.address);
    result.expectOk().expectBool(true);

    call = await sDaoToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(100);

    call = await sDaoToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(100);

    result = await sDaoToken.burnForProtocol(deployer, 20, wallet_1.address);
    result.expectOk().expectBool(true);

    call = await sDaoToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(80);

    call = await sDaoToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(80);

    result = await sDaoToken.burn(wallet_1, 30);
    result.expectOk().expectBool(true);

    call = await sDaoToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(50);

    call = await sDaoToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(50);
  }
});

Clarinet.test({
  name: "sdao-token: can transfer token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let sDaoToken = new SDAOToken(chain, deployer);

    let result = await sDaoToken.mintForProtocol(deployer, 100, wallet_1.address);
    result.expectOk().expectBool(true);

    result = await sDaoToken.transfer(wallet_1, 20, wallet_2.address);
    result.expectOk().expectBool(true);

    let call = await sDaoToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(100);

    call = await sDaoToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(80);

    call = await sDaoToken.getBalance(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(20);
  }
});

//-------------------------------------
// Admin 
//-------------------------------------

Clarinet.test({
  name: "sdao-token: can set token URI",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let sDaoToken = new SDAOToken(chain, deployer);

    let call = await sDaoToken.getTokenUri();
    call.result.expectOk().expectSome().expectUtf8("");

    let result = await sDaoToken.setTokenUri(deployer, "test-uri");
    result.expectOk().expectBool(true)

    call = await sDaoToken.getTokenUri();
    call.result.expectOk().expectSome().expectUtf8("test-uri");
  }
});

//-------------------------------------
// Error 
//-------------------------------------

Clarinet.test({
  name: "sdao-token: can not transfer is sender is not tx-sender, or sender has not enough",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let sDaoToken = new SDAOToken(chain, deployer);

    let block = chain.mineBlock([
      Tx.contractCall("sdao-token", "transfer", [
        types.uint(100 * 1000000),
        types.principal(wallet_1.address),
        types.principal(wallet_2.address),
        types.none()
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(1401);

    let result = await sDaoToken.transfer(wallet_1, 20, wallet_1.address);
    result.expectErr().expectUint(2);
  }
});

//-------------------------------------
// Access 
//-------------------------------------

Clarinet.test({
  name: "sdao-token: only protocol can set token URI, mint and burn for protocol",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let sDaoToken = new SDAOToken(chain, deployer);

    let result = await sDaoToken.setTokenUri(wallet_1, "test-uri");
    result.expectErr().expectUint(20003);

    result = await sDaoToken.mintForProtocol(wallet_1, 100, wallet_1.address);
    result.expectErr().expectUint(20003);

    result = await sDaoToken.burnForProtocol(wallet_1, 100, deployer.address);
    result.expectErr().expectUint(20003);
  }
});
