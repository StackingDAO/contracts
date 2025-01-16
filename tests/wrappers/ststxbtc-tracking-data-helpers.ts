import {
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet/index.ts";

// ---------------------------------------------------------
// stSTXbtc tracking data
// ---------------------------------------------------------

class StStxBtcTrackingData {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  getTotalSupply() {
    return this.chain.callReadOnlyFn(
      "ststxbtc-tracking-data",
      "get-total-supply",
      [],
      this.deployer.address
    );
  }

  getNextHolderIndex() {
    return this.chain.callReadOnlyFn(
      "ststxbtc-tracking-data",
      "get-next-holder-index",
      [],
      this.deployer.address
    );
  }

  getCummRewards() {
    return this.chain.callReadOnlyFn(
      "ststxbtc-tracking-data",
      "get-cumm-reward",
      [],
      this.deployer.address
    );
  }

  getSupportedPositions(position: string) {
    return this.chain.callReadOnlyFn(
      "ststxbtc-tracking-data",
      "get-supported-positions",
      [types.principal(position)],
      this.deployer.address
    );
  }

  getHoldersIndexToAddress(index: number) {
    return this.chain.callReadOnlyFn(
      "ststxbtc-tracking-data",
      "get-holders-index-to-address",
      [types.uint(index)],
      this.deployer.address
    );
  }

  getHoldersAddressToIndex(holder: string) {
    return this.chain.callReadOnlyFn(
      "ststxbtc-tracking-data",
      "get-holders-address-to-index",
      [types.principal(holder)],
      this.deployer.address
    );
  }

  getHolderPosition(holder: string, position: string) {
    return this.chain.callReadOnlyFn(
      "ststxbtc-tracking-data",
      "get-holder-position",
      [types.principal(holder), types.principal(position)],
      this.deployer.address
    );
  }

  setTotalSupply(caller: Account, supply: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-tracking-data",
        "set-total-supply",
        [types.uint(supply * 1000000)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  setNextHolderIndex(caller: Account, index: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-tracking-data",
        "set-next-holder-index",
        [types.uint(index)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  setCummReward(caller: Account, index: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-tracking-data",
        "set-cumm-reward",
        [types.uint(index)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  setSupportedPositions(
    caller: Account,
    position: string,
    active: boolean,
    reserve: string,
    total: number,
    deactivatedCummReward: number
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-tracking-data",
        "set-supported-positions",
        [
          types.principal(position),
          types.bool(active),
          types.principal(reserve),
          types.uint(total * 1000000),
          types.uint(deactivatedCummReward),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  setHoldersIndexToAddress(caller: Account, index: number, holder: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-tracking-data",
        "set-holders-index-to-address",
        [types.uint(index), types.principal(holder)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  setHoldersAddressToIndex(caller: Account, holder: string, index: number) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-tracking-data",
        "set-holders-address-to-index",
        [types.principal(holder), types.uint(index)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  setHolderPosition(
    caller: Account,
    holder: string,
    position: string,
    amount: number,
    cumm: number
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-tracking-data",
        "set-holder-position",
        [
          types.principal(holder),
          types.principal(position),
          types.uint(amount * 1000000),
          types.uint(cumm),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  addHolder(caller: Account, holder: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-tracking-data",
        "add-holder",
        [types.principal(holder)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  updateHolderPosition(caller: Account, holder: string, position: string) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-tracking-data",
        "update-holder-position",
        [types.principal(holder), types.principal(position)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  updateHolderPositionAmount(
    caller: Account,
    holder: string,
    position: string,
    amount: number
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-tracking-data",
        "update-holder-position-amount",
        [
          types.principal(holder),
          types.principal(position),
          types.uint(amount * 1000000),
        ],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }

  updateSupportedPositionsTotal(
    caller: Account,
    position: string,
    total: number
  ) {
    let block = this.chain.mineBlock([
      Tx.contractCall(
        "ststxbtc-tracking-data",
        "update-supported-positions-total",
        [types.principal(position), types.uint(total * 1000000)],
        caller.address
      ),
    ]);
    return block.receipts[0].result;
  }
}
export { StStxBtcTrackingData };
