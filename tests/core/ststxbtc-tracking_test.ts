import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "../wrappers/tests-utils.ts";
qualifiedName("");

import { SBtcToken } from "../wrappers/sbtc-token-helpers.ts";
import { StStxBtcToken } from "../wrappers/ststxbtc-token-helpers.ts";
import { StStxBtcTracking } from "../wrappers/ststxbtc-tracking-helpers.ts";
import { StStxBtcTrackingData } from "../wrappers/ststxbtc-tracking-data-helpers.ts";

//-------------------------------------
// Tracking
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-tracking: refresh-wallet will add holder once",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stStxBtcToken = new StStxBtcToken(chain, deployer);
    let stStxBtcTrackingData = new StStxBtcTrackingData(chain, deployer);

    // Mint
    let result = await stStxBtcToken.mintForProtocol(
      deployer,
      1000,
      wallet_1.address
    );
    result.expectOk().expectBool(true);
    result = await stStxBtcToken.mintForProtocol(
      deployer,
      1000,
      wallet_1.address
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcToken.mintForProtocol(
      deployer,
      1000,
      wallet_2.address
    );
    result.expectOk().expectBool(true);

    // Position
    let call = await stStxBtcTrackingData.getHolderPosition(
      wallet_1.address,
      wallet_1.address
    );
    call.result.expectTuple()["amount"].expectUintWithDecimals(2000);
    call = await stStxBtcTrackingData.getHolderPosition(
      wallet_2.address,
      wallet_2.address
    );
    call.result.expectTuple()["amount"].expectUintWithDecimals(1000);

    // List
    call = await stStxBtcTrackingData.getHoldersAddressToIndex(
      wallet_1.address
    );
    call.result.expectSome().expectUint(0);

    call = await stStxBtcTrackingData.getHoldersAddressToIndex(
      wallet_2.address
    );
    call.result.expectSome().expectUint(1);

    call = await stStxBtcTrackingData.getHoldersIndexToAddress(0);
    call.result.expectSome().expectPrincipal(wallet_1.address);

    call = await stStxBtcTrackingData.getHoldersIndexToAddress(1);
    call.result.expectSome().expectPrincipal(wallet_2.address);

    call = await stStxBtcTrackingData.getNextHolderIndex();
    call.result.expectUint(2);
  },
});

Clarinet.test({
  name: "ststxbtc-tracking: refresh-position will add holder once",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stStxBtcTracking = new StStxBtcTracking(chain, deployer);
    let stStxBtcTrackingData = new StStxBtcTrackingData(chain, deployer);
    let stStxBtcToken = new StStxBtcToken(chain, deployer);

    let result = await stStxBtcToken.mintForProtocol(
      deployer,
      1000,
      qualifiedName("position-mock")
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcTracking.setSupportedPositions(
      deployer,
      qualifiedName("position-mock"),
      true,
      qualifiedName("position-mock")
    );
    result.expectOk().expectBool(true);

    // Position
    let call = await stStxBtcTrackingData.getHolderPosition(
      wallet_1.address,
      qualifiedName("position-mock")
    );
    call.result.expectTuple()["amount"].expectUintWithDecimals(0);
    call = await stStxBtcTrackingData.getHolderPosition(
      wallet_2.address,
      qualifiedName("position-mock")
    );
    call.result.expectTuple()["amount"].expectUintWithDecimals(0);

    // Refresh
    result = await stStxBtcTracking.refreshPosition(
      wallet_1,
      wallet_1.address,
      qualifiedName("position-mock")
    );
    result.expectOk().expectUintWithDecimals(100);
    result = await stStxBtcTracking.refreshPosition(
      wallet_1,
      wallet_2.address,
      qualifiedName("position-mock")
    );
    result.expectOk().expectUintWithDecimals(100);

    // Position
    call = await stStxBtcTrackingData.getHolderPosition(
      wallet_1.address,
      qualifiedName("position-mock")
    );
    call.result.expectTuple()["amount"].expectUintWithDecimals(100);
    call = await stStxBtcTrackingData.getHolderPosition(
      wallet_2.address,
      qualifiedName("position-mock")
    );
    call.result.expectTuple()["amount"].expectUintWithDecimals(100);

    // List
    call = await stStxBtcTrackingData.getHoldersAddressToIndex(
      qualifiedName("position-mock")
    );
    call.result.expectSome().expectUint(0);

    call = await stStxBtcTrackingData.getHoldersAddressToIndex(
      wallet_1.address
    );
    call.result.expectSome().expectUint(1);

    call = await stStxBtcTrackingData.getHoldersAddressToIndex(
      wallet_2.address
    );
    call.result.expectSome().expectUint(2);

    call = await stStxBtcTrackingData.getHoldersIndexToAddress(0);
    call.result.expectSome().expectPrincipal(qualifiedName("position-mock"));

    call = await stStxBtcTrackingData.getHoldersIndexToAddress(1);
    call.result.expectSome().expectPrincipal(wallet_1.address);

    call = await stStxBtcTrackingData.getHoldersIndexToAddress(2);
    call.result.expectSome().expectPrincipal(wallet_2.address);

    call = await stStxBtcTrackingData.getNextHolderIndex();
    call.result.expectUint(3);
  },
});

Clarinet.test({
  name: "ststxbtc-tracking: refresh-wallet will save rewards if any",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stStxBtcToken = new StStxBtcToken(chain, deployer);
    let stStxBtcTracking = new StStxBtcTracking(chain, deployer);
    let sBtcToken = new SBtcToken(chain, deployer);

    let result = await sBtcToken.protocolMint(
      deployer,
      100000,
      deployer.address
    );
    result.expectOk().expectBool(true);

    // Mint
    result = await stStxBtcToken.mintForProtocol(
      deployer,
      1000,
      wallet_1.address
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcToken.mintForProtocol(
      deployer,
      2000,
      wallet_2.address
    );
    result.expectOk().expectBool(true);

    // Add rewards
    result = await stStxBtcTracking.addRewards(deployer, 300);
    result.expectOk().expectBool(true);

    // Rewards
    let call = await stStxBtcTracking.getPendingRewardsMany([
      { holder: deployer.address, position: deployer.address },
      { holder: wallet_1.address, position: wallet_1.address },
      { holder: wallet_2.address, position: wallet_2.address },
    ]);
    call.result.expectList()[0].expectOk().expectUintWithDecimals(0, 8);
    call.result.expectList()[1].expectOk().expectUintWithDecimals(100, 8);
    call.result.expectList()[2].expectOk().expectUintWithDecimals(200, 8);

    call = await sBtcToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(0, 8);
    call = await sBtcToken.getBalance(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(0, 8);

    // Refresh wallet
    result = await stStxBtcToken.mintForProtocol(
      deployer,
      2000,
      wallet_2.address
    );
    result.expectOk().expectBool(true);

    // Rewards
    call = await stStxBtcTracking.getPendingRewardsMany([
      { holder: deployer.address, position: deployer.address },
      { holder: wallet_1.address, position: wallet_1.address },
      { holder: wallet_2.address, position: wallet_2.address },
    ]);
    call.result.expectList()[0].expectOk().expectUintWithDecimals(0, 8);
    call.result.expectList()[1].expectOk().expectUintWithDecimals(100, 8);
    call.result.expectList()[2].expectOk().expectUintWithDecimals(200, 8);

    call = await stStxBtcTracking.getSavedRewards(deployer.address, deployer.address);
    call.result.expectUintWithDecimals(0, 8);
    call = await stStxBtcTracking.getSavedRewards(wallet_1.address, wallet_1.address);
    call.result.expectUintWithDecimals(0, 8);  
    call = await stStxBtcTracking.getSavedRewards(wallet_2.address, wallet_2.address);
    call.result.expectUintWithDecimals(200, 8);

    call = await sBtcToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(0, 8);
    call = await sBtcToken.getBalance(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(0, 8);

    // Claim
    result = await stStxBtcTracking.claimPendingRewards(deployer, deployer.address, deployer.address);
    result.expectOk().expectUintWithDecimals(0, 8);
    result = await stStxBtcTracking.claimPendingRewards(wallet_1, wallet_1.address, wallet_1.address);
    result.expectOk().expectUintWithDecimals(100, 8);
    result = await stStxBtcTracking.claimPendingRewards(wallet_2, wallet_2.address, wallet_2.address);
    result.expectOk().expectUintWithDecimals(200, 8);

    call = await stStxBtcTracking.getSavedRewards(deployer.address, deployer.address);
    call.result.expectUintWithDecimals(0, 8);
    call = await stStxBtcTracking.getSavedRewards(wallet_1.address, wallet_1.address);
    call.result.expectUintWithDecimals(0, 8);  

    call = await sBtcToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(100, 8);
    call = await sBtcToken.getBalance(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(200, 8);
  },
});

Clarinet.test({
  name: "ststxbtc-tracking: refresh-position will save rewards if any",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stStxBtcToken = new StStxBtcToken(chain, deployer);
    let stStxBtcTracking = new StStxBtcTracking(chain, deployer);
    let sBtcToken = new SBtcToken(chain, deployer);

    let result = await stStxBtcTracking.setSupportedPositions(
      deployer,
      qualifiedName("position-mock"),
      true,
      qualifiedName("position-mock")
    );
    result.expectOk().expectBool(true);

    result = await sBtcToken.protocolMint(deployer, 100000, deployer.address);
    result.expectOk().expectBool(true);

    // Mint
    result = await stStxBtcToken.mintForProtocol(
      deployer,
      100,
      qualifiedName("position-mock")
    );
    result.expectOk().expectBool(true);

    // Rewards
    let call = await stStxBtcTracking.getPendingRewardsMany([
      { holder: wallet_1.address, position: qualifiedName("position-mock") },
      { holder: wallet_2.address, position: qualifiedName("position-mock") },
    ]);
    call.result.expectList()[0].expectOk().expectUintWithDecimals(0, 8);
    call.result.expectList()[1].expectOk().expectUintWithDecimals(0, 8);

    call = await sBtcToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(0, 8);
    call = await sBtcToken.getBalance(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(0, 8);

    // Refresh
    result = await stStxBtcTracking.refreshPosition(
      wallet_2,
      wallet_1.address,
      qualifiedName("position-mock")
    );
    result.expectOk().expectUintWithDecimals(100);

    // Add rewards
    result = await stStxBtcTracking.addRewards(deployer, 300);
    result.expectOk().expectBool(true);

    // Rewards
    call = await stStxBtcTracking.getPendingRewardsMany([
      {
        holder: qualifiedName("position-mock"),
        position: qualifiedName("position-mock"),
      },
      { holder: wallet_1.address, position: qualifiedName("position-mock") },
      { holder: wallet_2.address, position: wallet_2.address },
    ]);
    call.result.expectList()[0].expectOk().expectUintWithDecimals(0, 8);
    call.result.expectList()[1].expectOk().expectUintWithDecimals(300, 8);
    call.result.expectList()[2].expectOk().expectUintWithDecimals(0, 8);

    call = await sBtcToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(0, 8);
    call = await sBtcToken.getBalance(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(0, 8);

    // Refresh
    result = await stStxBtcTracking.refreshPosition(
      wallet_2,
      wallet_1.address,
      qualifiedName("position-mock")
    );
    result.expectOk().expectUintWithDecimals(100);

    // Rewards
    call = await stStxBtcTracking.getPendingRewardsMany([
      { holder: wallet_1.address, position: qualifiedName("position-mock") },
      { holder: wallet_2.address, position: qualifiedName("position-mock") },
    ]);
    call.result.expectList()[0].expectOk().expectUintWithDecimals(300, 8);
    call.result.expectList()[1].expectOk().expectUintWithDecimals(0, 8);

    call = await stStxBtcTracking.getSavedRewards(deployer.address, qualifiedName("position-mock"));
    call.result.expectUintWithDecimals(0, 8);
    call = await stStxBtcTracking.getSavedRewards(wallet_1.address, qualifiedName("position-mock"));
    call.result.expectUintWithDecimals(300, 8);  
    call = await stStxBtcTracking.getSavedRewards(wallet_2.address, qualifiedName("position-mock"));
    call.result.expectUintWithDecimals(0, 8);

    call = await sBtcToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(0, 8);
    call = await sBtcToken.getBalance(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(0, 8);

    // Claim
    result = await stStxBtcTracking.claimPendingRewards(deployer, deployer.address, qualifiedName("position-mock"));
    result.expectOk().expectUintWithDecimals(0, 8);
    result = await stStxBtcTracking.claimPendingRewards(wallet_1, wallet_1.address, qualifiedName("position-mock"));
    result.expectOk().expectUintWithDecimals(300, 8);
    result = await stStxBtcTracking.claimPendingRewards(wallet_2, wallet_2.address, qualifiedName("position-mock"));
    result.expectOk().expectUintWithDecimals(0, 8);

    call = await stStxBtcTracking.getSavedRewards(deployer.address, qualifiedName("position-mock"));
    call.result.expectUintWithDecimals(0, 8);
    call = await stStxBtcTracking.getSavedRewards(wallet_1.address, qualifiedName("position-mock"));
    call.result.expectUintWithDecimals(0, 8);  

    call = await sBtcToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(300, 8);
    call = await sBtcToken.getBalance(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals(0, 8);
  },
});

//-------------------------------------
// Rewards
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-tracking: can add and claim rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let sBtcToken = new SBtcToken(chain, deployer);
    let stStxBtcToken = new StStxBtcToken(chain, deployer);
    let stStxBtcTracking = new StStxBtcTracking(chain, deployer);
    let stStxBtcTrackingData = new StStxBtcTrackingData(chain, deployer);

    let result = await sBtcToken.protocolMint(
      deployer,
      100000,
      deployer.address
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcToken.mintForProtocol(
      deployer,
      70000,
      deployer.address
    );
    result.expectOk().expectBool(true);
    result = await stStxBtcToken.mintForProtocol(
      deployer,
      20000,
      wallet_1.address
    );
    result.expectOk().expectBool(true);
    result = await stStxBtcToken.mintForProtocol(
      deployer,
      10000,
      wallet_2.address
    );
    result.expectOk().expectBool(true);

    let call = await stStxBtcTrackingData.getTotalSupply();
    call.result.expectUintWithDecimals(100000);

    // Add rewards
    result = await stStxBtcTracking.addRewards(deployer, 1000);
    result.expectOk().expectBool(true);

    call = await stStxBtcTracking.getPendingRewards(
      deployer.address,
      deployer.address
    );
    call.result.expectOk().expectUintWithDecimals((70000 / 100000) * 1000, 8);

    call = await stStxBtcTracking.getPendingRewards(
      wallet_1.address,
      wallet_1.address
    );
    call.result.expectOk().expectUintWithDecimals((20000 / 100000) * 1000, 8);

    call = await stStxBtcTracking.getPendingRewards(
      wallet_2.address,
      wallet_2.address
    );
    call.result.expectOk().expectUintWithDecimals((10000 / 100000) * 1000, 8);

    // Claim rewards
    result = await stStxBtcTracking.claimPendingRewards(
      deployer,
      deployer.address,
      deployer.address
    );
    result.expectOk().expectUintWithDecimals((70000 / 100000) * 1000, 8);

    result = await stStxBtcTracking.claimPendingRewards(
      deployer,
      wallet_1.address,
      wallet_1.address
    );
    result.expectOk().expectUintWithDecimals((20000 / 100000) * 1000, 8);

    result = await stStxBtcTracking.claimPendingRewards(
      deployer,
      wallet_2.address,
      wallet_2.address
    );
    result.expectOk().expectUintWithDecimals((10000 / 100000) * 1000, 8);

    call = await sBtcToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals((20000 / 100000) * 1000, 8);

    call = await sBtcToken.getBalance(wallet_2.address);
    call.result.expectOk().expectUintWithDecimals((10000 / 100000) * 1000, 8);

    call = await stStxBtcTracking.getPendingRewards(
      deployer.address,
      deployer.address
    );
    call.result.expectOk().expectUintWithDecimals(0, 8);
  },
});

Clarinet.test({
  name: "ststxbtc-tracking: can get and claim multiple rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let sBtcToken = new SBtcToken(chain, deployer);
    let stStxBtcToken = new StStxBtcToken(chain, deployer);
    let stStxBtcTracking = new StStxBtcTracking(chain, deployer);
    let stStxBtcTrackingData = new StStxBtcTrackingData(chain, deployer);

    let result = await sBtcToken.protocolMint(
      deployer,
      100000,
      deployer.address
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcToken.mintForProtocol(
      deployer,
      70000,
      deployer.address
    );
    result.expectOk().expectBool(true);
    result = await stStxBtcToken.mintForProtocol(
      deployer,
      20000,
      wallet_1.address
    );
    result.expectOk().expectBool(true);
    result = await stStxBtcToken.mintForProtocol(
      deployer,
      5000,
      wallet_2.address
    );
    result.expectOk().expectBool(true);
    result = await stStxBtcToken.mintForProtocol(
      deployer,
      5000,
      wallet_3.address
    );
    result.expectOk().expectBool(true);

    let call = await stStxBtcTrackingData.getTotalSupply();
    call.result.expectUintWithDecimals(100000);

    // Add rewards
    result = await stStxBtcTracking.addRewards(deployer, 1000);
    result.expectOk().expectBool(true);

    call = await stStxBtcTracking.getPendingRewardsMany([
      { holder: deployer.address, position: deployer.address },
      { holder: wallet_1.address, position: wallet_1.address },
      { holder: wallet_2.address, position: wallet_2.address },
      { holder: wallet_3.address, position: wallet_3.address },
    ]);
    call.result
      .expectList()[0]
      .expectOk()
      .expectUintWithDecimals((70000 / 100000) * 1000, 8);
    call.result
      .expectList()[1]
      .expectOk()
      .expectUintWithDecimals((20000 / 100000) * 1000, 8);
    call.result
      .expectList()[2]
      .expectOk()
      .expectUintWithDecimals((5000 / 100000) * 1000, 8);
    call.result
      .expectList()[3]
      .expectOk()
      .expectUintWithDecimals((5000 / 100000) * 1000, 8);

    result = await stStxBtcTracking.claimPendingRewardsMany(wallet_1, [
      { holder: deployer.address, position: deployer.address },
      { holder: wallet_1.address, position: wallet_1.address },
      { holder: wallet_2.address, position: wallet_2.address },
    ]);
    result
      .expectOk()
      .expectList()[0]
      .expectOk()
      .expectUintWithDecimals((70000 / 100000) * 1000, 8);
    result
      .expectOk()
      .expectList()[1]
      .expectOk()
      .expectUintWithDecimals((20000 / 100000) * 1000, 8);
    result
      .expectOk()
      .expectList()[2]
      .expectOk()
      .expectUintWithDecimals((5000 / 100000) * 1000, 8);

    call = await stStxBtcTracking.getPendingRewardsMany([
      { holder: deployer.address, position: deployer.address },
      { holder: wallet_1.address, position: wallet_1.address },
      { holder: wallet_2.address, position: wallet_2.address },
      { holder: wallet_3.address, position: wallet_3.address },
    ]);
    call.result.expectList()[0].expectOk().expectUintWithDecimals(0, 8);
    call.result.expectList()[1].expectOk().expectUintWithDecimals(0, 8);
    call.result.expectList()[2].expectOk().expectUintWithDecimals(0, 8);
    call.result
      .expectList()[3]
      .expectOk()
      .expectUintWithDecimals((5000 / 100000) * 1000, 8);

    result = await stStxBtcTracking.claimPendingRewardsMany(wallet_1, [
      { holder: deployer.address, position: deployer.address },
      { holder: wallet_1.address, position: wallet_1.address },
      { holder: wallet_2.address, position: wallet_2.address },
      { holder: wallet_3.address, position: wallet_3.address },
    ]);
    result.expectOk().expectList()[0].expectOk().expectUintWithDecimals(0, 8);
    result.expectOk().expectList()[1].expectOk().expectUintWithDecimals(0, 8);
    result.expectOk().expectList()[2].expectOk().expectUintWithDecimals(0, 8);
    result
      .expectOk()
      .expectList()[3]
      .expectOk()
      .expectUintWithDecimals((5000 / 100000) * 1000, 8);

    call = await stStxBtcTracking.getPendingRewardsMany([
      { holder: deployer.address, position: deployer.address },
      { holder: wallet_1.address, position: wallet_1.address },
      { holder: wallet_2.address, position: wallet_2.address },
      { holder: wallet_3.address, position: wallet_3.address },
    ]);
    call.result.expectList()[0].expectOk().expectUintWithDecimals(0, 8);
    call.result.expectList()[1].expectOk().expectUintWithDecimals(0, 8);
    call.result.expectList()[2].expectOk().expectUintWithDecimals(0, 8);
    call.result.expectList()[3].expectOk().expectUintWithDecimals(0, 8);
  },
});

Clarinet.test({
  name: "ststxbtc-tracking: get and claim many rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stStxBtcToken = new StStxBtcToken(chain, deployer);
    let stStxBtcTracking = new StStxBtcTracking(chain, deployer);
    let sBtcToken = new SBtcToken(chain, deployer);

    let result = await sBtcToken.protocolMint(
      deployer,
      100000,
      deployer.address
    );
    result.expectOk().expectBool(true);

    // Mint
    result = await stStxBtcToken.mintForProtocol(
      deployer,
      1000,
      wallet_1.address
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcToken.mintForProtocol(
      deployer,
      2000,
      wallet_2.address
    );
    result.expectOk().expectBool(true);

    // Add rewards
    result = await stStxBtcTracking.addRewards(deployer, 300);
    result.expectOk().expectBool(true);

    // Rewards
    let infoArray = [
      { holder: deployer.address, position: deployer.address },
      { holder: wallet_1.address, position: wallet_1.address },
      { holder: wallet_2.address, position: wallet_2.address },
    ];
    for (let i = 0; i < 195; i++) {
      infoArray.push({ holder: deployer.address, position: deployer.address });
    }

    let call = await stStxBtcTracking.getPendingRewardsMany(infoArray);
    call.result.expectList()[0].expectOk().expectUintWithDecimals(0, 8);
    call.result.expectList()[1].expectOk().expectUintWithDecimals(100, 8);
    call.result.expectList()[2].expectOk().expectUintWithDecimals(200, 8);
    call.result.expectList()[3].expectOk().expectUintWithDecimals(0, 8);
    call.result.expectList()[4].expectOk().expectUintWithDecimals(0, 8);

    result = await stStxBtcTracking.claimPendingRewardsMany(
      wallet_1,
      infoArray
    );
    result.expectOk().expectList()[0].expectOk().expectUintWithDecimals(0, 8);
    result.expectOk().expectList()[1].expectOk().expectUintWithDecimals(100, 8);
    result.expectOk().expectList()[2].expectOk().expectUintWithDecimals(200, 8);
    result.expectOk().expectList()[3].expectOk().expectUintWithDecimals(0, 8);
    result.expectOk().expectList()[4].expectOk().expectUintWithDecimals(0, 8);
  },
});

Clarinet.test({
  name: "ststxbtc-tracking: can not claim multiple times",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let sBtcToken = new SBtcToken(chain, deployer);
    let stStxBtcToken = new StStxBtcToken(chain, deployer);
    let stStxBtcTracking = new StStxBtcTracking(chain, deployer);
    let stStxBtcTrackingData = new StStxBtcTrackingData(chain, deployer);

    let result = await sBtcToken.protocolMint(
      deployer,
      100000,
      deployer.address
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcToken.mintForProtocol(
      deployer,
      70000,
      deployer.address
    );
    result.expectOk().expectBool(true);
    result = await stStxBtcToken.mintForProtocol(
      deployer,
      20000,
      wallet_1.address
    );
    result.expectOk().expectBool(true);
    result = await stStxBtcToken.mintForProtocol(
      deployer,
      10000,
      wallet_2.address
    );
    result.expectOk().expectBool(true);

    let call = await stStxBtcTrackingData.getTotalSupply();
    call.result.expectUintWithDecimals(100000);

    // Add rewards
    result = await stStxBtcTracking.addRewards(deployer, 1000);
    result.expectOk().expectBool(true);

    call = await stStxBtcTracking.getPendingRewardsMany([
      { holder: deployer.address, position: deployer.address },
      { holder: wallet_1.address, position: wallet_1.address },
      { holder: wallet_2.address, position: wallet_2.address },
      { holder: wallet_1.address, position: wallet_1.address },
    ]);
    call.result
      .expectList()[0]
      .expectOk()
      .expectUintWithDecimals((70000 / 100000) * 1000, 8);
    call.result
      .expectList()[1]
      .expectOk()
      .expectUintWithDecimals((20000 / 100000) * 1000, 8);
    call.result
      .expectList()[2]
      .expectOk()
      .expectUintWithDecimals((10000 / 100000) * 1000, 8);
    call.result
      .expectList()[3]
      .expectOk()
      .expectUintWithDecimals((20000 / 100000) * 1000, 8);

    result = await stStxBtcTracking.claimPendingRewardsMany(wallet_1, [
      { holder: deployer.address, position: deployer.address },
      { holder: wallet_1.address, position: wallet_1.address },
      { holder: wallet_2.address, position: wallet_2.address },
      { holder: wallet_1.address, position: wallet_1.address },
    ]);
    result
      .expectOk()
      .expectList()[0]
      .expectOk()
      .expectUintWithDecimals((70000 / 100000) * 1000, 8);
    result
      .expectOk()
      .expectList()[1]
      .expectOk()
      .expectUintWithDecimals((20000 / 100000) * 1000, 8);
    result
      .expectOk()
      .expectList()[2]
      .expectOk()
      .expectUintWithDecimals((10000 / 100000) * 1000, 8);
    result.expectOk().expectList()[3].expectOk().expectUintWithDecimals(0, 8);
  },
});

Clarinet.test({
  name: "ststxbtc-tracking: add rewards multiple times",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let sBtcToken = new SBtcToken(chain, deployer);
    let stStxBtcToken = new StStxBtcToken(chain, deployer);
    let stStxBtcTracking = new StStxBtcTracking(chain, deployer);

    let result = await sBtcToken.protocolMint(
      deployer,
      100000,
      deployer.address
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcToken.mintForProtocol(
      deployer,
      7000,
      deployer.address
    );
    result.expectOk().expectBool(true);
    result = await stStxBtcToken.mintForProtocol(
      deployer,
      2000,
      wallet_1.address
    );
    result.expectOk().expectBool(true);
    result = await stStxBtcToken.mintForProtocol(
      deployer,
      1000,
      qualifiedName("position-mock")
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcTracking.setSupportedPositions(
      deployer,
      qualifiedName("position-mock"),
      true,
      qualifiedName("position-mock")
    );
    result.expectOk().expectBool(true);

    // Refresh positions
    result = await stStxBtcTracking.refreshPosition(
      deployer,
      deployer.address,
      qualifiedName("position-mock")
    );
    result.expectOk().expectUintWithDecimals(100);
    result = await stStxBtcTracking.refreshPosition(
      deployer,
      wallet_1.address,
      qualifiedName("position-mock")
    );
    result.expectOk().expectUintWithDecimals(100);

    // Add rewards
    result = await stStxBtcTracking.addRewards(deployer, 1000);
    result.expectOk().expectBool(true);

    let call = await stStxBtcTracking.getPendingRewardsMany([
      { holder: deployer.address, position: deployer.address },
      { holder: wallet_1.address, position: wallet_1.address },
      {
        holder: qualifiedName("position-mock"),
        position: qualifiedName("position-mock"),
      },
      {
        holder: deployer.address,
        position: qualifiedName("position-mock"),
      },
      {
        holder: wallet_1.address,
        position: qualifiedName("position-mock"),
      },
    ]);
    call.result.expectList()[0].expectOk().expectUintWithDecimals(700, 8);
    call.result.expectList()[1].expectOk().expectUintWithDecimals(200, 8);
    call.result.expectList()[2].expectOk().expectUintWithDecimals(0, 8);
    call.result.expectList()[3].expectOk().expectUintWithDecimals(10, 8);
    call.result.expectList()[4].expectOk().expectUintWithDecimals(10, 8);

    // Claim some rewards
    result = await stStxBtcTracking.claimPendingRewardsMany(wallet_1, [
      { holder: wallet_1.address, position: wallet_1.address },
      {
        holder: deployer.address,
        position: qualifiedName("position-mock"),
      },
    ]);
    result.expectOk().expectList()[0].expectOk().expectUintWithDecimals(200, 8);
    result.expectOk().expectList()[1].expectOk().expectUintWithDecimals(10, 8);

    call = await stStxBtcTracking.getPendingRewardsMany([
      { holder: deployer.address, position: deployer.address },
      { holder: wallet_1.address, position: wallet_1.address },
      {
        holder: qualifiedName("position-mock"),
        position: qualifiedName("position-mock"),
      },
      {
        holder: deployer.address,
        position: qualifiedName("position-mock"),
      },
      {
        holder: wallet_1.address,
        position: qualifiedName("position-mock"),
      },
    ]);
    call.result.expectList()[0].expectOk().expectUintWithDecimals(700, 8);
    call.result.expectList()[1].expectOk().expectUintWithDecimals(0, 8);
    call.result.expectList()[2].expectOk().expectUintWithDecimals(0, 8);
    call.result.expectList()[3].expectOk().expectUintWithDecimals(0, 8);
    call.result.expectList()[4].expectOk().expectUintWithDecimals(10, 8);

    // Add rewards
    result = await stStxBtcTracking.addRewards(deployer, 2000);
    result.expectOk().expectBool(true);

    call = await stStxBtcTracking.getPendingRewardsMany([
      { holder: deployer.address, position: deployer.address },
      { holder: wallet_1.address, position: wallet_1.address },
      {
        holder: qualifiedName("position-mock"),
        position: qualifiedName("position-mock"),
      },
      {
        holder: deployer.address,
        position: qualifiedName("position-mock"),
      },
      {
        holder: wallet_1.address,
        position: qualifiedName("position-mock"),
      },
    ]);
    call.result
      .expectList()[0]
      .expectOk()
      .expectUintWithDecimals(700 + 1400, 8);
    call.result
      .expectList()[1]
      .expectOk()
      .expectUintWithDecimals(0 + 400, 8);
    call.result.expectList()[2].expectOk().expectUintWithDecimals(0, 8);
    call.result
      .expectList()[3]
      .expectOk()
      .expectUintWithDecimals(0 + 20, 8);
    call.result
      .expectList()[4]
      .expectOk()
      .expectUintWithDecimals(10 + 20, 8);
  },
});

Clarinet.test({
  name: "ststxbtc-tracking: enable and disable supported position and check rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let sBtcToken = new SBtcToken(chain, deployer);
    let stStxBtcToken = new StStxBtcToken(chain, deployer);
    let stStxBtcTracking = new StStxBtcTracking(chain, deployer);

    let result = await sBtcToken.protocolMint(
      deployer,
      100000,
      deployer.address
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcToken.mintForProtocol(
      deployer,
      1000,
      wallet_1.address
    );
    result.expectOk().expectBool(true);
    result = await stStxBtcToken.mintForProtocol(
      deployer,
      2000,
      qualifiedName("position-mock")
    );
    result.expectOk().expectBool(true);

    // Add rewards
    result = await stStxBtcTracking.addRewards(deployer, 1500);
    result.expectOk().expectBool(true);

    let call = await stStxBtcTracking.getPendingRewardsMany([
      { holder: wallet_1.address, position: wallet_1.address },
      {
        holder: qualifiedName("position-mock"),
        position: qualifiedName("position-mock"),
      },
      { holder: wallet_1.address, position: qualifiedName("position-mock") },
    ]);
    call.result.expectList()[0].expectOk().expectUintWithDecimals(500, 8);
    call.result.expectList()[1].expectOk().expectUintWithDecimals(1000, 8);
    call.result.expectList()[2].expectOk().expectUintWithDecimals(0, 8);

    // Enable position
    result = await stStxBtcTracking.setSupportedPositions(
      deployer,
      qualifiedName("position-mock"),
      true,
      qualifiedName("position-mock")
    );
    result.expectOk().expectBool(true);

    call = await stStxBtcTracking.getPendingRewardsMany([
      { holder: wallet_1.address, position: wallet_1.address },
      {
        holder: qualifiedName("position-mock"),
        position: qualifiedName("position-mock"),
      },
      { holder: wallet_1.address, position: qualifiedName("position-mock") },
    ]);
    call.result.expectList()[0].expectOk().expectUintWithDecimals(500, 8);
    call.result.expectList()[1].expectOk().expectUintWithDecimals(0, 8);
    call.result.expectList()[2].expectOk().expectUintWithDecimals(0, 8);

    // Update position
    result = await stStxBtcTracking.refreshPosition(
      deployer,
      wallet_1.address,
      qualifiedName("position-mock")
    );
    result.expectOk().expectUintWithDecimals(100);

    call = await stStxBtcTracking.getPendingRewardsMany([
      { holder: wallet_1.address, position: wallet_1.address },
      {
        holder: qualifiedName("position-mock"),
        position: qualifiedName("position-mock"),
      },
      { holder: wallet_1.address, position: qualifiedName("position-mock") },
    ]);
    call.result.expectList()[0].expectOk().expectUintWithDecimals(500, 8);
    call.result.expectList()[1].expectOk().expectUintWithDecimals(0, 8);
    call.result.expectList()[2].expectOk().expectUintWithDecimals(0, 8);

    // Add rewards
    result = await stStxBtcTracking.addRewards(deployer, 1500);
    result.expectOk().expectBool(true);

    call = await stStxBtcTracking.getPendingRewardsMany([
      { holder: wallet_1.address, position: wallet_1.address },
      {
        holder: qualifiedName("position-mock"),
        position: qualifiedName("position-mock"),
      },
      {
        holder: wallet_1.address,
        position: qualifiedName("position-mock"),
      },
    ]);
    call.result
      .expectList()[0]
      .expectOk()
      .expectUintWithDecimals(500 + 500, 8);
    call.result.expectList()[1].expectOk().expectUintWithDecimals(0, 8);
    call.result.expectList()[2].expectOk().expectUintWithDecimals(50, 8);

    // Disable position
    // Must claim rewards from users position
    result = await stStxBtcTracking.claimPendingRewards(
      deployer,
      wallet_1.address,
      qualifiedName("position-mock")
    );
    result.expectOk().expectUintWithDecimals(50, 8);
    result = await stStxBtcTracking.setSupportedPositions(
      deployer,
      qualifiedName("position-mock"),
      false,
      qualifiedName("position-mock")
    );
    result.expectOk().expectBool(true);

    call = await stStxBtcTracking.getPendingRewardsMany([
      { holder: wallet_1.address, position: wallet_1.address },
      {
        holder: qualifiedName("position-mock"),
        position: qualifiedName("position-mock"),
      },
      {
        holder: wallet_1.address,
        position: qualifiedName("position-mock"),
      },
    ]);
    call.result
      .expectList()[0]
      .expectOk()
      .expectUintWithDecimals(500 + 500, 8);
    call.result.expectList()[1].expectOk().expectUintWithDecimals(0, 8);
    call.result.expectList()[2].expectOk().expectUintWithDecimals(0, 8);
  },
});

//-------------------------------------
// Claims enabled
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-tracking: can enable and disable reward claims",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxBtcTracking = new StStxBtcTracking(chain, deployer);

    let result = await stStxBtcTracking.claimPendingRewards(
      deployer,
      deployer.address,
      deployer.address
    );
    result.expectOk().expectUintWithDecimals(0);

    result = await stStxBtcTracking.setClaimsEnabled(deployer, false);
    result.expectOk().expectBool(true);

    result = await stStxBtcTracking.claimPendingRewards(
      deployer,
      deployer.address,
      deployer.address
    );
    result.expectErr().expectUint(10002002);

    result = await stStxBtcTracking.setClaimsEnabled(deployer, true);
    result.expectOk().expectBool(true);

    result = await stStxBtcTracking.claimPendingRewards(
      deployer,
      deployer.address,
      deployer.address
    );
    result.expectOk().expectUintWithDecimals(0);
  },
});

//-------------------------------------
// Admin
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-tracking: can withdraw tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxBtcToken = new StStxBtcToken(chain, deployer);
    let stStxBtcTracking = new StStxBtcTracking(chain, deployer);
    let sBtcToken = new SBtcToken(chain, deployer);

    let result = await sBtcToken.protocolMint(deployer, 300, deployer.address);
    result.expectOk().expectBool(true);

    result = await stStxBtcToken.mintForProtocol(
      deployer,
      3000,
      deployer.address
    );
    result.expectOk().expectBool(true);

    let call = await sBtcToken.getBalance(deployer.address);
    call.result.expectOk().expectUintWithDecimals(300, 8);

    call = await sBtcToken.getBalance(qualifiedName("ststxbtc-tracking-v2"));
    call.result.expectOk().expectUintWithDecimals(0);

    result = await stStxBtcTracking.addRewards(deployer, 300);
    result.expectOk().expectBool(true);

    call = await sBtcToken.getBalance(deployer.address);
    call.result.expectOk().expectUintWithDecimals(0);

    call = await sBtcToken.getBalance(qualifiedName("ststxbtc-tracking-v2"));
    call.result.expectOk().expectUintWithDecimals(300, 8);

    result = await stStxBtcTracking.withdrawTokens(
      deployer,
      deployer.address,
      300
    );
    result.expectOk().expectBool(true);

    call = await sBtcToken.getBalance(deployer.address);
    call.result.expectOk().expectUintWithDecimals(300, 8);

    call = await sBtcToken.getBalance(qualifiedName("ststxbtc-tracking-v2"));
    call.result.expectOk().expectUintWithDecimals(0);
  },
});

//-------------------------------------
// Access and Errors
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-tracking: unsupported position in refresh-position",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxBtcTracking = new StStxBtcTracking(chain, deployer);

    let result = await stStxBtcTracking.refreshPosition(
      deployer,
      deployer.address,
      qualifiedName("position-mock")
    );
    result.expectErr().expectUint(10002001);
  },
});

Clarinet.test({
  name: "ststxbtc-tracking: set-total-supply and add-wallet can only be used by protocol",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stStxBtcTracking = new StStxBtcTracking(chain, deployer);
    let stStxBtcTrackingData = new StStxBtcTrackingData(chain, deployer);

    let result = await stStxBtcTrackingData.setTotalSupply(wallet_1, 100);
    result.expectErr().expectUint(20003);

    result = await stStxBtcTracking.refreshWallet(
      wallet_1,
      wallet_1.address,
      100
    );
    result.expectErr().expectUint(20003);
  },
});

Clarinet.test({
  name: "ststxbtc-tracking: admin functions can only be used by protocol",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stStxBtcTracking = new StStxBtcTracking(chain, deployer);

    let result = await stStxBtcTracking.setSupportedPositions(
      wallet_1,
      qualifiedName("position-mock"),
      true,
      wallet_1.address
    );
    result.expectErr().expectUint(20003);

    result = await stStxBtcTracking.withdrawTokens(
      wallet_1,
      wallet_1.address,
      10
    );
    result.expectErr().expectUint(20003);

    result = await stStxBtcTracking.setClaimsEnabled(wallet_1, false);
    result.expectErr().expectUint(20003);
  },
});

Clarinet.test({
  name: "ststxbtc-tracking: can not update position if total above reserve",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stStxBtcTracking = new StStxBtcTracking(chain, deployer);
    let stStxBtcToken = new StStxBtcToken(chain, deployer);

    let result = await stStxBtcToken.mintForProtocol(
      deployer,
      200,
      qualifiedName("position-mock")
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcTracking.setSupportedPositions(
      deployer,
      qualifiedName("position-mock"),
      true,
      qualifiedName("position-mock")
    );
    result.expectOk().expectBool(true);

    // Refresh positions
    result = await stStxBtcTracking.refreshPosition(
      deployer,
      deployer.address,
      qualifiedName("position-mock")
    );
    result.expectOk().expectUintWithDecimals(100);
    result = await stStxBtcTracking.refreshPosition(
      deployer,
      wallet_1.address,
      qualifiedName("position-mock")
    );
    result.expectOk().expectUintWithDecimals(100);
    result = await stStxBtcTracking.refreshPosition(
      deployer,
      wallet_2.address,
      qualifiedName("position-mock")
    );
    result.expectErr().expectUint(10002003);
  },
});

Clarinet.test({
  name: "ststxbtc-tracking: can not set supported position to same active state",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxBtcTracking = new StStxBtcTracking(chain, deployer);

    let result = await stStxBtcTracking.setSupportedPositions(
      deployer,
      qualifiedName("position-mock"),
      false,
      qualifiedName("position-mock")
    );
    result.expectErr().expectUint(10002004);

    result = await stStxBtcTracking.setSupportedPositions(
      deployer,
      qualifiedName("position-mock"),
      true,
      qualifiedName("position-mock")
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcTracking.setSupportedPositions(
      deployer,
      qualifiedName("position-mock"),
      true,
      qualifiedName("position-mock")
    );
    result.expectErr().expectUint(10002004);

    result = await stStxBtcTracking.setSupportedPositions(
      deployer,
      qualifiedName("position-mock"),
      false,
      qualifiedName("position-mock")
    );
    result.expectOk().expectBool(true);
  },
});

Clarinet.test({
  name: "ststxbtc-tracking: supported position can only be activated once",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxBtcTracking = new StStxBtcTracking(chain, deployer);
    let stStxBtcToken = new StStxBtcToken(chain, deployer);

    let result = await stStxBtcToken.mintForProtocol(
      deployer,
      1000,
      qualifiedName("position-mock")
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcTracking.setSupportedPositions(
      deployer,
      qualifiedName("position-mock"),
      true,
      qualifiedName("position-mock")
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcTracking.refreshPosition(
      deployer,
      deployer.address,
      qualifiedName("position-mock")
    );
    result.expectOk().expectUintWithDecimals(100);

    result = await stStxBtcTracking.setSupportedPositions(
      deployer,
      qualifiedName("position-mock"),
      false,
      qualifiedName("position-mock")
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcTracking.setSupportedPositions(
      deployer,
      qualifiedName("position-mock"),
      true,
      qualifiedName("position-mock")
    );
    result.expectErr().expectUint(10002005);
  },
});

//-------------------------------------
// Audit - Position whitelist
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-tracking: rewards if position added / removed from whitelist",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stStxBtcToken = new StStxBtcToken(chain, deployer);
    let stStxBtcTracking = new StStxBtcTracking(chain, deployer);
    let sBtcToken = new SBtcToken(chain, deployer);

    let result = await sBtcToken.protocolMint(
      deployer,
      100000,
      deployer.address
    );
    result.expectOk().expectBool(true);

    // Mint
    result = await stStxBtcToken.mintForProtocol(
      deployer,
      1000,
      wallet_1.address
    );
    result.expectOk().expectBool(true);
    result = await stStxBtcToken.mintForProtocol(
      deployer,
      2000,
      qualifiedName("position-mock")
    );
    result.expectOk().expectBool(true);

    // Add rewards
    result = await stStxBtcTracking.addRewards(deployer, 300);
    result.expectOk().expectBool(true);

    // Rewards
    let call = await stStxBtcTracking.getPendingRewardsMany([
      { holder: wallet_1.address, position: wallet_1.address },
      {
        holder: qualifiedName("position-mock"),
        position: qualifiedName("position-mock"),
      },
      { holder: wallet_1.address, position: qualifiedName("position-mock") },
    ]);
    call.result.expectList()[0].expectOk().expectUintWithDecimals(100, 8);
    call.result.expectList()[1].expectOk().expectUintWithDecimals(200, 8);
    call.result.expectList()[2].expectOk().expectUintWithDecimals(0, 8);

    //
    // Add to whitelist
    //
    result = await stStxBtcTracking.setSupportedPositions(
      deployer,
      qualifiedName("position-mock"),
      true,
      qualifiedName("position-mock")
    );
    result.expectOk().expectBool(true);

    // Update position
    result = await stStxBtcTracking.refreshPosition(
      deployer,
      wallet_1.address,
      qualifiedName("position-mock")
    );
    result.expectOk().expectUintWithDecimals(100);

    // Rewards
    call = await stStxBtcTracking.getPendingRewardsMany([
      { holder: wallet_1.address, position: wallet_1.address },
      {
        holder: qualifiedName("position-mock"),
        position: qualifiedName("position-mock"),
      },
      { holder: wallet_1.address, position: qualifiedName("position-mock") },
    ]);
    call.result.expectList()[0].expectOk().expectUintWithDecimals(100, 8);
    call.result.expectList()[1].expectOk().expectUintWithDecimals(0, 8); // Auto claimed rewards
    call.result.expectList()[2].expectOk().expectUintWithDecimals(0, 8);

    // Add rewards
    result = await stStxBtcTracking.addRewards(deployer, 300);
    result.expectOk().expectBool(true);

    // Rewards
    call = await stStxBtcTracking.getPendingRewardsMany([
      { holder: wallet_1.address, position: wallet_1.address },
      {
        holder: qualifiedName("position-mock"),
        position: qualifiedName("position-mock"),
      },
      { holder: wallet_1.address, position: qualifiedName("position-mock") },
    ]);
    call.result.expectList()[0].expectOk().expectUintWithDecimals(200, 8);
    call.result.expectList()[1].expectOk().expectUintWithDecimals(0, 8);
    call.result.expectList()[2].expectOk().expectUintWithDecimals(10, 8);

    //
    // Remove whitelist
    //
    result = await stStxBtcTracking.setSupportedPositions(
      deployer,
      qualifiedName("position-mock"),
      false,
      qualifiedName("position-mock")
    );
    result.expectOk().expectBool(true);

    // Rewards
    call = await stStxBtcTracking.getPendingRewardsMany([
      { holder: wallet_1.address, position: wallet_1.address },
      {
        holder: qualifiedName("position-mock"),
        position: qualifiedName("position-mock"),
      },
      { holder: wallet_1.address, position: qualifiedName("position-mock") },
    ]);
    call.result.expectList()[0].expectOk().expectUintWithDecimals(200, 8);
    call.result.expectList()[1].expectOk().expectUintWithDecimals(0, 8);
    call.result.expectList()[2].expectOk().expectUintWithDecimals(10, 8);

    // Add rewards
    result = await stStxBtcTracking.addRewards(deployer, 300);
    result.expectOk().expectBool(true);

    // Rewards
    call = await stStxBtcTracking.getPendingRewardsMany([
      { holder: wallet_1.address, position: wallet_1.address },
      {
        holder: qualifiedName("position-mock"),
        position: qualifiedName("position-mock"),
      },
      { holder: wallet_1.address, position: qualifiedName("position-mock") },
    ]);
    call.result.expectList()[0].expectOk().expectUintWithDecimals(300, 8);
    call.result.expectList()[1].expectOk().expectUintWithDecimals(200, 8);
    call.result.expectList()[2].expectOk().expectUintWithDecimals(10, 8);
  },
});

//-------------------------------------
// Audit - Double rewards
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-tracking: correctly save rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let stStxBtcToken = new StStxBtcToken(chain, deployer);
    let stStxBtcTracking = new StStxBtcTracking(chain, deployer);
    let sBtcToken = new SBtcToken(chain, deployer);

    let result = await sBtcToken.protocolMint(
      deployer,
      100000,
      deployer.address
    );
    result.expectOk().expectBool(true);

    // Mint
    result = await stStxBtcToken.mintForProtocol(
      deployer,
      1000,
      wallet_1.address
    );
    result.expectOk().expectBool(true);

    result = await stStxBtcToken.mintForProtocol(
      deployer,
      2000,
      wallet_2.address
    );
    result.expectOk().expectBool(true);

    // Add rewards
    result = await stStxBtcTracking.addRewards(deployer, 300);
    result.expectOk().expectBool(true);

    let call = stStxBtcTracking.getPendingRewards(wallet_1.address, wallet_1.address)
    call.result.expectOk().expectUintWithDecimals(100, 8);

    result = await stStxBtcTracking.savePendingRewards(deployer, wallet_1.address, wallet_1.address);
    result.expectOk().expectUintWithDecimals(100, 8);

    call = stStxBtcTracking.getPendingRewards(wallet_1.address, wallet_1.address)
    call.result.expectOk().expectUintWithDecimals(100, 8);

    call = stStxBtcTracking.getSavedRewards(wallet_1.address, wallet_1.address);
    call.result.expectUintWithDecimals(100, 8);

    result = await stStxBtcTracking.savePendingRewards(deployer, wallet_1.address, wallet_1.address);
    result.expectOk().expectUintWithDecimals(0, 8);

    call = stStxBtcTracking.getPendingRewards(wallet_1.address, wallet_1.address)
    call.result.expectOk().expectUintWithDecimals(100, 8)

    call = stStxBtcTracking.getSavedRewards(wallet_1.address, wallet_1.address);
    call.result.expectUintWithDecimals(100, 8);

     // Add rewards
     result = await stStxBtcTracking.addRewards(deployer, 600);
     result.expectOk().expectBool(true);
 
    call = stStxBtcTracking.getPendingRewards(wallet_1.address, wallet_1.address)
     call.result.expectOk().expectUintWithDecimals(300, 8);
 
     result = await stStxBtcTracking.savePendingRewards(deployer, wallet_1.address, wallet_1.address);
     result.expectOk().expectUintWithDecimals(300, 8);
 
     call = stStxBtcTracking.getPendingRewards(wallet_1.address, wallet_1.address)
     call.result.expectOk().expectUintWithDecimals(300, 8);
 
     call = stStxBtcTracking.getSavedRewards(wallet_1.address, wallet_1.address);
     call.result.expectUintWithDecimals(300, 8);
 
     result = await stStxBtcTracking.savePendingRewards(deployer, wallet_1.address, wallet_1.address);
     result.expectOk().expectUintWithDecimals(0, 8);
 
     call = stStxBtcTracking.getPendingRewards(wallet_1.address, wallet_1.address)
     call.result.expectOk().expectUintWithDecimals(300, 8)
 
     call = stStxBtcTracking.getSavedRewards(wallet_1.address, wallet_1.address);
     call.result.expectUintWithDecimals(300, 8);
  },
});
