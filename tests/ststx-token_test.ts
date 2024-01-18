import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "./helpers/tests-utils.ts";
qualifiedName("")

import { StStxToken } from './helpers/ststx-token-helpers.ts';

//-------------------------------------
// Getters 
//-------------------------------------

Clarinet.test({
  name: "ststx-token: can get token info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxToken = new StStxToken(chain, deployer);

    let call = await stStxToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(0);

    call = await stStxToken.getName();
    call.result.expectOk().expectAscii("Stacked STX Token");

    call = await stStxToken.getSymbol();
    call.result.expectOk().expectAscii("stSTX");

    call = await stStxToken.getDecimals();
    call.result.expectOk().expectUint(6);

    call = await stStxToken.getBalance(deployer.address);
    call.result.expectOk().expectUintWithDecimals(0);

    call = await stStxToken.getTokenUri();
    call.result.expectOk().expectSome().expectUtf8("");
  }
});

//-------------------------------------
// Core 
//-------------------------------------

Clarinet.test({
  name: "ststx-token: can mint/burn as protocol",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stStxToken = new StStxToken(chain, deployer);

    let call = await stStxToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(0);

    call = await stStxToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(0);

    let result = await stStxToken.mintForProtocol(deployer, 100, wallet_1.address);
    result.expectOk().expectBool(true);

    call = await stStxToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(100);

    call = await stStxToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(100);

    result = await stStxToken.burnForProtocol(deployer, 20, wallet_1.address);
    result.expectOk().expectBool(true);

    call = await stStxToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(80);

    call = await stStxToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(80);

    result = await stStxToken.burn(wallet_1, 30);
    result.expectOk().expectBool(true);

    call = await stStxToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(50);

    call = await stStxToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(50);
  }
});

Clarinet.test({
  name: "ststx-token: can transfer token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stStxToken = new StStxToken(chain, deployer);

    let result = await stStxToken.mintForProtocol(deployer, 100, wallet_1.address);
    result.expectOk().expectBool(true);

    result = await stStxToken.transfer(wallet_1, 20, wallet_2.address);
    result.expectOk().expectBool(true);

    let call = await stStxToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(100);

    call = await stStxToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(80);

    call = await stStxToken.getBalance(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(20);
  }
});

//-------------------------------------
// Admin 
//-------------------------------------

Clarinet.test({
  name: "ststx-token: can set token URI",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxToken = new StStxToken(chain, deployer);

    let call = await stStxToken.getTokenUri();
    call.result.expectOk().expectSome().expectUtf8("");

    let result = await stStxToken.setTokenUri(deployer, "test-uri");
    result.expectOk().expectBool(true)

    call = await stStxToken.getTokenUri();
    call.result.expectOk().expectSome().expectUtf8("test-uri");
  }
});

//-------------------------------------
// Error 
//-------------------------------------

Clarinet.test({
  name: "ststx-token: can not transfer is sender is not tx-sender, or sender has not enough",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stStxToken = new StStxToken(chain, deployer);

    let block = chain.mineBlock([
      Tx.contractCall("ststx-token", "transfer", [
        types.uint(100 * 1000000),
        types.principal(wallet_1.address),
        types.principal(wallet_2.address),
        types.none()
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(1401);

    let result = await stStxToken.transfer(wallet_1, 20, wallet_1.address);
    result.expectErr().expectUint(2);
  }
});

//-------------------------------------
// Access 
//-------------------------------------

Clarinet.test({
  name: "ststx-token: only protocol can set token URI, mint and burn for protocol",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stStxToken = new StStxToken(chain, deployer);

    let result = await stStxToken.setTokenUri(wallet_1, "test-uri");
    result.expectErr().expectUint(20003);

    result = await stStxToken.mintForProtocol(wallet_1, 100, wallet_1.address);
    result.expectErr().expectUint(20003);

    result = await stStxToken.burnForProtocol(wallet_1, 100, deployer.address);
    result.expectErr().expectUint(20003);
  }
});
