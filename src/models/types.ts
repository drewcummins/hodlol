import { BigNumber } from "bignumber.js"

export function BN(x: Num):BigNumber {
  return new BigNumber(x);
}

export type Num = number | BigNumber;

export interface Balance {
  free: BigNumber;
  reserved: BigNumber;
}