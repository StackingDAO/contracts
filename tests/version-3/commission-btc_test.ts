import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";

import { CommissionBtc as Commission } from "../wrappers/commission-btc-helpers.ts";
import { SBtcToken } from "../wrappers/sbtc-token-helpers.ts";
import { qualifiedName } from "../wrappers/tests-utils.ts";

//-------------------------------------
// Core
//-------------------------------------

Clarinet.test({
  name: "commission-btc: can add and withdraw commission",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let sBtcToken = new SBtcToken(chain, deployer);
    let commission = new Commission(chain, deployer);

    let result = await commission.setStakingBasisPoints(deployer, 0.8);
    result.expectOk().expectBool(true);

    result = await sBtcToken.protocolMint(
      deployer,
      100000000,
      deployer.address
    );
    result = await sBtcToken.protocolMint(
      deployer,
      100000000,
      wallet_1.address
    );

    let call = await sBtcToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(100000000, 8);

    result = await commission.addCommission(wallet_1, 5000);
    result.expectOk().expectUintWithDecimals(5000, 8);

    call = await sBtcToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(99999000, 8);

    call = await sBtcToken.getBalance(deployer.address);
    call.result.expectOk().expectUintWithDecimals(100000000, 8);

    // Can withdraw 20% of total commission
    // 20% of 5000 STX = 1000 STX
    call = await sBtcToken.getBalance(qualifiedName("commission-btc-v1"));
    call.result.expectOk().expectUintWithDecimals(1000, 8);

    result = await commission.withdrawCommission(
      deployer,
      1000,
      deployer.address
    );
    result.expectOk().expectUintWithDecimals(1000, 8);

    call = await sBtcToken.getBalance(deployer.address);
    call.result.expectOk().expectUintWithDecimals(100001000, 8);
  },
});

Clarinet.test({
  name: "commission-btc: can set staking percentage",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let sBtcToken = new SBtcToken(chain, deployer);
    let commission = new Commission(chain, deployer);

    let result = await commission.setStakingBasisPoints(deployer, 0.8);
    result.expectOk().expectBool(true);

    result = await sBtcToken.protocolMint(
      deployer,
      100000000,
      wallet_1.address
    );

    result = await commission.addCommission(wallet_1, 5000);
    result.expectOk().expectUintWithDecimals(5000, 8);

    // Can withdraw 20% of total commission
    // 20% of 5000 STX = 1000 STX
    result = await commission.withdrawCommission(
      deployer,
      1000,
      deployer.address
    );
    result.expectOk().expectUintWithDecimals(1000, 8);

    result = await commission.setStakingBasisPoints(deployer, 0.7);
    result.expectOk().expectBool(true);

    result = await commission.addCommission(wallet_1, 5000);
    result.expectOk().expectUintWithDecimals(5000, 8);

    // Can withdraw 30% of total commission
    // 30% of 5000 STX = 1500 STX
    result = await commission.withdrawCommission(
      deployer,
      1500,
      deployer.address
    );
    result.expectOk().expectUintWithDecimals(1500, 8);
  },
});

//-------------------------------------
// Access
//-------------------------------------

Clarinet.test({
  name: "commission-btc: can not add commission with wrong staking contract",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let sBtcToken = new SBtcToken(chain, deployer);
    let commission = new Commission(chain, deployer);

    let result = await commission.setStakingBasisPoints(deployer, 0.8);
    result.expectOk().expectBool(true);

    result = await sBtcToken.protocolMint(
      deployer,
      100000000,
      wallet_1.address
    );

    result = await commission.addCommission(wallet_1, 5000);
    result.expectOk().expectUintWithDecimals(5000, 8);

    let block = chain.mineBlock([
      Tx.contractCall(
        "commission-btc-v1",
        "add-commission",
        [
          types.principal(qualifiedName("fake-staking")),
          types.uint(5000 * 100000000),
        ],
        wallet_1.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);
  },
});

//-------------------------------------
// Access
//-------------------------------------

Clarinet.test({
  name: "commission-btc: only protocol can withdraw commission",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let commission = new Commission(chain, deployer);

    let result = await commission.withdrawCommission(
      wallet_1,
      1,
      wallet_1.address
    );
    result.expectErr().expectUint(20003);
  },
});

Clarinet.test({
  name: "commission-btc: only protocol can set staking percentage",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let commission = new Commission(chain, deployer);

    let result = await commission.setStakingBasisPoints(wallet_1, 10);
    result.expectErr().expectUint(20003);
  },
});
