'use strict';

const Feed = require('./feed');
const MockAPI = require('./mock-api');
const Series = require('./series');
const config = require('../../../config');
const xu = require('../../util/exchange');

const RECORD = 1;
const BACKTEST = 2;
const FAKE = 4;

const ORDER_STATUS_OPEN = 'open';
const ORDER_STATUS_CLOSED = 'closed';
const ORDER_STATUS_CANCELED = 'canceled';

class Exchange {

  constructor(api) {
    this.api = api;
    this.mode = 0;
    this.dirty = false;
    this.portfolios = {};
    if (config.record) this.mode |= RECORD;
    if (config.backtest) this.mode = BACKTEST | FAKE; // let this override for now
    if (config.fakeOrders) this.mode |= FAKE;
    this.timeout = this.requiresMock() ? 1 : 15000;
    this.name = api.name.toLowerCase();
    this.time = 0;
  }

  isBacktesting() {
    return (this.mode & BACKTEST) > 0;
  }

  isRecording() {
    return (this.mode & RECORD) > 0;
  }

  isFaked() {
    return (this.mode & FAKE) > 0;
  }

  requiresMock() {
    return (this.mode & (FAKE | BACKTEST)) > 0;
  }

  invalidate(timestamp) {
    if (timestamp > this.time) {
      this.time = timestamp;
    }
    this.dirty = true;
  }

  processOrderState() {
    Object.values(this.feed.orders).forEach((order) => {
      let last = order.last();
      if (last) {
        if (last.status == ORDER_STATUS_CLOSED || last.status == ORDER_STATUS_CANCELED) {
          order.kill = true;
          delete this.feed.orders[order.orderID];
          let portfolio = this.portfolios[order.portfolioID];
          if (portfolio) portfolio.fill(last);
        }
      }
    });
  }

  async isValid(symbol, amount) {
    let balance = await this.fetchBalance();
    if (this.isFaked()) {
      balance.free[symbol] = amount;
    }
    return (balance.free != undefined) && (balance.free[symbol] != undefined) && (balance.free[symbol] >= amount);
  }

  async init() {
    this.feed = new Feed();
    this.markets = await this.loadMarkets();
    if (this.isBacktesting()) this.time = config.scenario.start;
  }

  addTickers(tickers, candles) {
    this.feed.addTickers(this, tickers, Feed.Ticker, config.backtest ? 1 : 5000);
    this.feed.addTickers(this, candles, Feed.CandleTicker, config.backtest ? 1 : 35000);
    this.indexMarkets(this.markets);
    if (this.requiresMock()) {
      this.mockAPI = new MockAPI(this.feed);
      // only read local files if we're backtesting
      if (this.isBacktesting()) this.mockAPI.read();
      this.mockAPI.run();
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

  async createLimitBuyOrder(request) {
    let order = null;
    if (this.isFaked()) {
      order = this.mockAPI.createLimitBuyOrder(request);
    } else {
      order = await this.api.createLimitBuyOrder(request.market, request.amount, request.price);
    }
    this.feed.addOrder(this, order, request.portfolioID);
    return order;
  }

  async createLimitSellOrder(request) {
    let order = null;
    if (this.isFaked()) {
      order = this.mockAPI.createLimitSellOrder(request);
    } else {
      order = await this.api.createLimitSellOrder(request.market, request.amount, request.price);
    }
    this.feed.addOrder(this, order, request.portfolioID);
    return order;
  }

  async fetchOrders(symbol=undefined, since=undefined, limit=undefined) {
    if (since == undefined) {
      since = xu.START_TIME;
    }
    if (this.isFaked()) {
      return this.mockAPI.fetchOrders(symbol, since, limit);
    }
    return await this.api.fetchOrders(symbol, since, limit);
  }

  async fetchOrder(orderID, symbol) {
    if (this.isFaked()) {
      return this.mockAPI.fetchOrder(orderID);
    }
    return await this.api.fetchOrder(orderID, symbol);
  }

  async fetchBalance() {
    if (this.isFaked()) {
      return this.mockAPI.fetchBalance();
    }
    return await this.api.fetchBalance();
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
