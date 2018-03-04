import { Num } from './types'
import { InvalidMarketSymbolError } from "../errors";

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
    let markets = this.getMarketsWithBase(base);
    return this.getMarket(markets, quote);
  }

  /**
   * Gets markets by base
   * 
   * @param base Base symbol of pair
   * 
   * @returns matching markets
   */
  public getMarketsWithBase(base:string):MarketMap {
    return this.getMarketMap(this.baseMap, base);
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
    let markets = this.getMarketsWithQuote(quote);
    return this.getMarket(markets, base);
  }

  /**
   * Gets markets by quote
   * 
   * @param quote Quote symbol of pair
   * 
   * @returns matching markets
   */
  public getMarketsWithQuote(quote:string):MarketMap {
    return this.getMarketMap(this.quoteMap, quote);
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