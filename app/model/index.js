'use strict';

const config = require('../../config');
const uuid = require('uuid/v4');
const xu = require('../util/exchange');
const su = require('../util/search');
const fs = require('fs');

const RECORD = 1;
const BACKTEST = 2;

class Exchange {

  constructor(api, mode=RECORD) {
    this.api = api;
    this.mode = mode;
    this.name = api.name.toLowerCase();
  }

  async init() {
    this.markets = await this.loadMarkets();
    // this is the set of feeds that act exactly the same whether we're live
    // or backtesting
    this.feed = new Feed(this);
    if (this.mode & BACKTEST) {
      // if we're backtesting, create tickers that will mock the API calls
      this.backtick = new Ticker();
    }
    this.indexMarkets(this.markets);
  }

  /*
    Maps symbol pairs, base symbols and quote symbols to associated markets
    e.g. markets.symbol['XMR/BTC'] gives you a hash with base XMR and quote BTC
    Base and quote each give you a hash keyed by the other value.

    @markets Markets hash returned from exchange API
  */
  indexMarkets(markets) {
    this.markets = {symbol: {}, base:{}, quote:{}};
    let [s,b,q] = [this.markets.symbol, this.markets.base, this.markets.quote];
    for (const symbol in markets) {
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
    if (this.mode & BACKTEST) {

    }
    return await this.api.fetchTicker(pair);
  }

  async fetchOHLCV(symbol, period="1m", since=undefined) {
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

class Portfolio {
  constructor(exchange) {
    this.id = uuid();
    this.exchange = exchange;
    this.balances = {};
  }

  add(symbol, amount) {
    if (!this.balances[symbol]) {
      this.balances[symbol] = 0;
    }
    this.balances[symbol] += amount;
  }

  remove(symbol, amount) {
    this.add(symbol, -amount);
  }

  balance(symbol) {
    if (!this.balances[symbol]) return 0;
    return this.balances[symbol];
  }

  balanceByMarket(symbol, side="quote") {
    let market = this.exchange.sym(symbol);
    if (!market) return 0;
    return this.balance(market[side]);
  }

  async value(quote='USDT') {
    let value = {total: 0};
    for (var base in this.balances) {
      if (base == quote) {
        value.total += this.balances[base];
        value[base] = this.balances[base];
        continue;
      }
      let rate = await this.exchange.price(base, quote);
      value[base] = rate * this.balances[base];
      value.total += value[base];
    }
    return value;
  }
}

class Ticker {
  constructor(exchange, symbol, record, timeout=3000) {
    this.exchange = exchange;
    this.symbol = symbol;
    this.timeout = timeout;
    this.ticks = [];
    this.record = record;
    this.lastWrite = 0;
  }

  async run() {
    while (true) {
      this.step();
      await this.sleep();
    }
  }

  async step() {
    const tick = await this.exchange.fetchTicker(this.symbol);
    this.ticks.push(tick);
    this.write();
  }

  filename() {
    return `${this.symbol.replace("/", "-")}.${this.extension()}`;
  }

  subdir() {
    return `ticker/${config.dateID}`
  }

  filepath() {
    return `./data/${this.exchange.name.toLowerCase()}/${this.subdir()}/${this.filename()}`;
  }

  extension() {
    return 'ticker';
  }

  serializeTick(tick) {
    return [tick.timestamp, tick.high, tick.low, tick.bid, tick.bidVolume,
            tick.ask, tick.askVolume, tick.vwap, tick.open, tick.close, tick.last,
            tick.change, tick.baseVolume, tick.quoteVolume].join(",");
  }

  nearest(timestamp) {
    return su.bnearest(this.ticks, timestamp, this.compareLambda(timestamp));
  }

  compareLambda(timestamp) {
    return (x) => timestamp - x.timestamp;
  }

  write() {
    if (this.record) {
      let str = "";
      // don't go all the way to the end as the candlestick data gets updated
      // once we have an extra one, the previous should be written in stone
      let n = this.ticks.length - 1;
      for (var i = this.lastWrite; i < n; i++) {
        str += this.serializeTick(this.ticks[i]) + "\n";
      }
      fs.appendFile(this.filepath(), str, (err) => {
        if (err) throw err;
        this.lastWrite = n;
      });
    }
  }

  async sleep(timeout) {
    await xu.sleep(timeout ? timeout : this.timeout);
  }

  length() {
    return this.ticks.length;
  }

  getAt(idx) {
    if (idx < 0) {
      idx = this.length() + idx;
    }
    return this.ticks[idx];
  }

  last() {
    return this.ticks[this.length() - 1];
  }

  static FromScenario(symbol) {
    let ticker = new Ticker(null, symbol, false);
    let file = fs.readFileSync(ticker.filepath());
    
  }
}

class CandleTicker extends Ticker {
  constructor(exchange, symbol, record, timeout=20000, period="1m") {
    super(exchange, symbol, record, timeout);
    this.period = period;
    this.candlesticks = {};
  }

  async step() {
    let since = undefined;
    let last = this.last();
    if (last) {
      since = last[0];
    }
    const tick = await this.exchange.fetchOHLCV(this.symbol, this.period, since);
    tick.forEach((candlestick) => {
      let [timestamp] = candlestick;
      this.candlesticks[timestamp] = candlestick;
    })
    this.ticks = Object.values(this.candlesticks);
    this.write();
  }

  subdir() {
    return 'ohlcv';
  }

  compareLambda(timestamp) {
    return (x) => timestamp - x[0];
  }

  extension() {
    return 'ohlcv';
  }

  serializeTick(tick) {
    return tick.join(",");
  }
}

class Feed {
  constructor(exchange) {
    this.exchange = exchange;
    this.tickers = {};
    this.candles = {};
  }

  addTicker(symbol, record) {
    const ticker = new Ticker(this.exchange, symbol, record, 3000);
    ticker.run();
    this.tickers[symbol] = ticker;
  }

  addCandleTicker(symbol, record) {
    const ticker = new CandleTicker(this.exchange, symbol, record, 60000);
    ticker.run();
    this.candles[symbol] = ticker;
  }
}

module.exports = {
  Portfolio: Portfolio,
  Exchange: Exchange,
  Feed: Feed,
};
