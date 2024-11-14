import {
  Account,
  Chain,
  Clarinet,
  Tx,
  types,
} from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "../wrappers/tests-utils.ts";

import { DataCore } from "../wrappers/data-core-helpers.ts";
import { Core } from "../wrappers/stacking-dao-core-helpers.ts";
import { CoreV1 } from "../wrappers/stacking-dao-core-helpers.ts";

//-------------------------------------
// Protocol
//-------------------------------------

Clarinet.test({
  name: "data-core: STX per stSTX",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dataCore = new DataCore(chain, deployer);
    let core = new Core(chain, deployer);

    let result = await core.deposit(
      wallet_1,
      1000,
      undefined,
      qualifiedName("stacking-pool-v1")
    );
    result.expectOk().expectUintWithDecimals(1000);

    let call = await dataCore.getStxPerStStx(qualifiedName("reserve-v1"));
    call.result.expectOk().expectUintWithDecimals(1);

    call = await dataCore.getStxPerStStxHelper(1000);
    call.result.expectUintWithDecimals(1);

    let block = chain.mineBlock([
      Tx.transferSTX(
        100 * 1000000,
        qualifiedName("reserve-v1"),
        deployer.address
      ),
    ]);
    block.receipts[0].result.expectOk().expectBool(true);

    call = await dataCore.getStxPerStStx(qualifiedName("reserve-v1"));
    call.result.expectOk().expectUintWithDecimals(1.1);

    call = await dataCore.getStxPerStStxHelper(1100);
    call.result.expectUintWithDecimals(1.1);
  },
});

Clarinet.test({
  name: "data-core: protocol can set withdraw offset",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let dataCore = new DataCore(chain, deployer);

    let call = await dataCore.getCycleWithdrawOffset();
    call.result.expectUint(10);

    let result = dataCore.setCycleWithdrawOffset(deployer, 8);
    result.expectOk().expectBool(true);

    call = await dataCore.getCycleWithdrawOffset();
    call.result.expectUint(8);
  },
});

Clarinet.test({
  name: "data-core: protocol can set withdraw nft",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let dataCore = new DataCore(chain, deployer);

    let call = await dataCore.getWithdrawalsByNft(5);
    call.result.expectTuple()["stx-amount"].expectUintWithDecimals(0);
    call.result.expectTuple()["ststx-amount"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-burn-height"].expectUint(0);

    let result = dataCore.setWithdrawalsByNft(deployer, 5, 100, 99, 30);
    result.expectOk().expectBool(true);

    call = await dataCore.getWithdrawalsByNft(5);
    call.result.expectTuple()["stx-amount"].expectUintWithDecimals(100);
    call.result.expectTuple()["ststx-amount"].expectUintWithDecimals(99);
    call.result.expectTuple()["unlock-burn-height"].expectUint(30);
  },
});

Clarinet.test({
  name: "data-core: protocol can delete withdraw nft",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let dataCore = new DataCore(chain, deployer);

    let result = dataCore.setWithdrawalsByNft(deployer, 5, 100, 99, 30);
    result.expectOk().expectBool(true);

    let call = await dataCore.getWithdrawalsByNft(5);
    call.result.expectTuple()["stx-amount"].expectUintWithDecimals(100);
    call.result.expectTuple()["ststx-amount"].expectUintWithDecimals(99);
    call.result.expectTuple()["unlock-burn-height"].expectUint(30);

    result = dataCore.deleteWithdrawalsByNft(deployer, 5);
    result.expectOk().expectBool(true);

    call = await dataCore.getWithdrawalsByNft(5);
    call.result.expectTuple()["stx-amount"].expectUintWithDecimals(0);
    call.result.expectTuple()["ststx-amount"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-burn-height"].expectUint(0);
  },
});

//-------------------------------------
// Withdrawal NFT V1
//-------------------------------------

Clarinet.test({
  name: "data-core: can get legacy withdrawal info",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dataCore = new DataCore(chain, deployer);
    let coreV1 = new CoreV1(chain, deployer);

    let result = await coreV1.deposit(wallet_1, 1000, undefined);
    result.expectOk().expectUintWithDecimals(1000);

    result = coreV1.initWithdraw(wallet_1, 800);
    result.expectOk().expectUintWithDecimals(0);

    let call = await dataCore.getWithdrawalsByNft(0);
    call.result.expectTuple()["stx-amount"].expectUintWithDecimals(800);
    call.result.expectTuple()["ststx-amount"].expectUintWithDecimals(800);
    call.result.expectTuple()["unlock-burn-height"].expectUint(21);

    await chain.mineEmptyBlockUntil(26);

    // Old core
    result = coreV1.withdraw(wallet_1, 0);
    result.expectOk().expectUintWithDecimals(800);

    call = await dataCore.getWithdrawalsByNft(0);
    call.result.expectTuple()["stx-amount"].expectUintWithDecimals(0);
    call.result.expectTuple()["ststx-amount"].expectUintWithDecimals(0);
    call.result.expectTuple()["unlock-burn-height"].expectUint(0);
  },
});

// Clarinet.test({
//   name: "data-core: can withdraw legacy nft in new core",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let dataCore = new DataCore(chain, deployer);
//     let core = new Core(chain, deployer);
//     let coreV1 = new CoreV1(chain, deployer);

//     let result = await coreV1.deposit(wallet_1, 1000, undefined);
//     result.expectOk().expectUintWithDecimals(1000);

//     result = coreV1.initWithdraw(wallet_1, 800);
//     result.expectOk().expectUintWithDecimals(0);

//     let call = await dataCore.getWithdrawalsByNft(0);
//     call.result.expectTuple()["stx-amount"].expectUintWithDecimals(800);
//     call.result.expectTuple()["ststx-amount"].expectUintWithDecimals(800);
//     call.result.expectTuple()["unlock-burn-height"].expectUint(21);

//     call = await dataCore.getMigratedNft(0);
//     call.result.expectBool(false);

//     await chain.mineEmptyBlockUntil(26);

//     result = core.migrateStStx(deployer, qualifiedName("stacking-dao-core-v2"));
//     call.result.expectBool(false);

//     // New core
//     result = core.withdraw(wallet_1, 0);
//     result.expectOk().expectUintWithDecimals(800);

//     call = await dataCore.getWithdrawalsByNft(0);
//     call.result.expectTuple()["stx-amount"].expectUintWithDecimals(0);
//     call.result.expectTuple()["ststx-amount"].expectUintWithDecimals(0);
//     call.result.expectTuple()["unlock-burn-height"].expectUint(0);

//     call = await dataCore.getMigratedNft(0);
//     call.result.expectBool(true);
//   }
// });

// Clarinet.test({
//   name: "data-core: can cancel withdraw legacy nft in new core",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployer = accounts.get("deployer")!;
//     let wallet_1 = accounts.get("wallet_1")!;

//     let dataCore = new DataCore(chain, deployer);
//     let core = new Core(chain, deployer);
//     let coreV1 = new CoreV1(chain, deployer);

//     let result = await coreV1.deposit(wallet_1, 1000, undefined);
//     result.expectOk().expectUintWithDecimals(1000);

//     result = coreV1.initWithdraw(wallet_1, 800);
//     result.expectOk().expectUintWithDecimals(0);

//     let call = await dataCore.getWithdrawalsByNft(0);
//     call.result.expectTuple()["stx-amount"].expectUintWithDecimals(800);
//     call.result.expectTuple()["ststx-amount"].expectUintWithDecimals(800);
//     call.result.expectTuple()["unlock-burn-height"].expectUint(21);

//     call = await dataCore.getMigratedNft(0);
//     call.result.expectBool(false);

//     result = core.migrateStStx(deployer, qualifiedName("stacking-dao-core-v2"));
//     call.result.expectBool(false);

//     // New core
//     result = core.cancelWithdraw(wallet_1, 0, undefined);
//     result.expectOk().expectUintWithDecimals(800);

//     call = await dataCore.getWithdrawalsByNft(0);
//     call.result.expectTuple()["stx-amount"].expectUintWithDecimals(0);
//     call.result.expectTuple()["ststx-amount"].expectUintWithDecimals(0);
//     call.result.expectTuple()["unlock-burn-height"].expectUint(0);

//     call = await dataCore.getMigratedNft(0);
//     call.result.expectBool(true);
//   }
// });

//-------------------------------------
// Access
//-------------------------------------

Clarinet.test({
  name: "data-core: only protocol can use setters",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dataCore = new DataCore(chain, deployer);

    let result = dataCore.setCycleWithdrawOffset(wallet_1, 8);
    result.expectErr().expectUint(20003);

    result = dataCore.setWithdrawalsByNft(wallet_1, 5, 100, 99, 30);
    result.expectErr().expectUint(20003);

    result = dataCore.deleteWithdrawalsByNft(wallet_1, 5);
    result.expectErr().expectUint(20003);
  },
});
