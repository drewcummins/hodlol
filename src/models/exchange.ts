import { API, BitState, BitfieldState } from "./types";
import { Series } from "./series";
import { Marketplace, Market } from "./market";
import { CandleTicker, OrderTicker } from "./ticker";
import { Order, OrderStatus } from "./order";

type Feed = { candles:Map<string,CandleTicker>, orders:Map<string,OrderTicker> };

export class Exchange {
  private markets:Marketplace;
  readonly feed:Feed = { candles:new Map<string,CandleTicker>(), orders:new Map<string,OrderTicker>() };
  readonly time:number = 0;
  private state:BitfieldState = new BitfieldState(); 
  private dirty:BitState;
  readonly marketsLoaded:BitState;
  readonly feedsLoaded:BitState;
  
  constructor(private api:API) {
    [this.marketsLoaded, this.feedsLoaded] = this.state.init(2);
    this.dirty = this.state.add(false, false);
  }

  public invalidate():void {
    this.state.set(this.dirty);
  }

  public clean():void {
    this.state.kill(this.dirty);
  }

  public name():string {
    return this.api.name.toLowerCase();
  }

  public hasMarkets():boolean {
    return this.state.isSet(this.marketsLoaded);
  }

  public hasFeeds():boolean {
    return this.state.isSet(this.feedsLoaded);
  }

  public isLoaded():boolean {
    return this.state.isComplete();
  }

  public async loadMarketplace() {
    if (!this.state.isSet(this.marketsLoaded)) {
      let marketMap = await this.loadMarkets();
      this.markets = new Marketplace(marketMap);
      this.state.set(this.marketsLoaded);
    }
  }

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

  private processOrderState():void {
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

  public async loadMarkets() {
    return await this.api.loadMarkets();
  }

  public async fetchTicker(pair:string) {
    return await this.api.fetchTicker(pair);
  }

  public async fetchOHLCV(symbol:string, period:string="1m", since:number|undefined=undefined) {
    return await this.api.fetchOHLCV(symbol, period, since);
  }

  public async fetchOrder(orderID:string|number, symbol:string) {
    return await this.api.fetchOrder(orderID, symbol);
  }

  public async fetchBalance() {
    return await this.api.fetchBalance();
  }

  public addCandlestick(symbol:string):CandleTicker {
    const ticker = new CandleTicker(this, symbol);
    this.feed.candles.set(symbol, ticker);
    return ticker;
  }

  public addOrder(order:Order):OrderTicker {
    const ticker = new OrderTicker(this, order);
    this.feed.orders.set(order.id, ticker);
    return ticker;
  }

  public async price(base:string, quote:string) {
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

  public path(a:string, b:string):string[] {
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