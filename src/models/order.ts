import { BigNumber } from "bignumber.js"
import { BN, Num, ID } from "./types"
import { InvalidOrderTypeError } from "../errors";
import { IMarket } from "./market";

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

export abstract class OrderRequest {
  constructor(
    readonly type:OrderType,
    readonly side:OrderSide,
    readonly market:IMarket,
    readonly portfolioID:ID) {}
  
  abstract cost():Num;
  
  protected feeCoefficient():BigNumber {
    return OrderRequest.feeCoefficient(this.side, this.market.taker);
  }

  public static feeCoefficient(side:OrderSide, fee:Num):BigNumber {
    if (side == OrderSide.BUY) {
      return BN(fee).plus(1);
    }
    return BN(1).minus(BN(fee));
  }
}

export class MarketOrderRequest extends OrderRequest {
  constructor(side:OrderSide, market:IMarket, readonly balance:Num, portfolioID:ID) {
    super(OrderType.MARKET, side, market, portfolioID);
  }

  public cost():Num {
    return this.balance;
  }
}

export class LimitOrderRequest extends OrderRequest {
  constructor(side:OrderSide, market:IMarket, readonly amount:Num, readonly price:Num, portfolioID:ID) {
    super(OrderType.LIMIT, side, market, portfolioID);
  }

  public cost():Num {
    let amount = BN(this.amount);
    let price = BN(this.price);
    return amount.multipliedBy(price).multipliedBy(this.feeCoefficient());
  }

  public static buyMaxWithBudget(market:IMarket, budget:Num, price:Num, portfolioID:ID):LimitOrderRequest {
    // amount = b/(p*(1+f))
    let feeExponent = OrderRequest.feeCoefficient(OrderSide.BUY, market.taker);
    let amount:Num = BN(budget).dividedBy(BN(price).multipliedBy(feeExponent));
    
    return new LimitOrderRequest(OrderSide.BUY, market, amount, price, portfolioID);
  }
}

// these are just for convenience--provide no functionality except omitting side

export class MarketBuyOrderRequest extends MarketOrderRequest {
  constructor(market:IMarket, balance:Num, portfolioID:ID) {
    super(OrderSide.BUY, market, balance, portfolioID);
  }
}

export class MarketSellOrderRequest extends MarketOrderRequest {
  constructor(market:IMarket, balance:Num, portfolioID:ID) {
    super(OrderSide.SELL, market, balance, portfolioID);
  }
}

export class LimitBuyOrderRequest extends LimitOrderRequest {
  constructor(market:IMarket, amount:Num, price:Num, portfolioID:ID) {
    super(OrderSide.BUY, market, amount, price, portfolioID);
  }
}

export class LimitSellOrderRequest extends LimitOrderRequest {
  constructor(market:IMarket, amount:Num, price:Num, portfolioID:ID) {
    super(OrderSide.SELL, market, amount, price, portfolioID);
  }
}