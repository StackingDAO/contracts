import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "./helpers/tests-utils.ts";

import { DAO } from './helpers/dao-helpers.ts';
import { Reserve } from './helpers/reserve-helpers.ts';

//-------------------------------------
// Core 
//-------------------------------------

Clarinet.test({
  name: "DAO: enable/disable contracts",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dao = new DAO(chain, deployer);
    let reserve = new Reserve(chain, deployer);

    // Protocol is active
    let call = await dao.getContractsEnabled();
    call.result.expectBool(true);

    let result = await dao.checkIsEnabled(wallet_1);
    result.expectOk().expectBool(true);

    // Set protocol is inactive
    result = await dao.setContractsEnabled(deployer, false);
    result.expectOk().expectBool(true);

    call = await dao.getContractsEnabled();
    call.result.expectBool(false);

    result = await dao.checkIsEnabled(wallet_1);
    result.expectErr().expectUint(20002);

    // Can not call method
    result = await reserve.requestStxToStack(deployer, 10);
    result.expectErr().expectUint(20002);

    // Set protocol is active again
    result = await dao.setContractsEnabled(deployer, true);
    result.expectOk().expectBool(true);

    call = await dao.getContractsEnabled();
    call.result.expectBool(true);

    result = await dao.checkIsEnabled(wallet_1);
    result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "DAO: add or update protocol contracts",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let dao = new DAO(chain, deployer);

    // Check active contracts
    let call = await dao.getContractActive(qualifiedName("reserve-v1"));
    call.result.expectBool(true);

    call = await dao.getContractActive(qualifiedName("governance-v0"));
    call.result.expectBool(false);

    let result = await dao.checkIsProtocol(deployer, qualifiedName("reserve-v1"));
    result.expectOk().expectBool(true);

    result = await dao.checkIsProtocol(deployer, qualifiedName("governance-v0"));
    result.expectErr().expectUint(20003);

    // Contract can not update protocol
    let block = chain.mineBlock([
      Tx.contractCall("governance-v0", "set-commission", [
        types.uint(10),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(20003);

    // Deactivate contract
    result = await dao.setContractActive(deployer, qualifiedName("reserve-v1"), false);
    result.expectOk().expectBool(true);

    // Activate contract
    result = await dao.setContractActive(deployer, qualifiedName("governance-v0"), true);
    result.expectOk().expectBool(true);

    // Check
    result = await dao.checkIsProtocol(deployer, qualifiedName("reserve-v1"));
    result.expectErr().expectUint(20003);

    result = await dao.checkIsProtocol(deployer, qualifiedName("governance-v0"));
    result.expectOk().expectBool(true);

    // Contract can update protocol
    block = chain.mineBlock([
      Tx.contractCall("governance-v0", "set-commission", [
        types.uint(10),
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "DAO: add or update protocol admins",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dao = new DAO(chain, deployer);

    // Check active guardian
    let call = await dao.getAdmin(deployer.address);
    call.result.expectBool(true);

    call = await dao.getAdmin(wallet_1.address);
    call.result.expectBool(false);

    let result = await dao.checkIsAdmin(deployer, deployer.address);
    result.expectOk().expectBool(true);

    result = await dao.checkIsAdmin(deployer, wallet_1.address);
    result.expectErr().expectUint(20001);

    // Activate new guardian
    result = await dao.setAdmin(deployer, wallet_1.address, true);
    result.expectOk().expectBool(true);

    // Deactivate guardian
    result = await dao.setAdmin(deployer, deployer.address, false);
    result.expectOk().expectBool(true);

    // Deployer not admin anymore
    result = await dao.setAdmin(deployer, deployer.address, false);
    result.expectErr().expectUint(20001);

    // Check
    result = await dao.checkIsAdmin(deployer, deployer.address);
    result.expectErr().expectUint(20001);

    result = await dao.checkIsAdmin(deployer, wallet_1.address);
    result.expectOk().expectBool(true);
  }
});

//-------------------------------------
// Access 
//-------------------------------------

Clarinet.test({
  name: "DAO: only protocol admin can enable/disable contracts",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dao = new DAO(chain, deployer);

    let result = await dao.setContractsEnabled(wallet_1, false);
    result.expectErr().expectUint(20001);
  }
});

Clarinet.test({
  name: "DAO: only protocol admin can set contracts",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dao = new DAO(chain, deployer);

    let result = await dao.setContractActive(wallet_1, wallet_1.address, true);
    result.expectErr().expectUint(20001);
  }
});
