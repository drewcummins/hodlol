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
  CANCELLED='cancelled'
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

export interface Order {
  type:OrderType
  side:OrderSide,
  id:ID,
  timestamp: number,
  symbol:string,
  status:OrderStatus,
  cost:Num,
  filled:Num,
  price:Num,
  amount:Num,
  remaining:Num,
  trades?:any[]
}

/*
let order = {
      id:        uuid(),
      timestamp: +new Date(),   // Unix timestamp in milliseconds
      status:    'open',          // 'open', 'closed', 'canceled'
      symbol:    request.market,  // symbol
      type:      'limit',         // 'market', 'limit'
      side:      'buy',           // 'buy', 'sell'
      price:     request.price,   // float price in quote currency
      amount:    request.amount,  // ordered amount of base currency
      cost:      request.price * request.amount,
      filled:    0.0,             // filled amount of base currency
      remaining: request.amount,  // remaining amount to fill
      trades:   []
    };
    this.orders.add(order);
    return order;
*/