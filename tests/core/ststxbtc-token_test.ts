import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "../wrappers/tests-utils.ts";
qualifiedName("");

import { StStxBtcToken } from "../wrappers/ststxbtc-token-helpers.ts";
import { StStxBtcTracking } from "../wrappers/ststxbtc-tracking-helpers.ts";
import { StStxBtcTrackingData } from "../wrappers/ststxbtc-tracking-data-helpers.ts";

//-------------------------------------
// Getters
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-token: can get token info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxBtcToken = new StStxBtcToken(chain, deployer);

    let call = await stStxBtcToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(0);

    call = await stStxBtcToken.getName();
    call.result.expectOk().expectAscii("Stacked STX BTC Token");

    call = await stStxBtcToken.getSymbol();
    call.result.expectOk().expectAscii("stSTXbtc");

    call = await stStxBtcToken.getDecimals();
    call.result.expectOk().expectUint(6);

    call = await stStxBtcToken.getBalance(deployer.address);
    call.result.expectOk().expectUintWithDecimals(0);

    call = await stStxBtcToken.getTokenUri();
    call.result.expectOk().expectSome().expectUtf8("");
  },
});

//-------------------------------------
// Core
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-token: can mint/burn as protocol",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stStxBtcToken = new StStxBtcToken(chain, deployer);

    let call = await stStxBtcToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(0);

    call = await stStxBtcToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(0);

    let result = await stStxBtcToken.mintForProtocol(
      deployer,
      100,
      wallet_1.address
    );
    result.expectOk().expectBool(true);

    call = await stStxBtcToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(100);

    call = await stStxBtcToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(100);

    result = await stStxBtcToken.burnForProtocol(
      deployer,
      20,
      wallet_1.address
    );
    result.expectOk().expectBool(true);

    call = await stStxBtcToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(80);

    call = await stStxBtcToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(80);

    result = await stStxBtcToken.burn(wallet_1, 30);
    result.expectOk().expectBool(true);

    call = await stStxBtcToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(50);

    call = await stStxBtcToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(50);
  },
});

Clarinet.test({
  name: "ststxbtc-token: can transfer token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stStxBtcToken = new StStxBtcToken(chain, deployer);

    let result = await stStxBtcToken.mintForProtocol(
      deployer,
      100,
      wallet_1.address
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcToken.transfer(wallet_1, 20, wallet_2.address);
    result.expectOk().expectBool(true);

    let call = await stStxBtcToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(100);

    call = await stStxBtcToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(80);

    call = await stStxBtcToken.getBalance(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(20);
  },
});

//-------------------------------------
// Tracking
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-token: token mint/burn/transfer updates tracking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stStxBtcToken = new StStxBtcToken(chain, deployer);
    let stStxBtcTracking = new StStxBtcTracking(chain, deployer);
    let stStxBtcTrackingData = new StStxBtcTrackingData(chain, deployer);

    // Mint for protocol
    let result = await stStxBtcToken.mintForProtocol(
      deployer,
      100,
      wallet_1.address
    );
    result.expectOk().expectBool(true);

    let call = await stStxBtcTrackingData.getTotalSupply();
    call.result.expectUintWithDecimals(100);

    call = await stStxBtcTrackingData.getHolderPosition(
      wallet_1.address,
      wallet_1.address
    );
    call.result.expectTuple()["amount"].expectUintWithDecimals(100);
    call.result.expectTuple()["cumm-reward"].expectUintWithDecimals(0);

    // Burn for protocol
    result = await stStxBtcToken.burnForProtocol(
      deployer,
      20,
      wallet_1.address
    );
    result.expectOk().expectBool(true);

    call = await stStxBtcTrackingData.getTotalSupply();
    call.result.expectUintWithDecimals(100 - 20);

    call = await stStxBtcTrackingData.getHolderPosition(
      wallet_1.address,
      wallet_1.address
    );
    call.result.expectTuple()["amount"].expectUintWithDecimals(100 - 20);
    call.result.expectTuple()["cumm-reward"].expectUintWithDecimals(0);

    // Burn
    result = await stStxBtcToken.burn(wallet_1, 30);
    result.expectOk().expectBool(true);

    call = await stStxBtcTrackingData.getTotalSupply();
    call.result.expectUintWithDecimals(100 - 20 - 30);

    call = await stStxBtcTrackingData.getHolderPosition(
      wallet_1.address,
      wallet_1.address
    );
    call.result.expectTuple()["amount"].expectUintWithDecimals(100 - 20 - 30);
    call.result.expectTuple()["cumm-reward"].expectUintWithDecimals(0);

    // Transfer
    result = await stStxBtcToken.transfer(wallet_1, 10, deployer.address);
    result.expectOk().expectBool(true);

    call = await stStxBtcTrackingData.getTotalSupply();
    call.result.expectUintWithDecimals(100 - 20 - 30);

    call = await stStxBtcTrackingData.getHolderPosition(
      wallet_1.address,
      wallet_1.address
    );
    call.result
      .expectTuple()
      ["amount"].expectUintWithDecimals(100 - 20 - 30 - 10);
    call.result.expectTuple()["cumm-reward"].expectUintWithDecimals(0);
  },
});

//-------------------------------------
// Admin
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-token: can set token URI",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxBtcToken = new StStxBtcToken(chain, deployer);

    let call = await stStxBtcToken.getTokenUri();
    call.result.expectOk().expectSome().expectUtf8("");

    let result = await stStxBtcToken.setTokenUri(deployer, "test-uri");
    result.expectOk().expectBool(true);

    call = await stStxBtcToken.getTokenUri();
    call.result.expectOk().expectSome().expectUtf8("test-uri");
  },
});

//-------------------------------------
// Error
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-token: can not transfer is sender is not tx-sender, or sender has not enough",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stStxBtcToken = new StStxBtcToken(chain, deployer);

    let block = chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-token",
        "transfer",
        [
          types.uint(100 * 1000000),
          types.principal(wallet_1.address),
          types.principal(wallet_2.address),
          types.none(),
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(1401);

    let result = await stStxBtcToken.transfer(wallet_1, 20, wallet_1.address);
    result.expectErr().expectUint(2);
  },
});

//-------------------------------------
// Access
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-token: only protocol can set token URI, mint and burn for protocol",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stStxBtcToken = new StStxBtcToken(chain, deployer);

    let result = await stStxBtcToken.setTokenUri(wallet_1, "test-uri");
    result.expectErr().expectUint(20003);

    result = await stStxBtcToken.mintForProtocol(
      wallet_1,
      100,
      wallet_1.address
    );
    result.expectErr().expectUint(20003);

    result = await stStxBtcToken.burnForProtocol(
      wallet_1,
      100,
      deployer.address
    );
    result.expectErr().expectUint(20003);
  },
});
