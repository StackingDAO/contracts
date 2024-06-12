import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet/index.ts';
import { qualifiedName } from './tests-utils.ts';

// ---------------------------------------------------------
// Stacking DAO Genesis Minter
// ---------------------------------------------------------

class GenesisMinter {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getCycleEndBlock() {
    return this.chain.callReadOnlyFn("stacking-dao-genesis-nft-minter", "get-cycle-end-block", [], this.deployer.address);
  }

  canClaim(recipient: Account) {
    return this.chain.callReadOnlyFn("stacking-dao-genesis-nft-minter", "can-claim", [types.principal(recipient.address)], this.deployer.address);
  }

  setCycleEndBlock(blockHeight: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-dao-genesis-nft-minter", "set-cycle-end-block", [
        types.uint(blockHeight)
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  airdrop(recipient: Account, type: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-dao-genesis-nft-minter", "airdrop", [
        types.tuple({
          'recipient': types.principal(recipient.address),
          'type': types.uint(type)
        })
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  airdropMany(info: any) {
    let recipients = [];
    info.forEach((data) => {
      recipients.push(types.tuple({
        'recipient': types.principal(data.recipient),
        'type': types.uint(data.type)
      }))
    });

    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-dao-genesis-nft-minter", "airdrop-many", [
        types.list(recipients)
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }

  claim(sender: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-dao-genesis-nft-minter", "claim", [], sender.address)
    ]);
    return block.receipts[0].result;
  }
}

class GenesisNFT {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getOwner(id: number) {
    return this.chain.callReadOnlyFn("stacking-dao-genesis-nft", "get-owner", [types.uint(id)], this.deployer.address);
  }

  getGenesisType(id: number) {
    return this.chain.callReadOnlyFn("stacking-dao-genesis-nft", "get-genesis-type", [types.uint(id)], this.deployer.address);
  }

  getTokenUri(id: number) {
    return this.chain.callReadOnlyFn("stacking-dao-genesis-nft", "get-token-uri", [types.uint(id)], this.deployer.address);
  }

  transfer(id: number, sender: Account, recipient: Account) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-dao-genesis-nft", "transfer", [
        types.uint(id),
        types.principal(sender.address),
        types.principal(recipient.address)
      ], sender.address)
    ]);
    return block.receipts[0].result;
  }

  setBaseTokenUri(newUri: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall("stacking-dao-genesis-nft", "set-base-token-uri", [
        types.ascii(newUri)
      ], this.deployer.address)
    ]);
    return block.receipts[0].result;
  }
}

export { GenesisMinter, GenesisNFT };
