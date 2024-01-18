import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "./helpers/tests-utils.ts";
qualifiedName("")

import { SDAOToken } from './helpers/sdao-token-helpers.ts';
import { Tax } from './helpers/tax-helpers.ts';
import { Core } from './helpers/stacking-dao-core-helpers.ts';

//-------------------------------------
// Tax 
//-------------------------------------

Clarinet.test({
  name: "tax: handle tax",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let sDaoToken = new SDAOToken(chain, deployer);
    let tax = new Tax(chain, deployer);
    let core = new Core(chain, deployer);

    // Get sDAO for liquidity
    let result = await sDaoToken.mintForProtocol(deployer, 1000, deployer.address);
    result.expectOk().expectBool(true);

    // Create sDAO/STX pair
    let block = chain.mineBlock([
      Tx.contractCall("swap", "create-pair", [
        types.principal(qualifiedName("sdao-token")),
        types.principal(qualifiedName("wstx-token")),
        types.principal(qualifiedName("swap-lp-token")),
        types.uint(100),
        types.ascii("sDAO-STX"),
        types.uint(100 * 1000000),
        types.uint(100 * 1000000),

      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Transfer 100 STX to contract
    block = chain.mineBlock([
      Tx.transferSTX(100 * 1000000, qualifiedName("tax-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Contract balances
    let call: any = core.getStxBalance(qualifiedName("tax-v1"));
    call.result.expectUintWithDecimals(100);

    call = sDaoToken.getBalance(qualifiedName("tax-v1"));
    call.result.expectOk().expectUintWithDecimals(0);

    call = chain.callReadOnlyFn("swap-lp-token", "get-balance", [
      types.principal(qualifiedName("tax-v1"))
    ], deployer.address)
    call.result.expectOk().expectUintWithDecimals(0);

    // Handle tax
    result = await tax.handleTax(deployer);
    result.expectOk().expectBool(true);

    // Contract balances
    call = core.getStxBalance(qualifiedName("tax-v1"));
    call.result.expectUintWithDecimals(0);

    call = sDaoToken.getBalance(qualifiedName("tax-v1"));
    call.result.expectOk().expectUintWithDecimals(0);

    call = chain.callReadOnlyFn("swap-lp-token", "get-balance", [
      types.principal(qualifiedName("tax-v1"))
    ], deployer.address)
    call.result.expectOk().expectUintWithDecimals(99.623776);
  }
});

//-------------------------------------
// Keeper 
//-------------------------------------

Clarinet.test({
  name: "tax: keeper functions",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let tax = new Tax(chain, deployer);

    let call = await tax.checkJob();
    call.result.expectOk().expectBool(false);

    let result = await tax.initialize(deployer);
    result.expectOk().expectBool(true);

    result = await tax.runJob(deployer);
    result.expectErr().expectUint(21001);

    // Transfer 100 STX to contract
    let block = chain.mineBlock([
      Tx.transferSTX(100 * 1000000, qualifiedName("tax-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    call = await tax.checkJob();
    call.result.expectOk().expectBool(true);

    // Can not swap as pair not created
    result = await tax.runJob(deployer);
    result.expectErr().expectUint(21002);
  }
});

//-------------------------------------
// Admin 
//-------------------------------------

Clarinet.test({
  name: "tax: protocol can retreive tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let tax = new Tax(chain, deployer);
    let sDaoToken = new SDAOToken(chain, deployer);
    let core = new Core(chain, deployer);

    // Transfer 100 STX to contract
    let block = chain.mineBlock([
      Tx.transferSTX(100 * 1000000, qualifiedName("tax-v1"), deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Transfer 100 sDAO to contract
    let result = await sDaoToken.mintForProtocol(deployer, 100, qualifiedName("tax-v1"));
    result.expectOk().expectBool(true);

    // Contract balances
    let call = core.getStxBalance(qualifiedName("tax-v1"));
    call.result.expectUintWithDecimals(100);

    call = sDaoToken.getBalance(qualifiedName("tax-v1"));
    call.result.expectOk().expectUintWithDecimals(100);

    // Retreive tokens
    result = await tax.retreiveStxTokens(deployer, 10, deployer.address);
    result.expectOk().expectUintWithDecimals(10);

    result = await tax.retreiveTokens(deployer, "sdao-token", 10, deployer.address);
    result.expectOk().expectUintWithDecimals(10);

    // Contract balances
    call = core.getStxBalance(qualifiedName("tax-v1"));
    call.result.expectUintWithDecimals(90);

    call = sDaoToken.getBalance(qualifiedName("tax-v1"));
    call.result.expectOk().expectUintWithDecimals(90);
  }
});

Clarinet.test({
  name: "tax: protocol can set min amount to handle",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let tax = new Tax(chain, deployer);

    let result = await tax.setMinBalanceToHandle(deployer, 500);
    result.expectOk().expectBool(true);

    let call = await tax.getMinBalanceToHandle();
    call.result.expectUintWithDecimals(500);
  }
});

Clarinet.test({
  name: "tax: protocol can set percentage to swap",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let tax = new Tax(chain, deployer);

    let result = await tax.setPercentageToSwap(deployer, 0.2);
    result.expectOk().expectBool(true);

    let call = await tax.getPercentageToSwap();
    call.result.expectUint(0.2 * 10000);
  }
});

//-------------------------------------
// Access 
//-------------------------------------

Clarinet.test({
  name: "tax: only protocol can retreive tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let tax = new Tax(chain, deployer);

    let result = await tax.retreiveStxTokens(wallet_1, 10, wallet_1.address);
    result.expectErr().expectUint(20003);

    result = await tax.retreiveTokens(wallet_1, "sdao-token", 10, wallet_1.address);
    result.expectErr().expectUint(20003);
  }
});

Clarinet.test({
  name: "tax: only protocol can set min amount to handle and percentage to swap",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let tax = new Tax(chain, deployer);

    let result = await tax.setMinBalanceToHandle(wallet_1, 500);
    result.expectErr().expectUint(20003);

    result = await tax.setPercentageToSwap(wallet_1, 0.2);
    result.expectErr().expectUint(20003);
  }
});
