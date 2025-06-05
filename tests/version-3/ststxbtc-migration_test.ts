import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { CoreBtc } from "../wrappers/stacking-dao-core-btc-helpers.ts";
import { StStxBtcTokenV1, StStxBtcToken } from "../wrappers/ststxbtc-token-helpers.ts";
import { StStxBtcTrackingData } from "../wrappers/ststxbtc-tracking-data-helpers.ts";
import { SBtcToken } from "../wrappers/sbtc-token-helpers.ts";
import { StStxBtcTracking } from "../wrappers/ststxbtc-tracking-helpers.ts";

//-------------------------------------
// Core
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-migration: successful migration",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stStxBtcTokenV1 = new StStxBtcTokenV1(chain, deployer);
    let stStxBtcToken = new StStxBtcToken(chain, deployer);
    let trackingData = new StStxBtcTrackingData(chain, deployer);

    // Mint stStxBtcTokenV1 tokens to wallet_1 and wallet_2
    let result = await stStxBtcTokenV1.mintForProtocol(deployer, 1000, wallet_1.address);
    result.expectOk().expectBool(true);
    result = await stStxBtcTokenV1.mintForProtocol(deployer, 2000, wallet_2.address);
    result.expectOk().expectBool(true);

    // Check initial balances
    let balance = await stStxBtcTokenV1.getBalance(wallet_1.address);
    balance.result.expectOk().expectUintWithDecimals(1000);
    balance = await stStxBtcTokenV1.getBalance(wallet_2.address);
    balance.result.expectOk().expectUintWithDecimals(2000);

    balance = await stStxBtcToken.getBalance(wallet_1.address);
    balance.result.expectOk().expectUintWithDecimals(0);
    balance = await stStxBtcToken.getBalance(wallet_2.address);
    balance.result.expectOk().expectUintWithDecimals(0);

    // Check initial tracking data
    let trackingBalance = await chain.callReadOnlyFn(
      "ststxbtc-tracking-data",
      "get-holder-position",
      [types.principal(wallet_1.address), types.principal(wallet_1.address)],
      deployer.address
    );
    trackingBalance.result.expectTuple().amount.expectUintWithDecimals(1000);
    trackingBalance = await chain.callReadOnlyFn(
      "ststxbtc-tracking-data",
      "get-holder-position",
      [types.principal(wallet_2.address), types.principal(wallet_2.address)],
      deployer.address
    );
    trackingBalance.result.expectTuple().amount.expectUintWithDecimals(2000);
    trackingBalance = await trackingData.getHolderPosition(wallet_1.address, wallet_1.address);
    trackingBalance.result.expectTuple().amount.expectUintWithDecimals(0);
    trackingBalance = await trackingData.getHolderPosition(wallet_2.address, wallet_2.address);
    trackingBalance.result.expectTuple().amount.expectUintWithDecimals(0);

    // Migrate stStxBtcTokenV1 tokens to stStxBtcToken for wallet_1
    let block = chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-migration-v1",
        "migrate-ststxbtc",
        [
          types.list([
            types.principal(wallet_1.address)
          ])
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectList()[0].expectOk().expectBool(true);

    // Self migrate stStxBtcTokenV1 tokens to stStxBtcToken for wallet_2
    block = chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-migration-v1",
        "migrate-self",
        [],
        wallet_2.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Check balances
    balance = await stStxBtcTokenV1.getBalance(wallet_1.address);
    balance.result.expectOk().expectUintWithDecimals(0);
    balance = await stStxBtcTokenV1.getBalance(wallet_2.address);
    balance.result.expectOk().expectUintWithDecimals(0);

    balance = await stStxBtcToken.getBalance(wallet_1.address);
    balance.result.expectOk().expectUintWithDecimals(1000);
    balance = await stStxBtcToken.getBalance(wallet_2.address);
    balance.result.expectOk().expectUintWithDecimals(2000);

    // Check tracking data
    trackingBalance = await chain.callReadOnlyFn(
      "ststxbtc-tracking-data",
      "get-holder-position",
      [types.principal(wallet_1.address), types.principal(wallet_1.address)],
      deployer.address
    );
    trackingBalance.result.expectTuple().amount.expectUintWithDecimals(0);
    trackingBalance = await chain.callReadOnlyFn(
      "ststxbtc-tracking-data",
      "get-holder-position",
      [types.principal(wallet_2.address), types.principal(wallet_2.address)],
      deployer.address
    );
    trackingBalance.result.expectTuple().amount.expectUintWithDecimals(0);
    trackingBalance = await trackingData.getHolderPosition(wallet_1.address, wallet_1.address);
    trackingBalance.result.expectTuple().amount.expectUintWithDecimals(1000);
    trackingBalance = await trackingData.getHolderPosition(wallet_2.address, wallet_2.address);
    trackingBalance.result.expectTuple().amount.expectUintWithDecimals(2000);
  },
});

Clarinet.test({
  name: "ststxbtc-migration: rewards are claimed on migration",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stStxBtcTokenV1 = new StStxBtcTokenV1(chain, deployer);
    let stStxBtcToken = new StStxBtcToken(chain, deployer);
    let sBtcToken = new SBtcToken(chain, deployer);
    let stStxBtcTracking = new StStxBtcTracking(chain, deployer);

    // Mint sBTC tokens for rewards
    let result = await sBtcToken.protocolMint(deployer, 1000, deployer.address);
    result.expectOk().expectBool(true);

    // Mint stStxBtcToken tokens 
    result = await stStxBtcToken.mintForProtocol(deployer, 1000, deployer.address);
    result.expectOk().expectBool(true);

    // Mint stStxBtcTokenV1 tokens to wallet_1 and wallet_2
    result = await stStxBtcTokenV1.mintForProtocol(deployer, 1000, wallet_1.address);
    result.expectOk().expectBool(true);
    result = await stStxBtcTokenV1.mintForProtocol(deployer, 2000, wallet_2.address);
    result.expectOk().expectBool(true);

    // Check initial balances
    let balance = await sBtcToken.getBalance(wallet_1.address);
    balance.result.expectOk().expectUintWithDecimals(0);
    balance = await sBtcToken.getBalance(wallet_2.address);
    balance.result.expectOk().expectUintWithDecimals(0);

    // Add rewards for both tokens
    let block = chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-tracking",
        "add-rewards",
        [types.uint(300 * 100000000)],
        deployer.address
      ),
    ]);
    result = block.receipts[0].result;
    result.expectOk().expectBool(true);

    result = await stStxBtcTracking.addRewards(deployer, 300);
    result.expectOk().expectBool(true);

    // Check pending rewards
    let call = await chain.callReadOnlyFn(
      "ststxbtc-tracking",
      "get-pending-rewards",
      [
        types.principal(wallet_1.address),
        types.principal(wallet_1.address)
      ],
      deployer.address
    )
    call.result.expectOk().expectUintWithDecimals(100, 8);

    call = await chain.callReadOnlyFn(
      "ststxbtc-tracking",
      "get-pending-rewards",
      [
        types.principal(wallet_2.address),
        types.principal(wallet_2.address)
      ],
      deployer.address
    )
    call.result.expectOk().expectUintWithDecimals(200, 8);

    call = await stStxBtcTracking.getPendingRewards(wallet_1.address, wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(0, 8);
    call = await stStxBtcTracking.getPendingRewards(wallet_2.address, wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(0, 8);


    // Migrate stStxBtcTokenV1 tokens to stStxBtcToken for wallet_1
    block = chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-migration-v1",
        "migrate-ststxbtc",
        [
          types.list([
            types.principal(wallet_1.address)
          ])
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectList()[0].expectOk().expectBool(true);

    // Self migrate stStxBtcTokenV1 tokens to stStxBtcToken for wallet_2
    block = chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-migration-v1",
        "migrate-self",
        [],
        wallet_2.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Check balances
    balance = await sBtcToken.getBalance(wallet_1.address);
    balance.result.expectOk().expectUintWithDecimals(100, 8);
    balance = await sBtcToken.getBalance(wallet_2.address);
    balance.result.expectOk().expectUintWithDecimals(200, 8);

    // Check pending rewards
    call = await chain.callReadOnlyFn(
      "ststxbtc-tracking",
      "get-pending-rewards",
      [
        types.principal(wallet_1.address),
        types.principal(wallet_1.address)
      ],
      deployer.address
    )
    call.result.expectOk().expectUintWithDecimals(0, 8);

    call = await chain.callReadOnlyFn(
      "ststxbtc-tracking",
      "get-pending-rewards",
      [
        types.principal(wallet_2.address),
        types.principal(wallet_2.address)
      ],
      deployer.address
    )
    call.result.expectOk().expectUintWithDecimals(0, 8);

    call = await stStxBtcTracking.getPendingRewards(wallet_1.address, wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(0, 8);
    call = await stStxBtcTracking.getPendingRewards(wallet_2.address, wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(0, 8);

  },
});

//-------------------------------------
// Errors
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-migration: unauthorized caller",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-migration-v1",
        "migrate-ststxbtc",
        [
          types.list([
            types.principal(wallet_1.address)
          ])
        ],
        wallet_1.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);
  },
});

Clarinet.test({
  name: "ststxbtc-migration: unsupported position",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let coreBtc = new CoreBtc(chain, deployer);

    // Deposit for stSTXbtc
    let result = await coreBtc.deposit(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Set active position
    let block = chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-tracking-data",
        "set-supported-positions",
        [
          types.principal(wallet_1.address),
          types.bool(true),
          types.principal(deployer.address),
          types.uint(1000),
          types.uint(0)
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    // Try to migrate tokens
    block = chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-migration-v1",
        "migrate-ststxbtc",
        [
          types.list([
            types.principal(wallet_1.address)
          ])
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectList()[0].expectErr().expectUint(10401);
  },
});
