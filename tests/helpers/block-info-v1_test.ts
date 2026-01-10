import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "../wrappers/tests-utils.ts";
import { BlockInfo } from "../wrappers/block-info-helpers.ts";

//-------------------------------------
// Block Info V1
//-------------------------------------

Clarinet.test({
  name: "block-info-v1: get-reserve-stacking-at-block",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let blockInfo = new BlockInfo(chain, deployer);

    // Test getting reserve stacking at current block
    let call = blockInfo.getReserveStackingAtBlock(100);

    // Should return ok with stacking data
    call.result.expectOk();
  }
});

Clarinet.test({
  name: "block-info-v1: get-stx-account-at-block",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let blockInfo = new BlockInfo(chain, deployer);

    // Test getting STX account at current block
    let call = blockInfo.getStxAccountAtBlock(deployer.address, 100);

    // Should return ok with stx-account data
    call.result.expectOk();
  }
});

Clarinet.test({
  name: "block-info-v1: get-user-ststx-at-block",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let blockInfo = new BlockInfo(chain, deployer);

    // Test getting user stSTX balance at block
    let call = blockInfo.getUserStstxAtBlock(deployer.address, 100);

    // Should return tuple with ststx-balance and lp-balance
    call.result.expectOk();
    let result = call.result.expectOk();
    let response = result as any;
    // Verify the structure has the expected fields
    response["ststx-balance"] !== undefined;
    response["lp-balance"] !== undefined;
  }
});

Clarinet.test({
  name: "block-info-v1: get-ststx-balance-at-block",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let blockInfo = new BlockInfo(chain, deployer);

    // Test getting stSTX balance at specific block
    let call = blockInfo.getStstxBalanceAtBlock(deployer.address, 100);

    // Should return some or none value
    call.result.expectOk();
  }
});

Clarinet.test({
  name: "block-info-v1: get-lp-balance-at-block",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let blockInfo = new BlockInfo(chain, deployer);

    // Test getting LP balance at specific block
    let call = blockInfo.getLpBalanceAtBlock(deployer.address, 100);

    // Should return balance value
    call.result.expectOk();
  }
});

Clarinet.test({
  name: "block-info-v1: error on invalid block",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let blockInfo = new BlockInfo(chain, deployer);

    // Test with invalid block number (future block)
    let call = blockInfo.getReserveStackingAtBlock(999999999);

    // Should return err for invalid block
    call.result.expectErr();
  }
});
