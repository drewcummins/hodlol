import { ID, BN, API, BitState, BitfieldState, Scenario, ScenarioMode, Tick, TickerTick, OHLCVTick, OrderTick, Order, Ticker, OHLCV } from "./types";
import { Series } from "./series";
import { Marketplace, Market } from "./market";
import { OHLCVTicker, OrderTicker } from "./ticker";
import { OrderStatus, OrderRequest, OrderType, OrderSide, LimitOrderRequest } from "./order";
import { InvalidOrderSideError, InvalidOrderTypeError, InsufficientFundsError, InsufficientExchangeFundsError } from "../errors";
import { Portfolio } from "./portfolio";
import * as ccxt from "ccxt";

export type Feed = { candles:Map<string,OHLCVTicker>, orders:Map<string,OrderTicker> };

export class Exchange {
  public markets:Marketplace;
  readonly feed:Feed = { candles:new Map<string,OHLCVTicker>(), orders:new Map<string,OrderTicker>() };
  private portfolios:Map<ID,Portfolio> = new Map<ID,Portfolio>();
  readonly time:number = 0;
  private state:BitfieldState = new BitfieldState(); 
  private dirty:BitState;
  readonly marketsLoaded:BitState;
  readonly feedsLoaded:BitState;
  readonly tickersRunning:BitState;
  readonly fundsSufficient:BitState;
  
  constructor(readonly api:API) {
    [this.marketsLoaded, this.feedsLoaded, this.tickersRunning, this.fundsSufficient] = this.state.init(4);
    this.dirty = this.state.add();
  }

  /**
   * Registers a portfolio for the exchange to mutate
   * 
   * @param portfolio Portfolio to register
   */
  public registerPortfolio(portfolio:Portfolio):void {
    this.portfolios.set(portfolio.id, portfolio);
  }

  /** 
   * Marks the exchange to process a change in ticker/order state
  */
  public invalidate():void {
    this.state.set(this.dirty);
  }

  /** 
   * Opposite of invalidate
  */
  public clean():void {
    this.state.kill(this.dirty);
  }

  /** 
   * Gets the name of the current API being used
   * 
   * e.g. "binance"
   * 
   * @returns name of API
  */
  public name():string {
    return this.api.name.toLowerCase();
  }

  /** 
   * Indicates whether markets have been downloaded yet
   * 
   * @returns boolean
  */
  public hasMarkets():boolean {
    return this.state.isSet(this.marketsLoaded);
  }

  /** 
   * Indicates whether feeds have been initialized yet
   * 
   * @returns boolean
  */
  public hasFeeds():boolean {
    return this.state.isSet(this.feedsLoaded);
  }

  /** 
   * Indicates whether tickers have kicked off
   * 
   * @returns boolean
  */
  public areTickersRunning():boolean {
    return this.state.isSet(this.tickersRunning);
  }

  /** 
   * Indicates whether all things have been initalized
   * 
   * @returns true if feeds and markets are loaded, false otherwise
  */
  public isLoaded():boolean {
    return this.state.isComplete();
  }

  /** 
   * Indicates whether the exchange needs an update call
   * 
   * @returns true if exchange dirty
  */
  public isDirty():boolean {
    return this.state.isSet(this.dirty);
  }

  /** 
   * Indicates whether the funds requested are available
   * 
   * @returns true if funds are available
  */
 public hasSufficientFunds():boolean {
  return this.state.isSet(this.fundsSufficient);
}

  /** 
   * Grabs marketplace from API
  */
  public async loadMarketplace(tickers?:string[]) {
    if (!this.state.isSet(this.marketsLoaded)) {
      let marketMap = await this.loadMarkets();
      if (tickers) {
        let clone:any = {};
        tickers.forEach((ticker) => clone[ticker] = marketMap[ticker])
        marketMap = clone;
      }
      this.markets = new Marketplace(marketMap);
      this.state.set(this.marketsLoaded);
    }
  }

  /**
   * Loads all given tickers
   * 
   * @param tickers tickers for feed to load
   */
  public loadFeeds(tickers:string[]):void {
    if (!this.state.isSet(this.feedsLoaded)) {
      for (const symbol of tickers) {
        const ticker = this.addCandlestick(symbol);
      }
      this.state.set(this.feedsLoaded);
    }
  }

  /**
   * Validates that there are sufficient funds for the given symbol
   * 
   * @param fundSymbol Symbol to extract funds from
   * @param fundAmount Amount to use
   */
  public async validateFunds(fundSymbol:string, fundAmount:number):Promise<boolean> {
    if (Scenario.getInstance().mode == ScenarioMode.PLAYBACK) {
      this.state.set(this.fundsSufficient);
      return true;
    }
    let balance = await this.fetchBalance();
    if (balance[fundSymbol] && balance[fundSymbol].free >= fundAmount) {
      this.state.set(this.fundsSufficient);
      return true;
    }
    throw new InsufficientExchangeFundsError(fundSymbol, balance[fundSymbol].free, fundAmount);
  }

  /** 
   * Runs all tickers (each in their own "thread")
  */
  public runTickers():void {
    this.feed.candles.forEach((candle) => candle.run());
    this.state.set(this.tickersRunning);
  }

  /** 
   * Cleans up order tickers when status has changed to closed or cancelled
  */
  public processOrderState():void {
    this.feed.orders.forEach((ticker) => {
      const last:Order = ticker.last() as Order;
      const order:OrderTick = last.state;
      if (last) {
        // For right now, only act if the order is completely closed
        // TODO: Deal with partial fills
        if (order.status == OrderStatus.CLOSED || order.status == OrderStatus.CANCELED) {
          ticker.kill();
          this.feed.orders.delete(ticker.orderID);
          let portfolio:Portfolio = this.portfolios.get(ticker.portfolioID);
          if (portfolio) portfolio.fill(last);
        }
      }
    })
  }

  /** 
   * Gets the given exchange API's markets
   * 
   * @returns markets
  */
  public async loadMarkets() {
    return await this.api.loadMarkets();
  }

  /**
   * Gets ticker data for given pair
   * 
   * @param pair market pair to grab ticker info for
   * 
   * @returns ticker data
   */
  public async fetchTicker(pair:string):Promise<Ticker> {
    return new Tick(await this.api.fetchTicker(pair));
  }

  /**
   * Gets candlestick (open, high, low, close, volume) data for @symbol
   * 
   * @param symbol market symbol to grab
   * @param period timescale to build candlesticks from
   * @param since start time to grab data from
   * 
   * @returns candlestick data
   */
  public async fetchOHLCV(symbol:string, period:string="1m", since:number|undefined=undefined):Promise<OHLCV[]> {
    let ohlcvs:OHLCVTick[] = await this.api.fetchOHLCV(symbol, period, since);
    return ohlcvs.map((ohlcv) => new OHLCV(Object.assign(ohlcv, {timestamp:ohlcv[0]})));
  }

  /**
   * Gets an order by given ID
   * 
   * @param orderID ID of order to grab
   * @param symbol symbol associated with that order (don't know why exchanges operate like this)
   * 
   * @return requested order if it exists
   */
  public async fetchOrder(orderID:string, symbol:string):Promise<Order> {
    return new Tick(await this.api.fetchOrder(orderID, symbol));
  }

  /**
   * Cancels an order by id
   * 
   * @param orderID ID of order to cancel
   * 
   * @return 
   */
  public async cancelOrder(orderID:ID):Promise<any> {
    return await this.api.cancelOrder(orderID);
  }

  /** 
   * Gets exchange balance
   * 
   * @returns balance hash
  */
  public async fetchBalance() {
    return await this.api.fetchBalance();
  }

  /**
   * Creates an order according to the given OrderRequest
   * 
   * @param request Order request
   * 
   * @returns the newly created order
   * @throws InvalidOrderTypeError if an invalid order type is set
   */
  public async createOrder(request:OrderRequest):Promise<Order> {
    let order:Order = null;
    let portfolio = this.portfolios.get(request.portfolioID);
    portfolio.reserve(request);
    switch (request.type) {
      case OrderType.LIMIT:
        let limit:LimitOrderRequest = request as LimitOrderRequest;
        switch (request.side) {
          case OrderSide.BUY:
            order = new Order(await this.api.createLimitBuyOrder(limit.market.symbol, limit.amount, limit.price));
            break;
          case OrderSide.SELL:
            order = new Order(await this.api.createLimitSellOrder(limit.market.symbol, limit.amount, limit.price));
            break;
        
          default:
            throw new InvalidOrderSideError(request);
        }
        break;
    
      default:
        throw new InvalidOrderTypeError(request);
    }
    this.addOrder(order, portfolio.id);
    return order;
  }

  /**
   * Creates a new candlestick ticker for @symbol
   * 
   * @param symbol market symbol to track candlestick data for
   * 
   * @returns the candleticker
   */
  public addCandlestick(symbol:string):OHLCVTicker {
    const ticker = new OHLCVTicker(this, symbol);
    this.feed.candles.set(symbol, ticker);
    return ticker;
  }

  /**
   * Creates a ticker to follow an order
   * 
   * @param order order to track
   * 
   * @returns the OrderTicker
   */
  protected addOrder(order:Order, portfolioID:ID):OrderTicker {
    const ticker = new OrderTicker(this, order, portfolioID);
    this.feed.orders.set(order.state.id, ticker);
    ticker.run();
    return ticker;
  }

  /**
   * Calculates price for @base in @quote units
   * 
   * @param base base symbol
   * @param quote quote symbol
   * 
   * @returns price value
   */
  public async price(base:string, quote:string):Promise<number> {
    let path = this.path(base, quote);
    if (path) {
      let price = 1;
      for (var i = 0; i < path.length; i++) {
        let pair:string = path[i];
        let ticker = this.feed.candles.get(pair);
        if (ticker && ticker.length() > 0) {
          let tick:OHLCV = ticker.last() as OHLCV;
          price *= tick.close;
        } else {
          let tick:OHLCV[] = await this.fetchOHLCV(pair);
          price *= tick[tick.length-1].close;
        }
      }
      return price;
    } else {
      return NaN;
    }
  }

  /**
   * Calculates a market path from market a to market b
   * 
   * @param a symbol to start from
   * @param b symbol to go to
   * 
   * @returns the path if one exists, null otherwise
   */
  public path(a:string, b:string):string[] | null {
    let path = this._path(a, b);
    if (!path) {
      path = this._path(b, a);
      if (path) path = path.reverse();
    }
    return path;
  }

  private _path(a:string, b:string):string[] | null {
    try {
      let markets = this.markets.getMarketsWithBase(a);
      if (markets[b]) return [markets[b].symbol];
      let path = null;
      for (const sym in markets) {
        let p = this._path(sym, b);
        if (p == null) continue;
        if (path == null || p.length < path.length - 1) {
          path = [markets[sym].symbol].concat(p);
        }
      }
      return path;
    } catch (error) {
      return null;
    }
  }
}