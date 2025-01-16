import {
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "./tests-utils.ts";

// ---------------------------------------------------------
// stSTXbtc withdraw NFT
// ---------------------------------------------------------

class StStxBtcWithdrawNft {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getBaseUri() {
    return this.chain.callReadOnlyFn(
      "ststxbtc-withdraw-nft",
      "get-base-token-uri",
      [],
      this.deployer.address
    );
  }

  getBalance(account: string) {
    return this.chain.callReadOnlyFn(
      "ststxbtc-withdraw-nft",
      "get-balance",
      [types.principal(account)],
      this.deployer.address
    );
  }

  getListingInUstx(tokenId: number) {
    return this.chain.callReadOnlyFn(
      "ststxbtc-withdraw-nft",
      "get-listing-in-ustx",
      [types.uint(tokenId)],
      this.deployer.address
    );
  }

  getLastTokenId() {
    return this.chain.callReadOnlyFn(
      "ststxbtc-withdraw-nft",
      "get-last-token-id",
      [],
      this.deployer.address
    );
  }

  uintToString() {
    return this.chain.callReadOnlyFn(
      "ststxbtc-withdraw-nft",
      "uint-to-string",
      [],
      this.deployer.address
    );
  }

  getTokenUri(tokenId: number) {
    return this.chain.callReadOnlyFn(
      "ststxbtc-withdraw-nft",
      "get-token-uri",
      [types.uint(tokenId)],
      this.deployer.address
    );
  }

  getOwner(tokenId: number) {
    return this.chain.callReadOnlyFn(
      "ststxbtc-withdraw-nft",
      "get-owner",
      [types.uint(tokenId)],
      this.deployer.address
    );
  }

  setBaseUri(caller: Account, root: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-withdraw-nft",
        "set-base-token-uri",
        [types.ascii(root)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  transfer(caller: Account, tokenId: number, receiver: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-withdraw-nft",
        "transfer",
        [
          types.uint(tokenId),
          types.principal(caller.address),
          types.principal(receiver),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  mintForProtocol(caller: Account, receiver: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-withdraw-nft",
        "mint-for-protocol",
        [types.principal(receiver)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  burnForProtocol(caller: Account, tokenId: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-withdraw-nft",
        "burn-for-protocol",
        [types.uint(tokenId)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  listInUstx(caller: Account, tokenId: number, price: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-withdraw-nft",
        "list-in-ustx",
        [
          types.uint(tokenId),
          types.uint(price * 1000000),
          types.principal(qualifiedName("marketplace-commission")),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  unlistInUstx(caller: Account, tokenId: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-withdraw-nft",
        "unlist-in-ustx",
        [types.uint(tokenId)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  buyInUstx(caller: Account, tokenId: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-withdraw-nft",
        "buy-in-ustx",
        [
          types.uint(tokenId),
          types.principal(qualifiedName("marketplace-commission")),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }
}
export { StStxBtcWithdrawNft };
