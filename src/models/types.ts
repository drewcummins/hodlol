import { BigNumber } from "bignumber.js"
import { InvalidMarketSymbolError } from "../errors/exchange-error";

export function BN(x: Num):BigNumber {
  return new BigNumber(x);
}

export type Num = number | BigNumber;

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

  cost():Num {
    let amount = new BigNumber(this.amount);
    let price = new BigNumber(this.price);
    return amount.multipliedBy(price);
  }
}

export interface Order {
  side:OrderSide,
  id:string,
  symbol:string,
  status:OrderStatus,
  cost:Num,
  filled:Num
}

export interface Balance {
  free: BigNumber;
  reserved: BigNumber;
}

export interface IMarket {
  readonly symbol:string;
  readonly base:string;
  readonly quote:string;
  readonly maker:Num;
  readonly taker:Num;
}

export type Market = IMarket | undefined

type MarketMap = { [symbol:string]:Market };
type MarketMapMap = { [symbol:string]:MarketMap };

export class Marketplace {
  private symbolMap:MarketMap;
  private baseMap:MarketMapMap;
  private quoteMap:MarketMapMap;

  constructor(markets:MarketMap) {
    this.symbolMap = {};
    this.baseMap = {};
    this.quoteMap = {};

    for (const marketSymbol in markets) {
      const market = markets[marketSymbol];
      this.symbolMap[market.symbol] = market;
      this.baseMap[market.base] = this.baseMap[market.base] || {};
      this.baseMap[market.base][market.quote] = market;
      this.quoteMap[market.quote] = this.quoteMap[market.quote] || {};
      this.quoteMap[market.quote][market.base] = market;
    }
  }

  /**
   * Gets market for the given symbol
   * 
   * @param symbol Market symbol to grab
   * 
   * @returns market with given symbol
   */
  public getWithSymbol(symbol:string):Market {
    return this.getMarket(this.symbolMap, symbol);
  }

  /**
   * Gets market by base and quote symbols
   * 
   * @param base Base symbol of pair
   * @param quote Quote symbol of pair
   * 
   * @returns appropriate market
   */
  public getWithBase(base:string, quote:string):Market {
    let map = this.getMarketMap(this.baseMap, base);
    return this.getMarket(map, quote);
  }

  /**
   * Gets market by base and quote symbols
   * 
   * @param quote Quote symbol of pair
   * @param base Base symbol of pair
   * 
   * @returns appropriate market
   */
  public getWithQuote(quote:string, base:string):Market {
    let map = this.getMarketMap(this.quoteMap, quote);
    return this.getMarket(map, base);
  }



  private getMarket(map:MarketMap, symbol:string):Market {
    let market = this.symbolMap[symbol];
    if (market == undefined) {
      throw new InvalidMarketSymbolError(symbol);
    }
    return market;
  }

  private getMarketMap(mm:MarketMapMap, symbol:string):MarketMap {
    let map = mm[symbol];
    if (map == undefined) {
      throw new InvalidMarketSymbolError(symbol);
    }
    return map;
  }
}