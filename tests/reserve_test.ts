import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";

import { Core } from './helpers/stacking-dao-core-helpers.ts';
import { Reserve } from './helpers/reserve-helpers.ts';

//-------------------------------------
// Core 
//-------------------------------------

Clarinet.test({
  name: "reserve: lock and request STX for withdrawal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let reserve = new Reserve(chain, deployer);
    let core = new Core(chain, deployer);

    // Add 1000 STX to reserve
    let result = await core.deposit(deployer, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    let call = await reserve.getStxBalance();
    call.result.expectOk().expectUintWithDecimals(1000);

    call = await reserve.getStxStacking();
    call.result.expectOk().expectUintWithDecimals(0);

    call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(1000);

    call = await core.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000);

    // Lock 200 STX for withdrawal
    result = await reserve.lockStxForWithdrawal(deployer, 200);
    result.expectOk().expectUintWithDecimals(200);

    // Request 200 STX for wallet_1
    result = await reserve.requestStxForWithdrawal(deployer, 200, wallet_1.address);
    result.expectOk().expectUintWithDecimals(200);

    call = await reserve.getStxBalance();
    call.result.expectOk().expectUintWithDecimals(800);

    call = await reserve.getStxStacking();
    call.result.expectOk().expectUintWithDecimals(0);

    call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(800);

    call = await core.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000200);
  }
});

Clarinet.test({
  name: "reserve: request STX to stack and return STX from stacking",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let reserve = new Reserve(chain, deployer);
    let core = new Core(chain, deployer);

    // Add 1000 STX to reserve
    let result = await core.deposit(deployer, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    let call = await reserve.getStxBalance();
    call.result.expectOk().expectUintWithDecimals(1000);

    call = await reserve.getStxStacking();
    call.result.expectOk().expectUintWithDecimals(0);

    call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(1000);

    // Request 200 STX to stack
    result = await reserve.requestStxToStack(deployer, 200);
    result.expectOk().expectUintWithDecimals(200);

    call = await reserve.getStxBalance();
    call.result.expectOk().expectUintWithDecimals(800);

    call = await reserve.getStxStacking();
    call.result.expectOk().expectUintWithDecimals(200);

    call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(1000);

    // Return 100 STX from stacking
    result = await reserve.returnStxFromStacking(deployer, 100);
    result.expectOk().expectUintWithDecimals(100);

    call = await reserve.getStxBalance();
    call.result.expectOk().expectUintWithDecimals(900);

    call = await reserve.getStxStacking();
    call.result.expectOk().expectUintWithDecimals(100);

    call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(1000);

    call = await reserve.getStxStackingAtBlock(4);
    call.result.expectOk().expectUintWithDecimals(0);

    call = await reserve.getStxStackingAtBlock(5);
    call.result.expectOk().expectUintWithDecimals(200);

    call = await reserve.getStxStackingAtBlock(6);
    call.result.expectOk().expectUintWithDecimals(100);
  }
});

Clarinet.test({
  name: "reserve: protocol can get STX",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let reserve = new Reserve(chain, deployer);
    let core = new Core(chain, deployer);

    // Add 1000 STX to reserve
    let result = await core.deposit(deployer, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    let call = await reserve.getStxBalance();
    call.result.expectOk().expectUintWithDecimals(1000);

    call = await reserve.getStxStacking();
    call.result.expectOk().expectUintWithDecimals(0);

    call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(1000);

    call = await core.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000);

    // Get 200 STX
    result = await reserve.getStx(deployer, 200, wallet_1.address);
    result.expectOk().expectUintWithDecimals(200);

    call = await core.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000 + 200);

    call = await reserve.getStxBalance();
    call.result.expectOk().expectUintWithDecimals(800);

    call = await reserve.getStxStacking();
    call.result.expectOk().expectUintWithDecimals(0);

    call = await reserve.getTotalStx();
    call.result.expectOk().expectUintWithDecimals(800);
  }
});

//-------------------------------------
// Errors 
//-------------------------------------

Clarinet.test({
  name: "reserve: can not get STX stacking at block in future",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let reserve = new Reserve(chain, deployer);

    let call = await reserve.getStxStackingAtBlock(600);
    call.result.expectErr().expectUint(17003);
  }
});

//-------------------------------------
// Access 
//-------------------------------------

Clarinet.test({
  name: "reserve: only protocol can lock and request STX for withdrawal",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let reserve = new Reserve(chain, deployer);

    let result = await reserve.lockStxForWithdrawal(wallet_1, 100);
    result.expectErr().expectUint(20003);

    result = await reserve.requestStxForWithdrawal(wallet_1, 100, wallet_1.address);
    result.expectErr().expectUint(20003);
  }
});

Clarinet.test({
  name: "reserve: only protocol can request STX to stack and return STX",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let reserve = new Reserve(chain, deployer);

    let result = await reserve.requestStxToStack(wallet_1, 100);
    result.expectErr().expectUint(20003);

    result = await reserve.returnStxFromStacking(wallet_1, 100);
    result.expectErr().expectUint(20003);
  }
});

Clarinet.test({
  name: "reserve: only protocol can get STX",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let reserve = new Reserve(chain, deployer);

    let result = await reserve.getStx(wallet_1, 100, wallet_1.address);
    result.expectErr().expectUint(20003);
  }
});
