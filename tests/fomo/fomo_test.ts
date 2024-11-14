import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";

import { Core, CoreV1 } from '../wrappers/stacking-dao-core-helpers.ts';
import { Commission } from '../wrappers/commission-helpers.ts';
import { Fomo } from '../wrappers/fomo-helpers.ts';
import { StStxToken } from '../wrappers/ststx-token-helpers.ts';
import { qualifiedName } from "../wrappers/tests-utils.ts";

//-------------------------------------
// Core 
//-------------------------------------

Clarinet.test({
  name: "fomo: can buy the claim",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let corev1 = new CoreV1(chain, deployer);
    let core = new Core(chain, deployer);
    let fomo = new Fomo(chain, deployer);
    let stStxToken = new StStxToken(chain, deployer);

    let call = await corev1.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000);

    let result = await core.deposit(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    result = await core.deposit(deployer, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    result = await fomo.startGame(wallet_1);
    result.expectErr().expectUint(20003);

    result = await fomo.startGame(deployer);
    result.expectOk().expectBool(true);

    result = await stStxToken.transfer(deployer, 100, qualifiedName("fomo"));
    result.expectOk();
    call = await stStxToken.getBalance(qualifiedName("fomo"));
    call.result.expectOk().expectUintWithDecimals(100);

    call = await stStxToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000);

    result = await fomo.buyClaim(wallet_1);
    result.expectOk().expectBool(true);

    call = await stStxToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(998.9);

    call = await fomo.getCurrentWinner();
    call.result.expectPrincipal(wallet_1.address);

    result = await fomo.buyClaim(deployer);
    result.expectOk().expectBool(true);

    call = await fomo.getCurrentWinner();
    call.result.expectPrincipal(deployer.address);
  }
});

Clarinet.test({
  name: "fomo: can play a whole game",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;
    let wallet_2 = accounts.get("wallet_2")!;
    let wallet_3 = accounts.get("wallet_3")!;

    let corev1 = new CoreV1(chain, deployer);
    let core = new Core(chain, deployer);
    let fomo = new Fomo(chain, deployer);
    let stStxToken = new StStxToken(chain, deployer);

    let call = await corev1.getStxBalance(wallet_1.address);
    call.result.expectUintWithDecimals(100000000);

    let result = await core.deposit(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    result = await fomo.startGame(deployer);
    result.expectOk().expectBool(true);

    result = await core.deposit(deployer, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    result = await core.deposit(wallet_2, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    result = await core.deposit(wallet_3, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    result = await stStxToken.transfer(deployer, 100, qualifiedName("fomo"));
    result.expectOk();
    call = await stStxToken.getBalance(qualifiedName("fomo"));
    call.result.expectOk().expectUintWithDecimals(100);

    call = await stStxToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(1000);

    result = await fomo.buyClaim(wallet_1);
    result.expectOk().expectBool(true);

    call = await stStxToken.getBalance(wallet_1.address);
    call.result.expectOk().expectUintWithDecimals(998.9);

    call = await fomo.getCurrentWinner();
    call.result.expectPrincipal(wallet_1.address);

    result = await fomo.buyClaim(deployer);
    result.expectOk().expectBool(true);

    call = await fomo.getCurrentWinner();
    call.result.expectPrincipal(deployer.address);

    result = await fomo.buyClaim(wallet_2);
    result.expectOk().expectBool(true);

    result = await fomo.buyClaim(wallet_3);
    result.expectOk().expectBool(true);

    chain.mineEmptyBlock(100);

    call = await fomo.hasGameEnded();
    call.result.expectBool(false);

    chain.mineEmptyBlock(144);

    call = await fomo.hasGameEnded();
    call.result.expectBool(true);

    call = await fomo.getCurrentWinner();
    call.result.expectPrincipal(wallet_3.address);

    result = await fomo.retrieveWinner(wallet_2, 2);
    result.expectErr().expectUint(6660004);

    call = await stStxToken.getBalance(wallet_3.address);
    call.result.expectOk().expectUintWithDecimals(998.6); // before claiming prize

    call = await stStxToken.getBalance(qualifiedName("fomo"));
    call.result.expectOk().expectUintWithDecimals(105);

    result = await fomo.retrieveWinner(wallet_3, 3);
    result.expectOk().expectUint(73500000);

    result = await fomo.retrieveWinner(wallet_3, 3);
    result.expectErr().expectUint(6660006);

    call = await stStxToken.getBalance(wallet_3.address);
    call.result.expectOk().expectUintWithDecimals(998.6 + 73.5);

    result = await fomo.retrieveLoser(wallet_2, 2);
    result.expectOk().expectUintWithDecimals(8.75);

    result = await fomo.retrieveLoser(wallet_1, 0);
    result.expectOk().expectUintWithDecimals(8.75);

    result = await fomo.retrieveLoser(deployer, 1);
    result.expectOk().expectUintWithDecimals(8.75);

    result = await fomo.retrieveFees(deployer);
    result.expectOk().expectUintWithDecimals(5.25);
  }
});

//-------------------------------------
// Errors 
//-------------------------------------

Clarinet.test({
  name: "fomo: cannot buy the claim if game ended",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);
    let fomo = new Fomo(chain, deployer);

    let result = await core.deposit(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    result = await fomo.startGame(deployer);
    result.expectOk().expectBool(true);

    let call = await fomo.getCurrentWinner();
    call.result.expectPrincipal(deployer.address);

    chain.mineEmptyBlock(144);

    result = await fomo.buyClaim(wallet_1);
    result.expectErr().expectUint(6660001);
  }
});

//-------------------------------------
// Access 
//-------------------------------------

Clarinet.test({
  name: "fomo: can/cannot change increment",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let fomo = new Fomo(chain, deployer);

    let result = await fomo.setIncrement(wallet_1, 1000);
    result.expectErr().expectUint(20003);

    result = await fomo.setIncrement(deployer, 1000);
    result.expectOk().expectBool(true);

    let call = await fomo.getIncrement();
    call.result.expectUintWithDecimals(1000);
  }
});

Clarinet.test({
  name: "fomo: can rescue funds",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let core = new Core(chain, deployer);
    let fomo = new Fomo(chain, deployer);

    let result = await core.deposit(wallet_1, 1000);
    result.expectOk().expectUintWithDecimals(1000);

    result = await fomo.startGame(deployer);
    result.expectOk().expectBool(true);

    result = await fomo.buyClaim(wallet_1);
    result.expectOk().expectBool(true);

    result = await fomo.rescueFunds(wallet_1);
    result.expectErr().expectUint(20003);

    result = await fomo.rescueFunds(deployer);
    result.expectOk().expectUintWithDecimals(1.1);
  }
});
