import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "../wrappers/tests-utils.ts";
qualifiedName("");

import { StStxWithdrawNft } from "../wrappers/ststx-withdraw-nft-helpers.ts";

//-------------------------------------
// Getters
//-------------------------------------

Clarinet.test({
  name: "ststx-withdraw-nft: can get token info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxWithdrawNft = new StStxWithdrawNft(chain, deployer);

    let call = await stStxWithdrawNft.getBaseUri();
    call.result.expectAscii("ipfs://");

    call = await stStxWithdrawNft.getLastTokenId();
    call.result.expectOk().expectUint(100000);

    call = await stStxWithdrawNft.getOwner(69);
    call.result.expectOk().expectNone();

    call = await stStxWithdrawNft.getTokenUri(420);
    call.result.expectOk().expectSome().expectAscii("ipfs://420.json");
  },
});

//-------------------------------------
// Mint / Burn
//-------------------------------------

Clarinet.test({
  name: "ststx-withdraw-nft: can mint/burn as protocol",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stStxWithdrawNft = new StStxWithdrawNft(chain, deployer);

    let call = await stStxWithdrawNft.getLastTokenId();
    call.result.expectOk().expectUint(100000);

    call = await stStxWithdrawNft.getOwner(0);
    call.result.expectOk().expectNone();

    let result = await stStxWithdrawNft.mintForProtocol(
      deployer,
      wallet_1.address
    );
    result.expectOk().expectBool(true);

    call = await stStxWithdrawNft.getLastTokenId();
    call.result.expectOk().expectUint(100000 + 1);

    call = await stStxWithdrawNft.getOwner(100000);
    call.result.expectOk().expectSome().expectPrincipal(wallet_1.address);

    result = await stStxWithdrawNft.burnForProtocol(deployer, 100000);
    result.expectOk().expectBool(true);

    call = await stStxWithdrawNft.getLastTokenId();
    call.result.expectOk().expectUint(100000 + 1);

    call = await stStxWithdrawNft.getOwner(100000);
    call.result.expectOk().expectNone();
  },
});

//-------------------------------------
// Transfer
//-------------------------------------

Clarinet.test({
  name: "ststx-withdraw-nft: can transfer token",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stStxWithdrawNft = new StStxWithdrawNft(chain, deployer);

    let call = await stStxWithdrawNft.getBalance(wallet_1.address);
    call.result.expectUint(0);

    let result = await stStxWithdrawNft.mintForProtocol(
      deployer,
      wallet_1.address
    );
    result.expectOk().expectBool(true);

    call = await stStxWithdrawNft.getBalance(wallet_1.address);
    call.result.expectUint(1);

    call = await stStxWithdrawNft.getBalance(wallet_2.address);
    call.result.expectUint(0);

    result = await stStxWithdrawNft.transfer(
      wallet_1,
      100000,
      wallet_2.address
    );
    result.expectOk().expectBool(true);

    call = await stStxWithdrawNft.getBalance(wallet_1.address);
    call.result.expectUint(0);

    call = await stStxWithdrawNft.getBalance(wallet_2.address);
    call.result.expectUint(1);

    call = await stStxWithdrawNft.getLastTokenId();
    call.result.expectOk().expectUint(100000 + 1);

    call = await stStxWithdrawNft.getOwner(100000);
    call.result.expectOk().expectSome().expectPrincipal(wallet_2.address);
  },
});

//-------------------------------------
// Marketplace
//-------------------------------------

Clarinet.test({
  name: "ststx-withdraw-nft: can list/unlist and buy on marketplace",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stStxWithdrawNft = new StStxWithdrawNft(chain, deployer);

    let result = await stStxWithdrawNft.mintForProtocol(
      deployer,
      wallet_1.address
    );
    result.expectOk().expectBool(true);

    result = await stStxWithdrawNft.listInUstx(wallet_1, 100000, 10);
    result.expectOk().expectBool(true);

    let call = await stStxWithdrawNft.getListingInUstx(100000);
    call.result
      .expectSome()
      .expectTuple()
      ["commission"].expectPrincipal(qualifiedName("marketplace-commission"));
    call.result.expectSome().expectTuple()["price"].expectUintWithDecimals(10);

    // Can not transfer while listed
    result = await stStxWithdrawNft.transfer(
      wallet_1,
      100000,
      wallet_2.address
    );
    result.expectErr().expectUint(1106);

    result = await stStxWithdrawNft.unlistInUstx(wallet_1, 100000);
    result.expectOk().expectBool(true);

    call = await stStxWithdrawNft.getListingInUstx(100000);
    call.result.expectNone();

    result = await stStxWithdrawNft.listInUstx(wallet_1, 100000, 20);
    result.expectOk().expectBool(true);

    result = await stStxWithdrawNft.buyInUstx(deployer, 100000);
    result.expectOk().expectBool(true);

    call = await stStxWithdrawNft.getListingInUstx(100000);
    call.result.expectNone();

    call = await stStxWithdrawNft.getBalance(deployer.address);
    call.result.expectUint(1);
  },
});

//-------------------------------------
// Admin
//-------------------------------------

Clarinet.test({
  name: "ststx-withdraw-nft: can set base URI",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxWithdrawNft = new StStxWithdrawNft(chain, deployer);

    let call = await stStxWithdrawNft.getBaseUri();
    call.result.expectAscii("ipfs://");

    call = await stStxWithdrawNft.getTokenUri(420);
    call.result.expectOk().expectSome().expectAscii("ipfs://420.json");

    let result = await stStxWithdrawNft.setBaseUri(deployer, "ipfs://123/");
    result.expectOk().expectBool(true);

    call = await stStxWithdrawNft.getBaseUri();
    call.result.expectAscii("ipfs://123/");

    call = await stStxWithdrawNft.getTokenUri(420);
    call.result.expectOk().expectSome().expectAscii("ipfs://123/420.json");
  },
});

//-------------------------------------
// Error
//-------------------------------------

Clarinet.test({
  name: "ststx-withdraw-nft: can not transfer is sender is not tx-sender",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stStxWithdrawNft = new StStxWithdrawNft(chain, deployer);

    let result = await stStxWithdrawNft.mintForProtocol(
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
  name: "ststx-withdraw-nft: can not burn NFT for which no owner found",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stStxWithdrawNft = new StStxWithdrawNft(chain, deployer);

    let result = await stStxWithdrawNft.burnForProtocol(deployer, 10);
    result.expectErr().expectUint(1107);
  },
});

//-------------------------------------
// Access
//-------------------------------------

Clarinet.test({
  name: "ststx-withdraw-nft: only protocol can set base URI, mint and burn for protocol",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stStxWithdrawNft = new StStxWithdrawNft(chain, deployer);

    let result = await stStxWithdrawNft.mintForProtocol(
      deployer,
      deployer.address
    );
    result.expectOk().expectBool(true);

    result = await stStxWithdrawNft.setBaseUri(wallet_1, "test-uri");
    result.expectErr().expectUint(20003);

    result = await stStxWithdrawNft.mintForProtocol(wallet_1, wallet_1.address);
    result.expectErr().expectUint(20003);

    result = await stStxWithdrawNft.burnForProtocol(wallet_1, 100000);
    result.expectErr().expectUint(20003);
  },
});
