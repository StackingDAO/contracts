import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "../wrappers/tests-utils.ts";
qualifiedName("");

import { StStxBtcWithdrawNft } from "../wrappers/ststxbtc-withdraw-nft-helpers.ts";

//-------------------------------------
// Getters
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-withdraw-nft: can get token info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxBtcWithdrawNft = new StStxBtcWithdrawNft(chain, deployer);

    let call = await stStxBtcWithdrawNft.getBaseUri();
    call.result.expectAscii("ipfs://");

    call = await stStxBtcWithdrawNft.getLastTokenId();
    call.result.expectOk().expectUint(0);

    call = await stStxBtcWithdrawNft.getOwner(69);
    call.result.expectOk().expectNone();

    call = await stStxBtcWithdrawNft.getTokenUri(420);
    call.result.expectOk().expectSome().expectAscii("ipfs://420.json");
  },
});

//-------------------------------------
// Mint / Burn
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-withdraw-nft: can mint/burn as protocol",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stStxBtcWithdrawNft = new StStxBtcWithdrawNft(chain, deployer);

    let call = await stStxBtcWithdrawNft.getLastTokenId();
    call.result.expectOk().expectUint(0);

    call = await stStxBtcWithdrawNft.getOwner(0);
    call.result.expectOk().expectNone();

    let result = await stStxBtcWithdrawNft.mintForProtocol(
      deployer,
      wallet_1.address
    );
    result.expectOk().expectBool(true);

    call = await stStxBtcWithdrawNft.getLastTokenId();
    call.result.expectOk().expectUint(1);

    call = await stStxBtcWithdrawNft.getOwner(0);
    call.result.expectOk().expectSome().expectPrincipal(wallet_1.address);

    result = await stStxBtcWithdrawNft.burnForProtocol(deployer, 0);
    result.expectOk().expectBool(true);

    call = await stStxBtcWithdrawNft.getLastTokenId();
    call.result.expectOk().expectUint(1);

    call = await stStxBtcWithdrawNft.getOwner(1);
    call.result.expectOk().expectNone();
  },
});

//-------------------------------------
// Transfer
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-withdraw-nft: can transfer token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stStxBtcWithdrawNft = new StStxBtcWithdrawNft(chain, deployer);

    let call = await stStxBtcWithdrawNft.getBalance(wallet_1.address);
    call.result.expectUint(0);

    let result = await stStxBtcWithdrawNft.mintForProtocol(
      deployer,
      wallet_1.address
    );
    result.expectOk().expectBool(true);

    call = await stStxBtcWithdrawNft.getBalance(wallet_1.address);
    call.result.expectUint(1);

    call = await stStxBtcWithdrawNft.getBalance(wallet_2.address);
    call.result.expectUint(0);

    result = await stStxBtcWithdrawNft.transfer(wallet_1, 0, wallet_2.address);
    result.expectOk().expectBool(true);

    call = await stStxBtcWithdrawNft.getBalance(wallet_1.address);
    call.result.expectUint(0);

    call = await stStxBtcWithdrawNft.getBalance(wallet_2.address);
    call.result.expectUint(1);

    call = await stStxBtcWithdrawNft.getLastTokenId();
    call.result.expectOk().expectUint(1);

    call = await stStxBtcWithdrawNft.getOwner(0);
    call.result.expectOk().expectSome().expectPrincipal(wallet_2.address);
  },
});

//-------------------------------------
// Marketplace
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-withdraw-nft: can list/unlist and buy on marketplace",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stStxBtcWithdrawNft = new StStxBtcWithdrawNft(chain, deployer);

    let result = await stStxBtcWithdrawNft.mintForProtocol(
      deployer,
      wallet_1.address
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcWithdrawNft.listInUstx(wallet_1, 0, 10);
    result.expectOk().expectBool(true);

    let call = await stStxBtcWithdrawNft.getListingInUstx(0);
    call.result
      .expectSome()
      .expectTuple()
      ["commission"].expectPrincipal(qualifiedName("marketplace-commission"));
    call.result.expectSome().expectTuple()["price"].expectUintWithDecimals(10);

    // Can not transfer while listed
    result = await stStxBtcWithdrawNft.transfer(wallet_1, 0, wallet_2.address);
    result.expectErr().expectUint(1106);

    result = await stStxBtcWithdrawNft.unlistInUstx(wallet_1, 0);
    result.expectOk().expectBool(true);

    call = await stStxBtcWithdrawNft.getListingInUstx(0);
    call.result.expectNone();

    result = await stStxBtcWithdrawNft.listInUstx(wallet_1, 0, 20);
    result.expectOk().expectBool(true);

    result = await stStxBtcWithdrawNft.buyInUstx(deployer, 0);
    result.expectOk().expectBool(true);

    call = await stStxBtcWithdrawNft.getListingInUstx(0);
    call.result.expectNone();

    call = await stStxBtcWithdrawNft.getBalance(deployer.address);
    call.result.expectUint(1);
  },
});

Clarinet.test({
  name: "ststxbtc-withdraw-nft: will unlist on burn",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stStxBtcWithdrawNft = new StStxBtcWithdrawNft(chain, deployer);

    let result = await stStxBtcWithdrawNft.mintForProtocol(
      deployer,
      wallet_1.address
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcWithdrawNft.listInUstx(wallet_1, 0, 10);
    result.expectOk().expectBool(true);

    let call = await stStxBtcWithdrawNft.getListingInUstx(0);
    call.result
      .expectSome()
      .expectTuple()
      ["commission"].expectPrincipal(qualifiedName("marketplace-commission"));
    call.result.expectSome().expectTuple()["price"].expectUintWithDecimals(10);

    // Can not transfer while listed
    result = await stStxBtcWithdrawNft.burnForProtocol(deployer, 0);
    result.expectOk().expectBool(true);

    call = await stStxBtcWithdrawNft.getListingInUstx(0);
    call.result.expectNone();
  },
});

//-------------------------------------
// Admin
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-withdraw-nft: can set base URI",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxBtcWithdrawNft = new StStxBtcWithdrawNft(chain, deployer);

    let call = await stStxBtcWithdrawNft.getBaseUri();
    call.result.expectAscii("ipfs://");

    call = await stStxBtcWithdrawNft.getTokenUri(420);
    call.result.expectOk().expectSome().expectAscii("ipfs://420.json");

    let result = await stStxBtcWithdrawNft.setBaseUri(deployer, "ipfs://123/");
    result.expectOk().expectBool(true);

    call = await stStxBtcWithdrawNft.getBaseUri();
    call.result.expectAscii("ipfs://123/");

    call = await stStxBtcWithdrawNft.getTokenUri(420);
    call.result.expectOk().expectSome().expectAscii("ipfs://123/420.json");
  },
});

//-------------------------------------
// Error
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-withdraw-nft: can not transfer is sender is not tx-sender",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stStxBtcWithdrawNft = new StStxBtcWithdrawNft(chain, deployer);

    let result = await stStxBtcWithdrawNft.mintForProtocol(
      deployer,
      deployer.address
    );
    result.expectOk().expectBool(true);

    let block = chain.mineBlock([
      Tx.contractCall(
        "ststx-withdraw-nft",
        "transfer",
        [
          types.uint(0),
          types.principal(wallet_1.address),
          types.principal(wallet_2.address),
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(1101);
  },
});

Clarinet.test({
  name: "ststxbtc-withdraw-nft: can not burn NFT for which no owner found",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxBtcWithdrawNft = new StStxBtcWithdrawNft(chain, deployer);

    let result = await stStxBtcWithdrawNft.burnForProtocol(deployer, 10);
    result.expectErr().expectUint(1107);
  },
});

//-------------------------------------
// Access
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-withdraw-nft: only protocol can set base URI, mint and burn for protocol",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stStxBtcWithdrawNft = new StStxBtcWithdrawNft(chain, deployer);

    let result = await stStxBtcWithdrawNft.mintForProtocol(
      deployer,
      deployer.address
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcWithdrawNft.setBaseUri(wallet_1, "test-uri");
    result.expectErr().expectUint(20003);

    result = await stStxBtcWithdrawNft.mintForProtocol(
      wallet_1,
      wallet_1.address
    );
    result.expectErr().expectUint(20003);

    result = await stStxBtcWithdrawNft.burnForProtocol(wallet_1, 0);
    result.expectErr().expectUint(20003);
  },
});
