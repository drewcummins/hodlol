import { BigNumber } from "bignumber.js"
import { BN, Num, ID } from "./types"

export enum OrderType {
  LIMIT_BUY,
  LIMIT_SELL,
  MARKET_BUY,
  MARKET_SELL
}

export enum OrderSide {
  BUY,
  SELL
}

export enum OrderStatus {
  OPEN='open',
  CLOSED='closed',
  CANCELLED='cancelled'
}

export class OrderRequest {
  readonly side:OrderSide;
  constructor(
    readonly type:OrderType,
    readonly marketSymbol:string, 
    readonly amount:Num, 
    readonly price:Num, 
    readonly portfolioID:string) {
    if (type == OrderType.LIMIT_BUY || type == OrderType.MARKET_BUY) {
      this.side = OrderSide.BUY;
    } else {
      this.side = OrderSide.SELL;
    }
  }

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

export interface Order {
  side:OrderSide,
  id:ID,
  symbol:string,
  status:OrderStatus,
  cost:Num,
  filled:Num
}