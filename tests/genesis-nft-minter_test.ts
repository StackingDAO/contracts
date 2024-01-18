import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName, REWARD_CYCLE_LENGTH } from './helpers/tests-utils.ts';
qualifiedName("")

import { Core } from './helpers/stacking-dao-core-helpers.ts';
import { GenesisMinter, GenesisNFT } from './helpers/genesis-minter-helpers.ts';
import { StStxToken } from './helpers/ststx-token-helpers.ts';

Clarinet.test({
  name: "genesis-nft: airdrop OG / Diamond / Gold",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let genesisMinter = new GenesisMinter(chain, deployer);
    let genesisNft = new GenesisNFT(chain, deployer);
    let core = new Core(chain, deployer);

    // Mint some stSTX
    let result = await core.deposit(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Set cycle block to check at block 10
    result = await genesisMinter.setCycleEndBlock(10);
    result.expectOk();

    result = await genesisMinter.getCycleEndBlock();
    result.result.expectUint(10);

    chain.mineEmptyBlock(10);

    let call:any = genesisMinter.canClaim(wallet_1);
    call.result.expectBool(true);

    // We are past block 10 now, airdrop NFT
    call = genesisMinter.airdrop(wallet_1, 1);
    call.expectOk().expectBool(true);

    // Cannot airdrop to the same address again
    call = genesisMinter.airdrop(wallet_1, 1);
    call.expectErr().expectUint(1103);

    // Check if we own the NFT
    result = await genesisNft.getOwner(0);
    result.result.expectOk().expectSome(wallet_1.address);

    result = await genesisNft.getGenesisType(0);
    result.result.expectUint(1);
  }
});

Clarinet.test({
  name: "genesis-nft: airdrop-many",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let genesisMinter = new GenesisMinter(chain, deployer);
    let genesisNft = new GenesisNFT(chain, deployer);
    let core = new Core(chain, deployer);

    // Mint some stSTX
    let result = await core.deposit(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);
    result = await core.deposit(wallet_2, 1000);
    result = await core.deposit(wallet_3, 1000);

    // Set cycle block to check at block 10
    result = await genesisMinter.setCycleEndBlock(10);
    result.expectOk();

    result = await genesisMinter.getCycleEndBlock();
    result.result.expectUint(10);

    chain.mineEmptyBlock(10);

    let call:any = genesisMinter.canClaim(wallet_1);
    call.result.expectBool(true);
    call = genesisMinter.canClaim(wallet_2);
    call.result.expectBool(true);
    call = genesisMinter.canClaim(wallet_3);
    call.result.expectBool(true);

    // We are past block 10 now, airdrop NFT
    call = genesisMinter.airdropMany([
      { 'recipient': wallet_1.address, 'type': 1 },
      { 'recipient': wallet_2.address, 'type': 1 },
      { 'recipient': wallet_3.address, 'type': 1 }
    ]);
    call.expectOk().expectList()[0].expectOk().expectBool(true);
    call.expectOk().expectList()[1].expectOk().expectBool(true);
    call.expectOk().expectList()[2].expectOk().expectBool(true);

    call = genesisMinter.airdropMany([
      { 'recipient': wallet_1.address, 'type': 1 },
      { 'recipient': wallet_2.address, 'type': 1 },
      { 'recipient': wallet_3.address, 'type': 1 }
    ]);
    call.expectOk().expectList()[0].expectErr().expectUint(1103);
    call.expectOk().expectList()[1].expectErr().expectUint(1103);
    call.expectOk().expectList()[2].expectErr().expectUint(1103);

    // Cannot airdrop to the same address again
    call = genesisMinter.airdrop(wallet_1, 1);
    call.expectErr().expectUint(1103);

    // Check if we own the NFT
    result = await genesisNft.getOwner(0);
    result.result.expectOk().expectSome(wallet_1.address);

    result = await genesisNft.getGenesisType(0);
    result.result.expectUint(1);

    result = await genesisNft.getOwner(1);
    result.result.expectOk().expectSome(wallet_2.address);

    result = await genesisNft.getOwner(2);
    result.result.expectOk().expectSome(wallet_3.address);
  }
});

Clarinet.test({
  name: "genesis-nft: mint as a user",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let genesisMinter = new GenesisMinter(chain, deployer);
    let genesisNft = new GenesisNFT(chain, deployer);
    let core = new Core(chain, deployer);

    // Mint some stSTX
    let result = await core.deposit(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Set cycle block to check at block 10
    result = await genesisMinter.setCycleEndBlock(10);
    result.expectOk();

    chain.mineEmptyBlock(10);

    result = await genesisMinter.claim(deployer); // fails
    result.expectErr().expectUint(1102);

    result = await genesisMinter.claim(wallet_1); // succeeds
    result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "genesis-nft: transfer NFTs",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let genesisMinter = new GenesisMinter(chain, deployer);
    let genesisNft = new GenesisNFT(chain, deployer);
    let core = new Core(chain, deployer);

    // Mint some stSTX
    let result = await core.deposit(wallet_1, 1000);
    result = await core.deposit(wallet_2, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Set cycle block to check at block 10
    result = await genesisMinter.setCycleEndBlock(10);
    result.expectOk();

    chain.mineEmptyBlock(10);

    result = await genesisMinter.claim(wallet_1); // succeeds
    result.expectOk().expectBool(true);
    result = await genesisMinter.claim(wallet_2);
    result.expectOk().expectBool(true);

    result = await genesisNft.transfer(0, wallet_1, wallet_2);
    result.expectOk().expectBool(true);
    result = await genesisNft.getOwner(0);
    result.result.expectOk().expectSome(wallet_2.address);

    result = await genesisNft.transfer(0, wallet_1, wallet_2);
    result.expectErr().expectUint(1);

    result = await genesisNft.transfer(1, wallet_2, wallet_1);
    result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "genesis-nft: get NFT URI",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let genesisMinter = new GenesisMinter(chain, deployer);
    let genesisNft = new GenesisNFT(chain, deployer);
    let core = new Core(chain, deployer);

    // Mint some stSTX
    let result = await core.deposit(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Set cycle block to check at block 10
    result = await genesisMinter.setCycleEndBlock(10);
    result.expectOk();

    chain.mineEmptyBlock(10);

    result = await genesisMinter.claim(wallet_1); // succeeds
    result.expectOk().expectBool(true);

    result = await genesisNft.setBaseTokenUri('ar://some-url');
    result.expectOk().expectBool(true);
    result = await genesisNft.getTokenUri(0);
    result.result.expectOk().expectSome("ar://some-url.json");
  }
});
