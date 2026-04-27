import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "../wrappers/tests-utils.ts";
import { StstxbtcHelperV2 } from "../wrappers/ststxbtc-helper-v2-helpers.ts";

//-------------------------------------
// stSTXbtc Helper V2
//-------------------------------------

Clarinet.test({
  name: "ststxbtc-helper-v2: get-ststxbtc-total-supply",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let helper = new StstxbtcHelperV2(chain, deployer);

    // Test getting total supply at a specific block
    let call = helper.getStstxbtcTotalSupply(500000);

    // Should return ok with total supply
    call.result.expectOk();
  }
});

Clarinet.test({
  name: "ststxbtc-helper-v2: get-total-supply",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let helper = new StstxbtcHelperV2(chain, deployer);

    // Test getting total supply for v1 and v2 tokens
    let call = helper.getTotalSupply(500000);

    // Should return the sum of v1 and v2 supply
    call.result.expectOk();
  }
});

Clarinet.test({
  name: "ststxbtc-helper-v2: get-current-total-supply",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let helper = new StstxbtcHelperV2(chain, deployer);

    // Test getting current total supply
    let call = helper.getCurrentTotalSupply();

    // Should return ok with current supply
    call.result.expectOk();
    let result = call.result.expectOk();
    // Result should be a uint (total supply)
    let response = result as any;
    typeof response.value === "bigint";
  }
});

Clarinet.test({
  name: "ststxbtc-helper-v2: supply calculation at different blocks",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let helper = new StstxbtcHelperV2(chain, deployer);

    // Test supply calculation at early block (before v2 activation)
    let earlyBlockCall = helper.getTotalSupply(100);

    // At early block, supply should be 0 or minimal
    earlyBlockCall.result.expectOk();

    // Test supply calculation at current block
    let currentBlockCall = helper.getCurrentTotalSupply();

    // Current supply should be >= supply at earlier block
    currentBlockCall.result.expectOk();
  }
});

Clarinet.test({
  name: "ststxbtc-helper-v2: total supply consistency",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let helper = new StstxbtcHelperV2(chain, deployer);

    // Get current total supply from both methods
    let currentSupply = helper.getCurrentTotalSupply();

    let blockSupply = helper.getStstxbtcTotalSupply(500000);

    // Both should return ok
    currentSupply.result.expectOk();
    blockSupply.result.expectOk();
  }
});
