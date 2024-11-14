import {
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "./tests-utils.ts";

// ---------------------------------------------------------
// stSTX withdraw NFT
// ---------------------------------------------------------

class StStxWithdrawNft {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getBaseUri() {
    return this.chain.callReadOnlyFn(
      "ststx-withdraw-nft-v2",
      "get-base-token-uri",
      [],
      this.deployer.address
    );
  }

  getBalance(account: string) {
    return this.chain.callReadOnlyFn(
      "ststx-withdraw-nft-v2",
      "get-balance",
      [types.principal(account)],
      this.deployer.address
    );
  }

  getListingInUstx(tokenId: number) {
    return this.chain.callReadOnlyFn(
      "ststx-withdraw-nft-v2",
      "get-listing-in-ustx",
      [types.uint(tokenId)],
      this.deployer.address
    );
  }

  getLastTokenId() {
    return this.chain.callReadOnlyFn(
      "ststx-withdraw-nft-v2",
      "get-last-token-id",
      [],
      this.deployer.address
    );
  }

  uintToString() {
    return this.chain.callReadOnlyFn(
      "ststx-withdraw-nft-v2",
      "uint-to-string",
      [],
      this.deployer.address
    );
  }

  getTokenUri(tokenId: number) {
    return this.chain.callReadOnlyFn(
      "ststx-withdraw-nft-v2",
      "get-token-uri",
      [types.uint(tokenId)],
      this.deployer.address
    );
  }

  getOwner(tokenId: number) {
    return this.chain.callReadOnlyFn(
      "ststx-withdraw-nft-v2",
      "get-owner",
      [types.uint(tokenId)],
      this.deployer.address
    );
  }

  setBaseUri(caller: Account, root: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststx-withdraw-nft-v2",
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
        "ststx-withdraw-nft-v2",
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
        "ststx-withdraw-nft-v2",
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
        "ststx-withdraw-nft-v2",
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
        "ststx-withdraw-nft-v2",
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
        "ststx-withdraw-nft-v2",
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
        "ststx-withdraw-nft-v2",
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
export { StStxWithdrawNft };
