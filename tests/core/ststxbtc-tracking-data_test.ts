import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "../wrappers/tests-utils.ts";
qualifiedName("");

import { StStxBtcTrackingData } from "../wrappers/ststxbtc-tracking-data-helpers.ts";

//-------------------------------------
// Getters / Setters
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-tracking-data: can get/set total supply",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxBtcTrackingData = new StStxBtcTrackingData(chain, deployer);

    let call = await stStxBtcTrackingData.getTotalSupply();
    call.result.expectUintWithDecimals(0);

    let result = await stStxBtcTrackingData.setTotalSupply(deployer, 1000);
    result.expectOk().expectBool(true);

    call = await stStxBtcTrackingData.getTotalSupply();
    call.result.expectUintWithDecimals(1000);
  },
});

Clarinet.test({
  name: "ststxbtc-tracking-data: can get/set holder index",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxBtcTrackingData = new StStxBtcTrackingData(chain, deployer);

    let call = await stStxBtcTrackingData.getNextHolderIndex();
    call.result.expectUint(0);

    let result = await stStxBtcTrackingData.setNextHolderIndex(deployer, 1000);
    result.expectOk().expectBool(true);

    call = await stStxBtcTrackingData.getNextHolderIndex();
    call.result.expectUint(1000);
  },
});

Clarinet.test({
  name: "ststxbtc-tracking-data: can get/set cummulative rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxBtcTrackingData = new StStxBtcTrackingData(chain, deployer);

    let call = await stStxBtcTrackingData.getCummRewards();
    call.result.expectUint(0);

    let result = await stStxBtcTrackingData.setCummReward(deployer, 1000);
    result.expectOk().expectBool(true);

    call = await stStxBtcTrackingData.getCummRewards();
    call.result.expectUint(1000);
  },
});

Clarinet.test({
  name: "ststxbtc-tracking-data: can get/set supported position",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxBtcTrackingData = new StStxBtcTrackingData(chain, deployer);

    let call = await stStxBtcTrackingData.getSupportedPositions(
      deployer.address
    );
    call.result.expectTuple()["active"].expectBool(false);

    let result = await stStxBtcTrackingData.setSupportedPositions(
      deployer,
      deployer.address,
      true,
      qualifiedName("position-mock"),
      10,
      20
    );
    result.expectOk().expectBool(true);

    call = await stStxBtcTrackingData.getSupportedPositions(deployer.address);
    call.result.expectTuple()["active"].expectBool(true);
    call.result.expectTuple()["total"].expectUintWithDecimals(10);
    call.result.expectTuple()["deactivated-cumm-reward"].expectUint(20);
    call.result
      .expectTuple()
      ["reserve"].expectPrincipal(qualifiedName("position-mock"));
  },
});

Clarinet.test({
  name: "ststxbtc-tracking-data: can get/set holder index to address",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxBtcTrackingData = new StStxBtcTrackingData(chain, deployer);

    let call = await stStxBtcTrackingData.getHoldersIndexToAddress(100);
    call.result.expectNone();

    let result = await stStxBtcTrackingData.setHoldersIndexToAddress(
      deployer,
      1000,
      deployer.address
    );
    result.expectOk().expectBool(true);

    call = await stStxBtcTrackingData.getHoldersIndexToAddress(1000);
    call.result.expectSome().expectPrincipal(deployer.address);
  },
});

Clarinet.test({
  name: "ststxbtc-tracking-data: can get/set holder address to index",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxBtcTrackingData = new StStxBtcTrackingData(chain, deployer);

    let call = await stStxBtcTrackingData.getHoldersAddressToIndex(
      deployer.address
    );
    call.result.expectNone();

    let result = await stStxBtcTrackingData.setHoldersAddressToIndex(
      deployer,
      deployer.address,
      1000
    );
    result.expectOk().expectBool(true);

    call = await stStxBtcTrackingData.getHoldersAddressToIndex(
      deployer.address
    );
    call.result.expectSome().expectUint(1000);
  },
});

Clarinet.test({
  name: "ststxbtc-tracking-data: can get/set holder position",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxBtcTrackingData = new StStxBtcTrackingData(chain, deployer);

    let call = await stStxBtcTrackingData.getHolderPosition(
      deployer.address,
      deployer.address
    );
    call.result.expectTuple()["amount"].expectUintWithDecimals(0);
    call.result.expectTuple()["cumm-reward"].expectUint(0);

    let result = await stStxBtcTrackingData.setHolderPosition(
      deployer,
      deployer.address,
      deployer.address,
      1000,
      10
    );
    result.expectOk().expectBool(true);

    call = await stStxBtcTrackingData.getHolderPosition(
      deployer.address,
      deployer.address
    );
    call.result.expectTuple()["amount"].expectUintWithDecimals(1000);
    call.result.expectTuple()["cumm-reward"].expectUint(10);
  },
});

//-------------------------------------
// Helpers
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-tracking-data: add holder",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxBtcTrackingData = new StStxBtcTrackingData(chain, deployer);

    // Data
    let call = await stStxBtcTrackingData.getHolderPosition(
      deployer.address,
      deployer.address
    );
    call.result.expectTuple()["amount"].expectUintWithDecimals(0);
    call.result.expectTuple()["cumm-reward"].expectUint(0);

    call = await stStxBtcTrackingData.getHoldersAddressToIndex(
      deployer.address
    );
    call.result.expectNone();

    call = await stStxBtcTrackingData.getHoldersIndexToAddress(0);
    call.result.expectNone();

    call = await stStxBtcTrackingData.getNextHolderIndex();
    call.result.expectUint(0);

    // Add
    let result = await stStxBtcTrackingData.addHolder(
      deployer,
      deployer.address
    );
    result.expectOk().expectBool(true);

    // Data
    call = await stStxBtcTrackingData.getHolderPosition(
      deployer.address,
      deployer.address
    );
    call.result.expectTuple()["amount"].expectUintWithDecimals(0);
    call.result.expectTuple()["cumm-reward"].expectUint(0);

    call = await stStxBtcTrackingData.getHoldersAddressToIndex(
      deployer.address
    );
    call.result.expectSome().expectUint(0);

    call = await stStxBtcTrackingData.getHoldersIndexToAddress(0);
    call.result.expectSome().expectPrincipal(deployer.address);

    call = await stStxBtcTrackingData.getNextHolderIndex();
    call.result.expectUint(1);
  },
});

Clarinet.test({
  name: "ststxbtc-tracking-data: update holder position",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxBtcTrackingData = new StStxBtcTrackingData(chain, deployer);

    // Data
    let call = await stStxBtcTrackingData.getHolderPosition(
      deployer.address,
      qualifiedName("position-mock")
    );
    call.result.expectTuple()["amount"].expectUintWithDecimals(0);
    call.result.expectTuple()["cumm-reward"].expectUint(0);

    call = await stStxBtcTrackingData.getHoldersAddressToIndex(
      deployer.address
    );
    call.result.expectNone();

    call = await stStxBtcTrackingData.getHoldersIndexToAddress(0);
    call.result.expectNone();

    call = await stStxBtcTrackingData.getNextHolderIndex();
    call.result.expectUint(0);

    // Update
    let result = await stStxBtcTrackingData.updateHolderPosition(
      deployer,
      deployer.address,
      qualifiedName("position-mock")
    );
    result.expectOk().expectBool(true);

    // Data
    call = await stStxBtcTrackingData.getHolderPosition(
      deployer.address,
      qualifiedName("position-mock")
    );
    call.result.expectTuple()["amount"].expectUintWithDecimals(0);
    call.result.expectTuple()["cumm-reward"].expectUint(0);

    call = await stStxBtcTrackingData.getHoldersAddressToIndex(
      deployer.address
    );
    call.result.expectSome().expectUint(0);

    call = await stStxBtcTrackingData.getHoldersIndexToAddress(0);
    call.result.expectSome().expectPrincipal(deployer.address);

    call = await stStxBtcTrackingData.getNextHolderIndex();
    call.result.expectUint(1);
  },
});

Clarinet.test({
  name: "ststxbtc-tracking-data: update holder position amount",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let stStxBtcTrackingData = new StStxBtcTrackingData(chain, deployer);

    // Data
    let call = await stStxBtcTrackingData.getHolderPosition(
      deployer.address,
      qualifiedName("position-mock")
    );
    call.result.expectTuple()["amount"].expectUintWithDecimals(0);
    call.result.expectTuple()["cumm-reward"].expectUint(0);

    call = await stStxBtcTrackingData.getHoldersAddressToIndex(
      deployer.address
    );
    call.result.expectNone();

    call = await stStxBtcTrackingData.getHoldersIndexToAddress(0);
    call.result.expectNone();

    call = await stStxBtcTrackingData.getNextHolderIndex();
    call.result.expectUint(0);

    // Update
    let result = await stStxBtcTrackingData.updateHolderPositionAmount(
      deployer,
      deployer.address,
      qualifiedName("position-mock"),
      1000
    );
    result.expectOk().expectBool(true);

    // Data
    call = await stStxBtcTrackingData.getHolderPosition(
      deployer.address,
      qualifiedName("position-mock")
    );
    call.result.expectTuple()["amount"].expectUintWithDecimals(1000);
    call.result.expectTuple()["cumm-reward"].expectUint(0);

    call = await stStxBtcTrackingData.getHoldersAddressToIndex(
      deployer.address
    );
    call.result.expectSome().expectUint(0);

    call = await stStxBtcTrackingData.getHoldersIndexToAddress(0);
    call.result.expectSome().expectPrincipal(deployer.address);

    call = await stStxBtcTrackingData.getNextHolderIndex();
    call.result.expectUint(1);
  },
});

//-------------------------------------
// Access
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-tracking-data: only protocol can call setters and helpers",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let stStxBtcTrackingData = new StStxBtcTrackingData(chain, deployer);

    let result = await stStxBtcTrackingData.setTotalSupply(wallet_1, 1000);
    result.expectErr().expectUint(20003);

    result = await stStxBtcTrackingData.setNextHolderIndex(wallet_1, 1000);
    result.expectErr().expectUint(20003);

    result = await stStxBtcTrackingData.setCummReward(wallet_1, 1000);
    result.expectErr().expectUint(20003);

    result = await stStxBtcTrackingData.setSupportedPositions(
      wallet_1,
      wallet_1.address,
      true,
      qualifiedName("position-mock"),
      0,
      0
    );
    result.expectErr().expectUint(20003);

    result = await stStxBtcTrackingData.setHoldersAddressToIndex(
      wallet_1,
      wallet_1.address,
      1
    );
    result.expectErr().expectUint(20003);

    result = await stStxBtcTrackingData.setHoldersIndexToAddress(
      wallet_1,
      1,
      wallet_1.address
    );
    result.expectErr().expectUint(20003);

    result = await stStxBtcTrackingData.setHolderPosition(
      wallet_1,
      wallet_1.address,
      wallet_1.address,
      1000,
      10
    );
    result.expectErr().expectUint(20003);

    result = await stStxBtcTrackingData.addHolder(wallet_1, wallet_1.address);
    result.expectErr().expectUint(20003);

    result = await stStxBtcTrackingData.updateHolderPosition(
      wallet_1,
      wallet_1.address,
      qualifiedName("position-mock")
    );
    result.expectErr().expectUint(20003);

    result = await stStxBtcTrackingData.updateHolderPositionAmount(
      wallet_1,
      wallet_1.address,
      qualifiedName("position-mock"),
      1000
    );
    result.expectErr().expectUint(20003);

    result = await stStxBtcTrackingData.updateSupportedPositionsTotal(
      wallet_1,
      qualifiedName("position-mock"),
      1000
    );
    result.expectErr().expectUint(20003);
  },
});
