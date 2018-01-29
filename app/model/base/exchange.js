'use strict';

const Feed = require('./feed');
const MockAPI = require('./mock-api');
const Series = require('./series');
const config = require('../../../config');

const RECORD = 1;
const BACKTEST = 2;

class Exchange {

  constructor(api) {
    this.api = api;
    this.mode = 0;
    if (config.record) this.mode |= RECORD;
    if (config.backtest) this.mode = BACKTEST; // let this override for now
    this.name = api.name.toLowerCase();
  }

  isBacktesting() {
    return (this.mode & BACKTEST) > 0;
  }

  isRecording() {
    return (this.mode & RECORD) > 0;
  }

  async init() {
    this.feed = new Feed();
    this.markets = await this.loadMarkets();
    if (this.isBacktesting()) this.time = config.scenario.start;
    this.indexMarkets(this.markets);
  }

  tick() {
    if (this.isBacktesting()) this.time += 1000; // one second per tick in backtest mode
  }

  addTickers(tickers, candles) {
    this.feed.addTickers(this, tickers, Feed.Ticker, config.backtest ? 1 : 5000);
    this.feed.addTickers(this, candles, Feed.CandleTicker, config.backtest ? 1 : 35000);
    if (this.isBacktesting()) {
      this.mockAPI = new MockAPI(this.feed);
      this.mockAPI.read();
    }
  }

  /*
    Maps symbol pairs, base symbols and quote symbols to associated markets
    e.g. markets.symbol['XMR/BTC'] gives you a hash with base XMR and quote BTC
    Base and quote each give you a hash keyed by the other value.

    @markets Markets hash returned from exchange API
    @constrainToTickers Only build a map for tracked markets
  */
  indexMarkets(markets, constrainToTickers=true) {
    this.markets = {symbol: {}, base:{}, quote:{}};
    let [s,b,q] = [this.markets.symbol, this.markets.base, this.markets.quote];
    for (const symbol in markets) {
      if (constrainToTickers && !this.feed.tickers[symbol]) continue;
      const market = markets[symbol];
      if (!market.darkpool) {
        s[market.symbol] = market;
        if (!b[market.base]) {
          b[market.base] = {};
        }
        if (!q[market.quote]) {
          q[market.quote] = {};
        }
        b[market.base][market.quote] = market;
        q[market.quote][market.base] = market;
      }
    }
  }

  // This API stuff just wraps the ccxt exchange.
  // This makes it simpler to fake calls in backtest mode.
  async loadMarkets() {
    // This might make sense to write on record runs
    // But for now, let's just always load it from the API
    return await this.api.loadMarkets();
  }

  async fetchTicker(pair) {
    if (this.isBacktesting()) {
      console.log("fetch!", this.time);
      return this.mockAPI.fetchTicker(pair, this.time);
    }
    return await this.api.fetchTicker(pair);
  }

  async fetchOHLCV(symbol, period="1m", since=undefined) {
    if (this.isBacktesting()) {
      return this.mockAPI.fetchOHLCV(symbol, this.time);
    }
    return await this.api.fetchOHLCV(symbol, period, since);
  }

  // Gets market for @symbol
  // e.g. XMR/BTC
  sym(symbol) {
    return this.markets.symbol[symbol];
  }

  // Gets list of markets for base @symbol
  base(symbol) {
    return this.markets.base[symbol];
  }

  // Gets list of markets for quote @symbol
  quote(symbol) {
    return this.markets.quote[symbol];
  }

  // Gets market for @base @quote pair
  baseQuote(base, quote) {
    return this.markets.base[base][quote];
  }

  async price(base, quote) {
    let path = this.path(base, quote);
    if (path) {
      let price = 1;
      for (var i = 0; i < path.length; i++) {
        let pair = path[i];
        let ticker = this.feed.tickers[pair];
        if (ticker && ticker.length() > 0) {
          let tick = ticker.last(); // last here means most recent tick
          price *= tick.last; // last here means most recent price
        } else {
          let tick = await this.fetchTicker(pair);
          price *= tick.last;
        }
      }
      return price;
    } else {
      return NaN;
    }
  }
  /*
    Builds a market path between @a and @b
  */
  path(a, b) {
    let path = this._path(a, b);
    if (!path) path = this._path(a, b, false);
    return path;
  }

  _path(a, b, dir=true) {
    let [as, bs] = dir ? ["base", "quote"] : ["quote", "base"];
    let market = this.markets[as][a];
    if (!market) return null;
    if (market[b]) {
      // if this is already a market pair, we're done
      return [market[b].symbol];
    }
    let path = null;
    for (var sym in market) {
      let p = this._path(market[sym][bs], b, dir);
      if (p == null) continue;
      if (path == null || p.length < path.length - 1) {
        path = [market[sym].symbol].concat(p);
      }
    }
    return path;
  }


  static async FromAPI(api) {
    let exchange = new Exchange(api);
    await exchange.init();
    return exchange;
  }
}

module.exports = Exchange;
