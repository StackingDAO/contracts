import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";

import { Core } from './helpers/stacking-dao-core-helpers.ts';
import { Commission } from './helpers/commission-helpers.ts';

//-------------------------------------
// Core 
//-------------------------------------

Clarinet.test({
  name: "commission: can add and withdraw commission",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);
    let commission = new Commission(chain, deployer);

    let result = await commission.setStakingBasisPoints(deployer, 0.8);
    result.expectOk().expectBool(true);

    let call = await core.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000);

    result = await commission.addCommission(wallet_1, 5000);
    result.expectOk().expectUintWithDecimals(5000);

    call = await core.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(99995000);

    call = await core.getStxBalance(deployer.address);
    call.result.expectUintWithDecimals(100000000);

    // Can withdraw 20% of total commission
    // 20% of 5000 STX = 1000 STX
    result = await commission.withdrawCommission(deployer);
    result.expectOk().expectUintWithDecimals(1000);

    call = await core.getStxBalance(deployer.address);
    call.result.expectUintWithDecimals(100001000);
  }
});

Clarinet.test({
  name: "commission: can set staking percentage",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);
    let commission = new Commission(chain, deployer);

    let result = await commission.setStakingBasisPoints(deployer, 0.8);
    result.expectOk().expectBool(true);

    result = await commission.addCommission(wallet_1, 5000);
    result.expectOk().expectUintWithDecimals(5000);

    // Can withdraw 20% of total commission
    // 20% of 5000 STX = 1000 STX
    result = await commission.withdrawCommission(deployer);
    result.expectOk().expectUintWithDecimals(1000);

    result = await commission.setStakingBasisPoints(deployer, 0.7);
    result.expectOk().expectBool(true);

    result = await commission.addCommission(wallet_1, 5000);
    result.expectOk().expectUintWithDecimals(5000);

    // Can withdraw 30% of total commission
    // 30% of 5000 STX = 1500 STX
    result = await commission.withdrawCommission(deployer);
    result.expectOk().expectUintWithDecimals(1500);
  }
});

//-------------------------------------
// Errors 
//-------------------------------------

Clarinet.test({
  name: "commission: can not set staking percentage below minimum",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let commission = new Commission(chain, deployer);

    let result = await commission.setStakingBasisPoints(deployer, 0.6);
    result.expectErr().expectUint(29001);
  }
});

//-------------------------------------
// Access 
//-------------------------------------

Clarinet.test({
  name: "commission: only protocol can withdraw commission",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let commission = new Commission(chain, deployer);

    let result = await commission.withdrawCommission(wallet_1);
    result.expectErr().expectUint(20003);
  }
});

Clarinet.test({
  name: "commission: only protocol can set staking percentage",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let commission = new Commission(chain, deployer);

    let result = await commission.setStakingBasisPoints(wallet_1, 10);
    result.expectErr().expectUint(20003);
  }
});
