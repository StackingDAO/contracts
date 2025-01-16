import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "../wrappers/tests-utils.ts";

import { Core } from "../wrappers/stacking-dao-core-helpers.ts";
import { CoreBtc } from "../wrappers/stacking-dao-core-btc-helpers.ts";
import { Reserve } from "../wrappers/reserve-helpers.ts";
import { DataCore, DataCoreV2 } from "../wrappers/data-core-helpers.ts";
import { SwapStStxBtc } from "../wrappers/swap-ststx-ststxbtc-helpers.ts";
import { StStxToken } from "../wrappers/ststx-token-helpers.ts";
import { StStxBtcToken } from "../wrappers/ststxbtc-token-helpers.ts";
import { SBtcToken } from "../wrappers/sbtc-token-helpers.ts";

//-------------------------------------
// Core
//-------------------------------------

Clarinet.test({
  name: "swap-ststx-ststxbtc: swaps",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let reserve = new Reserve(chain, deployer);
    let core = new Core(chain, deployer);
    let coreBtc = new CoreBtc(chain, deployer);
    let dataCore = new DataCore(chain, deployer);
    let swap = new SwapStStxBtc(chain, deployer);
    let stStxToken = new StStxToken(chain, deployer);
    let stStxBtcToken = new StStxBtcToken(chain, deployer);

    let sBtcToken = new SBtcToken(chain, deployer);

    // Deposit and add rewards for stSTX
    let result = await core.deposit(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    let block = chain.mineBlock([
      Tx.transferSTX(
        100 * 1000000,
        qualifiedName("reserve-v1"),
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let call = await dataCore.getStxPerStStx(qualifiedName("reserve-v1"));
    call.result.expectOk().expectUintWithDecimals(1.1);

    // Deposit for stSTXbtc
    result = await coreBtc.deposit(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Balance
    call = await stStxToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000);

    call = await stStxBtcToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000);

    call = await reserve.getStxBalance();
    call.result.expectOk().expectUintWithDecimals(1000 + 100 + 1000);

    // Swap stSTX for stSTXbtc
    result = await swap.swapStStxForStStxBtc(wallet_1, 100);
    result.expectOk().expectUintWithDecimals(110);

    // Balance
    call = await stStxToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(900);

    call = await stStxBtcToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1110);

    // Swap stSTXbtc for stSTX
    result = await swap.swapStStxBtcForStStx(wallet_1, 110);
    result.expectOk().expectUintWithDecimals(100);

    // Balance
    call = await stStxToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000);

    call = await stStxBtcToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000);
  },
});

Clarinet.test({
  name: "swap-ststx-ststxbtc: swaps rounding",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);
    let coreBtc = new CoreBtc(chain, deployer);
    let dataCore = new DataCore(chain, deployer);
    let swap = new SwapStStxBtc(chain, deployer);

    // Deposit and add rewards for stSTX
    let result = await core.deposit(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    let block = chain.mineBlock([
      Tx.transferSTX(
        523 * 1473837,
        qualifiedName("reserve-v1"),
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    let call = await dataCore.getStxPerStStx(qualifiedName("reserve-v1"));
    call.result.expectOk().expectUintWithDecimals(1.770816);

    // Deposit for stSTXbtc
    result = await coreBtc.deposit(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Swap stSTX for stSTXbtc
    result = await swap.swapStStxForStStxBtc(wallet_1, 100);
    result.expectOk().expectUintWithDecimals(177.0816);

    result = await swap.swapStStxForStStxBtc(wallet_1, 99.953919);
    result.expectOk().expectUintWithDecimals(176.999999);

    // Swap stSTXbtc for stSTX
    result = await swap.swapStStxBtcForStStx(wallet_1, 177);
    result.expectOk().expectUintWithDecimals(99.953919);

    result = await swap.swapStStxBtcForStStx(wallet_1, 177.0816);
    result.expectOk().expectUintWithDecimals(100);
  },
});

//-------------------------------------
// Errors
//-------------------------------------

Clarinet.test({
  name: "swap-ststx-ststxbtc: can not use wrong reserve",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "swap-ststx-ststxbtc-v1",
        "swap-ststx-for-ststxbtc",
        [
          types.uint(100 * 1000000),
          types.principal(qualifiedName("fake-reserve")),
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);

    block = chain.mineBlock([
      Tx.contractCall(
        "swap-ststx-ststxbtc-v1",
        "swap-ststxbtc-for-ststx",
        [
          types.uint(100 * 1000000),
          types.principal(qualifiedName("fake-reserve")),
        ],
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);
  },
});

Clarinet.test({
  name: "swap-ststx-ststxbtc: can not swap more than wallet balance",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;

    let core = new Core(chain, deployer);
    let coreBtc = new CoreBtc(chain, deployer);
    let swap = new SwapStStxBtc(chain, deployer);
    let stStxToken = new StStxToken(chain, deployer);

    // Deposit and add rewards for stSTX
    let result = await core.deposit(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);
    result = await core.deposit(wallet_2, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Deposit for stSTXbtc
    result = await coreBtc.deposit(wallet_2, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    let call = await stStxToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000);

    // Swap stSTX for stSTXbtc
    result = await swap.swapStStxForStStxBtc(wallet_1, 1001);
    result.expectErr().expectUint(1);

    result = await swap.swapStStxForStStxBtc(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    // Swap stSTXbtc for stSTX
    result = await swap.swapStStxBtcForStStx(wallet_1, 1001);
    result.expectErr().expectUint(1);

    result = await swap.swapStStxBtcForStStx(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);
  },
});

Clarinet.test({
  name: "swap-ststx-ststxbtc: total supply of tokens after swap should be higher than 1",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);
    let swap = new SwapStStxBtc(chain, deployer);
    let stStxToken = new StStxToken(chain, deployer);
    let stStxBtcToken = new StStxBtcToken(chain, deployer);

    // Deposit and add rewards for stSTX
    let result = await core.deposit(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    let call = await stStxToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000);

    // Swap stSTX for stSTXbtc
    result = await swap.swapStStxForStStxBtc(wallet_1, 1000);
    result.expectErr().expectUint(903001);

    result = await swap.swapStStxForStStxBtc(wallet_1, 998);
    result.expectOk().expectUintWithDecimals(998);

    call = await stStxToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(2);
    call = await stStxBtcToken.getTotalSupply();
    call.result.expectOk().expectUintWithDecimals(998);

    // Swap stSTXbtc to stSTX
    result = await swap.swapStStxBtcForStStx(wallet_1, 998);
    result.expectErr().expectUint(903001);

    result = await swap.swapStStxBtcForStStx(wallet_1, 996);
    result.expectOk().expectUintWithDecimals(996);
  },
});
