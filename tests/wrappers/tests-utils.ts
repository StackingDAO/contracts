// Get full qualified name based on contract name
export function qualifiedName(contractName: string) {
  return "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM." + contractName;
}

// Extra methods on String type
declare global {
  interface String {
    expectUintWithDecimals(value: number | bigint): bigint;
  }
}

// Expect Uint with 6 decimals
String.prototype.expectUintWithDecimals = function (
  value: number,
  decimals: number = 6
): bigint {
  return this.expectUint(Math.round(value * Math.pow(10, decimals)));
};

export function hexDecode(hex: string) {
  let bytes = [];
  hex.replace(/../g, function (pair) {
    bytes.push(parseInt(pair, 16));
  });
  return new Uint8Array(bytes).buffer;
}

// Convert hex to bytes
export function hexToBytes(hex: string) {
  return hexToBytesHelper(
    hex.substring(0, 2) === "0x" ? hex.substring(2) : hex
  );
}

export const REWARD_CYCLE_LENGTH = 21; // pox-3 is 2100
export const PREPARE_PHASE_LENGTH = 3; // pox-3 is 100

function hexToBytesHelper(hex: string) {
  if (typeof hex !== "string")
    throw new TypeError("hexToBytes: expected string, got " + typeof hex);
  if (hex.length % 2)
    throw new Error(
      `hexToBytes: received invalid unpadded hex, got: ${hex.length}`
    );
  const array = new Uint8Array(hex.length / 2);
  for (let i = 0; i < array.length; i++) {
    const j = i * 2;
    array[i] = Number.parseInt(hex.slice(j, j + 2), 16);
  }
  return array;
}
