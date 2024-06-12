import { Account, Chain, Clarinet, Tx, types } from "https://deno.land/x/clarinet/index.ts";
import { qualifiedName } from "../wrappers/tests-utils.ts";

import { DataPools } from '../wrappers/data-pools-helpers.ts';

//-------------------------------------
// Protocol 
//-------------------------------------

Clarinet.test({
  name: "data-pools: protocol can update standard commission",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let dataPools = new DataPools(chain, deployer);

    let call = await dataPools.getStandardCommission();
    call.result.expectUint(500);

    call = await dataPools.getPoolCommission(qualifiedName("some-pool"))
    call.result.expectUint(500);

    call = await dataPools.getPoolCommission(qualifiedName("stacking-pool-v1"))
    call.result.expectUint(500);

    let result = dataPools.setStandardCommission(deployer, 1000);
    result.expectOk().expectBool(true);

    call = await dataPools.getStandardCommission();
    call.result.expectUint(1000);

    call = await dataPools.getPoolCommission(qualifiedName("some-pool"))
    call.result.expectUint(1000);

    call = await dataPools.getPoolCommission(qualifiedName("stacking-pool-v1"))
    call.result.expectUint(500);
  }
});

Clarinet.test({
  name: "data-pools: protocol can update pool commission",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let dataPools = new DataPools(chain, deployer);

    let call = await dataPools.getPoolCommission(qualifiedName("stacking-pool-v1"))
    call.result.expectUint(500);

    let result = dataPools.setPoolCommission(deployer, qualifiedName("stacking-pool-v1"), 100);
    result.expectOk().expectBool(true);

    call = await dataPools.getPoolCommission(qualifiedName("stacking-pool-v1"))
    call.result.expectUint(100);
  }
});

Clarinet.test({
  name: "data-pools: protocol can update pool owner commission",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dataPools = new DataPools(chain, deployer);

    let call = await dataPools.getPoolOwnerCommission(qualifiedName("stacking-pool-v1"))
    call.result.expectTuple()["receiver"].expectPrincipal(qualifiedName("rewards-v1"));
    call.result.expectTuple()["share"].expectUint(0);

    let result = dataPools.setPoolOwnerCommission(deployer, qualifiedName("stacking-pool-v1"), wallet_1.address, 0.25)
    result.expectOk().expectBool(true);

    call = await dataPools.getPoolOwnerCommission(qualifiedName("stacking-pool-v1"))
    call.result.expectTuple()["receiver"].expectPrincipal(wallet_1.address);
    call.result.expectTuple()["share"].expectUint(0.25 * 10000);
  }
});

Clarinet.test({
  name: "data-pools: protocol can update active pools list",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let dataPools = new DataPools(chain, deployer);

    let call = await dataPools.getActivePools();
    call.result.expectList()[0].expectPrincipal(qualifiedName("stacking-pool-v1"));
    call.result.expectList()[1].expectPrincipal(qualifiedName("pox-fast-pool-v2-mock"));

    let result = dataPools.setActivePools(deployer, [qualifiedName("stacking-pool-v1"), qualifiedName("new-pool-v1")]);
    result.expectOk().expectBool(true);

    call = await dataPools.getActivePools();
    call.result.expectList()[0].expectPrincipal(qualifiedName("stacking-pool-v1"));
    call.result.expectList()[1].expectPrincipal(qualifiedName("new-pool-v1"));
  }
});

Clarinet.test({
  name: "data-pools: protocol can update pool share",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let dataPools = new DataPools(chain, deployer);

    let call = await dataPools.getPoolShare(qualifiedName("stacking-pool-v1"));
    call.result.expectUint(7000);

    let result = dataPools.setPoolShare(deployer, qualifiedName("stacking-pool-v1"), 9000);
    result.expectOk().expectBool(true);

    call = await dataPools.getPoolShare(qualifiedName("stacking-pool-v1"));
    call.result.expectUint(9000);
  }
});

Clarinet.test({
  name: "data-pools: protocol can update pool delegates",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let dataPools = new DataPools(chain, deployer);

    let call = await dataPools.getPoolDelegates(qualifiedName("stacking-pool-v1"))
    call.result.expectList()[0].expectPrincipal(qualifiedName("stacking-delegate-1-1"));
    call.result.expectList()[1].expectPrincipal(qualifiedName("stacking-delegate-1-2"));
    call.result.expectList()[2].expectPrincipal(qualifiedName("stacking-delegate-1-3"));

    let result = dataPools.setPoolDelegates(deployer, qualifiedName("stacking-pool-v1"), [qualifiedName("stacking-delegate-3-1"), qualifiedName("stacking-delegate-3-2")])
    result.expectOk().expectBool(true);

    call = await dataPools.getPoolDelegates(qualifiedName("stacking-pool-v1"));
    call.result.expectList()[0].expectPrincipal(qualifiedName("stacking-delegate-3-1"));
    call.result.expectList()[1].expectPrincipal(qualifiedName("stacking-delegate-3-2"));
  }
});

Clarinet.test({
  name: "data-pools: protocol can update delegate share",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let dataPools = new DataPools(chain, deployer);

    let call = await dataPools.getDelegateShare(qualifiedName("stacking-delegate-1-1"));
    call.result.expectUint(5000);

    let result = dataPools.setDelegateShare(deployer, qualifiedName("stacking-delegate-1-1"), 4000);
    result.expectOk().expectBool(true);

    call = await dataPools.getDelegateShare(qualifiedName("stacking-delegate-1-1"));
    call.result.expectUint(4000);
  }
});

//-------------------------------------
// Errors 
//-------------------------------------

Clarinet.test({
  name: "data-pools: can not set pool owner share above 100%",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dataPools = new DataPools(chain, deployer);

    let result = dataPools.setPoolOwnerCommission(deployer, qualifiedName("stacking-pool-v1"), wallet_1.address, 1.1)
    result.expectErr().expectUint(2011001);
  }
});

Clarinet.test({
  name: "data-pools: can not set commission above 40%",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;

    let dataPools = new DataPools(chain, deployer);

    let result = dataPools.setStandardCommission(deployer, 4001);
    result.expectErr().expectUint(2011002);

    result = dataPools.setPoolCommission(deployer, qualifiedName("stacking-pool-v1"), 4001);
    result.expectErr().expectUint(2011002);
  }
});

//-------------------------------------
// Access 
//-------------------------------------

Clarinet.test({
  name: "data-pools: only protocol can use setters",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployer = accounts.get("deployer")!;
    let wallet_1 = accounts.get("wallet_1")!;

    let dataPools = new DataPools(chain, deployer);

    let result = dataPools.setStandardCommission(wallet_1, 1000);
    result.expectErr().expectUint(20003);

    result = dataPools.setPoolCommission(wallet_1, qualifiedName("stacking-pool-v1"), 100);
    result.expectErr().expectUint(20003);

    result = dataPools.setPoolOwnerCommission(wallet_1, qualifiedName("stacking-pool-v1"), wallet_1.address, 0.25)
    result.expectErr().expectUint(20003);

    result = dataPools.setActivePools(wallet_1, [qualifiedName("stacking-pool-v1"), qualifiedName("new-pool-v1")]);
    result.expectErr().expectUint(20003);

    result = dataPools.setPoolShare(wallet_1, qualifiedName("stacking-pool-v1"), 9000);
    result.expectErr().expectUint(20003);

    result = dataPools.setPoolDelegates(wallet_1, qualifiedName("stacking-pool-v1"), [qualifiedName("stacking-delegate-3-1"), qualifiedName("stacking-delegate-3-2")])
    result.expectErr().expectUint(20003);

    result = dataPools.setDelegateShare(wallet_1, qualifiedName("stacking-delegate-1-1"), 4000);
    result.expectErr().expectUint(20003);
  }
});
