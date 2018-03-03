import { BigNumber } from "bignumber.js"
import { BN, Num, ID } from "./types"
import { InvalidOrderTypeError } from "../errors/exchange-error";

export enum OrderSide {
  BUY='buy',
  SELL='sell'
}

export enum OrderType {
  MARKET='market',
  LIMIT='limit'
}

export enum OrderStatus {
  OPEN='open',
  CLOSED='closed',
  CANCELED='canceled'
}

export class OrderRequest {
  
  constructor(
    readonly type:OrderType,
    readonly side:OrderSide,
    readonly marketSymbol:string, 
    readonly amount:Num, 
    readonly price:Num, 
    readonly portfolioID:string) {}

  /** 
   * Calculates the cost of the order
   * 
   * @returns cost
  */
  public cost():Num {
    let amount = new BigNumber(this.amount);
    let price = new BigNumber(this.price);
    return amount.multipliedBy(price);
  }
}