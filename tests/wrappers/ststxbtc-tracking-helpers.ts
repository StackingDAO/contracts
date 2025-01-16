import {
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet/index.ts";

// ---------------------------------------------------------
// stSTXbtc tracking
// ---------------------------------------------------------

class StStxBtcTracking {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getClaimsEnabled() {
    return this.chain.callReadOnlyFn(
      "ststxbtc-tracking",
      "get-claims-enabled",
      [],
      this.deployer.address
    );
  }

  refreshWallet(caller: Account, holder: string, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-tracking",
        "refresh-wallet",
        [types.principal(holder), types.uint(amount)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  refreshPosition(caller: Account, holder: string, position: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-tracking",
        "refresh-position",
        [types.principal(holder), types.principal(position)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  addRewards(caller: Account, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-tracking",
        "add-rewards",
        [types.uint(amount * 100000000)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  getPendingRewardsMany(holders: any[]) {
    return this.chain.callReadOnlyFn(
      "ststxbtc-tracking",
      "get-pending-rewards-many",
      [
        types.list(
          holders.map((holder) =>
            types.tuple({
              holder: types.principal(holder.holder),
              position: types.principal(holder.position),
            })
          )
        ),
      ],
      this.deployer.address
    );
  }

  getPendingRewards(holder: string, position: string) {
    return this.chain.callReadOnlyFn(
      "ststxbtc-tracking",
      "get-pending-rewards",
      [types.principal(holder), types.principal(position)],
      this.deployer.address
    );
  }

  claimPendingRewardsMany(caller: Account, holders: any[]) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-tracking",
        "claim-pending-rewards-many",
        [
          types.list(
            holders.map((holder) =>
              types.tuple({
                holder: types.principal(holder.holder),
                position: types.principal(holder.position),
              })
            )
          ),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  claimPendingRewards(caller: Account, holder: string, position: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-tracking",
        "claim-pending-rewards",
        [types.principal(holder), types.principal(position)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  withdrawTokens(caller: Account, recipient: string, amount: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-tracking",
        "withdraw-tokens",
        [types.principal(recipient), types.uint(amount * 100000000)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  setClaimsEnabled(caller: Account, active: boolean) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-tracking",
        "set-claims-enabled",
        [types.bool(active)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  setSupportedPositions(
    caller: Account,
    position: string,
    active: boolean,
    reserve: string
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-tracking",
        "set-supported-positions",
        [
          types.principal(position),
          types.bool(active),
          types.principal(reserve),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }
}
export { StStxBtcTracking };
