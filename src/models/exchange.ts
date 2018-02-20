import { BN, API, BitState, BitfieldState } from "./types";
import { Series } from "./series";
import { Marketplace, Market } from "./market";
import { CandleTicker, OrderTicker } from "./ticker";
import { Order, OrderStatus, OrderRequest, OrderType } from "./order";
import { InvalidOrderSideError, InvalidOrderTypeError } from "../errors/exchange-error";

export type Feed = { candles:Map<string,CandleTicker>, orders:Map<string,OrderTicker> };

export class Exchange {
  public markets:Marketplace;
  readonly feed:Feed = { candles:new Map<string,CandleTicker>(), orders:new Map<string,OrderTicker>() };
  readonly time:number = 0;
  private state:BitfieldState = new BitfieldState(); 
  private dirty:BitState;
  readonly marketsLoaded:BitState;
  readonly feedsLoaded:BitState;
  
  constructor(private api:API) {
    [this.marketsLoaded, this.feedsLoaded] = this.state.init(2);
    this.dirty = this.state.add();
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
   * Grabs marketplace from API
  */
  public async loadMarketplace() {
    if (!this.state.isSet(this.marketsLoaded)) {
      let marketMap = await this.loadMarkets();
      this.markets = new Marketplace(marketMap);
      this.state.set(this.marketsLoaded);
    }
  }

  /**
   * Loads all given tickers
   * 
   * @param tickers tickers for feed to load
   */
  public async loadFeeds(tickers:string[]) {
    if (!this.state.isSet(this.feedsLoaded)) {
      for (const symbol of tickers) {
        const ticker = this.addCandlestick(symbol);
        // if backtest
        await ticker.read();
        ticker.run();
      }
      this.state.set(this.feedsLoaded);
    }
  }

  /** 
   * Kills all feeds so we can exit
  */
  public killFeeds() {
    if (this.state.isSet(this.feedsLoaded)) {
      for (const [_, ticker] of this.feed.candles) {
        ticker.kill = true;
      }
      this.state.kill(this.feedsLoaded);
    }
  }

  /** 
   * Cleans up order tickers when status has changed to closed or cancelled
  */
  public processOrderState():void {
    Array.from(this.feed.orders.values()).forEach((ticker) => {
      const last = ticker.last();
      if (last) {
        if (last.status == OrderStatus.CLOSED || last.status == OrderStatus.CANCELLED) {
          ticker.kill = true;
          this.feed.orders.delete(ticker.orderID);
          // let portfolio = this.portfolios[order.portfolioID];
          // if (portfolio) portfolio.fill(last);
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
  public async fetchTicker(pair:string) {
    return await this.api.fetchTicker(pair);
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
  public async fetchOHLCV(symbol:string, period:string="1m", since:number|undefined=undefined) {
    return await this.api.fetchOHLCV(symbol, period, since);
  }

  /**
   * Gets an order by given ID
   * 
   * @param orderID ID of order to grab
   * @param symbol symbol associated with that order (don't know why exchanges operate like this)
   * 
   * @return requested order if it exists
   */
  public async fetchOrder(orderID:string|number, symbol:string) {
    return await this.api.fetchOrder(orderID, symbol);
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
    switch (request.type) {
      case OrderType.LIMIT_BUY:
        order = await this.api.createLimitBuyOrder(request.marketSymbol, request.amount, request.price);
        break;
      case OrderType.LIMIT_SELL:
        order = await this.api.createLimitSellOrder(request.marketSymbol, request.amount, request.price);
        break;
    
      default:
        throw new InvalidOrderTypeError(request);
    }
    this.addOrder(order);
    return order;
  }

  /**
   * Creates a new candlestick ticker for @symbol
   * 
   * @param symbol market symbol to track candlestick data for
   * 
   * @returns the candleticker
   */
  public addCandlestick(symbol:string):CandleTicker {
    const ticker = new CandleTicker(this, symbol);
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
  public addOrder(order:Order):OrderTicker {
    const ticker = new OrderTicker(this, order);
    this.feed.orders.set(order.id, ticker);
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
          let tick = ticker.last(); // last here means most recent tick
          price *= Number(tick.close);
        } else {
          let tick = await this.fetchTicker(pair);
          price *= tick.close;
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