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

  isBacktesting() {
    return (this.mode & BACKTEST) > 0;
  }

  isRecording() {
    return (this.mode & RECORD) > 0;
  }

  async init() {
    this.markets = await this.loadMarkets();
    // this is the set of feeds that act exactly the same whether we're live
    // or backtesting
    this.feed = new Feed(this, false);
    if (this.isBacktesting()) {
      this.backticker = {};
      this.backcandle = {};
    } else {
      this.time = +new Date();
    }
    this.indexMarkets(this.markets);
  }

  tick() {
    if (this.isBacktesting()) {
      this.time += 1000; // one second per tick in backtest mode
    } else {
      this.time = +new Date();
    }
  }

  addTickers(tickers, candles) {
    this.feed.addTickers(tickers, Ticker);
    this.feed.addTickers(candles, CandleTicker);
    if (this.isBacktesting()) {
      console.log("ok backtesting");
      tickers.forEach((ticker) => {
        const series = Series.FromTicker(this.feed.tickers[ticker]);
        this.backticker[ticker] = series;
        series.read();
        console.log("read tickers!", series);
      });

      candles.forEach((candle) => {
        const series = Series.FromCandle(this.feed.candles[candle]);
        this.backcandle[candle] = series;
        series.read();
        console.log("read candles!", series);
      });
    }
    this.feed.run();
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
    if (this.isBacktesting()) {
      return await this.backticker[pair].last();
    }
    return await this.api.fetchTicker(pair);
  }

  async fetchOHLCV(symbol, period="1m", since=undefined) {
    if (this.isBacktesting()) {
      let last = await this.backcandle[symbol].last();
      // have to format it as the ticker expects it from CCXT
      return this.backcandle[symbol].serializer.outCCXT(last);
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


  static async FromAPI(api, mode=RECORD) {
    let exchange = new Exchange(api, mode);
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

class Serializer {
  constructor(props) {
    this.props = props;
  }

  out(tick) {
    return this.props.map((prop) => tick[prop]).join(",");
  }

  in(xs) {
    let x = {};
    xs.split(",").forEach((value, i) => {
      x[this.props[i]] = Number(value);
    });
    return x;
  }
}

class TickerSerializer extends Serializer {
  constructor() {
    super(["timestamp", "high", "low", "bid", "bidVolume", "ask","askVolume", "vwap", "open", "close", "last", "change","baseVolume", "quoteVolume"]);
  }
}

class CandleSerializer extends Serializer {
  constructor() {
    super(["timestamp", "open", "high", "low", "close", "volume"]);
  }

  outCCXT(tick) {
    return [this.out(tick).split(",")];
  }
}



class Series {
  constructor(filepath, serializer, autoWrite=false) {
    this.filepath = filepath;
    this.serializer = serializer;
    this.autoWrite = autoWrite;
    this.data = {};
    this.series = [];
    this.lastWrite = 0;
    this.cursor = 0;
  }

  setCursorToTimestamp(timestamp) {

  }

  nearest(timestamp) {
    return su.bnearest(this.series, timestamp, (x) => timestamp - x.timestamp);
  }

  append(x, lock=false) {
    this.data[x.timestamp] = x;
    this.series = Object.values(this.data);
    if (this.autoWrite && !lock) this.write();
  }

  write() {
    let str = "";
    let n = this.length() - 1;
    for (var i = this.lastWrite; i < n; i++) {
      str += this.serializer.out(this.series[i]) + "\n";
    }
    if (str.length > 0) {
      fs.appendFile(this.filepath, str, (err) => {
        if (err) throw err;
        this.lastWrite = n;
      });
    }
  }

  read() {
    let file = fs.readFileSync(this.filepath, "utf8");
    file.split("\n").forEach((line) => {
      if (line.length > 0) {
        this.append(this.serializer.in(line));
      }
    });
  }

  length() {
    return this.series.length;
  }

  last() {
    return this.series[this.series.length-1];
  }

  getAt(idx) {
    if (idx < 0) {
      idx = this.length() + idx;
    }
    return this.series[idx];
  }

  static FromTicker(ticker) {
    return new Series(ticker.filepath(), new TickerSerializer(), ticker.record);
  }

  static FromCandle(ticker) {
    return new Series(ticker.filepath(), new CandleSerializer(), ticker.record);
  }
}

class Ticker {
  constructor(exchange, symbol, record, timeout=3000) {
    this.exchange = exchange;
    this.symbol = symbol;
    this.timeout = timeout;
    this.record = record;
    this.series = Series.FromTicker(this);
    this.lastWrite = 0;
  }

  async run() {
    while (true) {
      await this.step();
      await this.sleep();
    }
  }

  async step() {
    const tick = await this.exchange.fetchTicker(this.symbol);
    this.series.append(tick);
  }

  async sleep(timeout) {
    await xu.sleep(timeout ? timeout : this.timeout);
  }

  length() {
    return this.series.length;
  }

  getAt(idx) {
    return this.series.getAt(idx);
  }

  last() {
    return this.series.last();
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
}

class CandleTicker extends Ticker {
  constructor(exchange, symbol, record, timeout=20000, period="1m") {
    super(exchange, symbol, record, timeout);
    this.series = Series.FromCandle(this);
    this.period = period;
  }

  async step() {
    let last = this.last();
    let since = last ? last.timestamp : undefined;
    const tick = await this.exchange.fetchOHLCV(this.symbol, this.period, since);
    tick.forEach((candlestick) => {
      let cs = candlestick.join(",");
      this.series.append(this.series.serializer.in(cs), true);
    });
    if (this.series.autoWrite) this.series.write();
  }

  subdir() {
    return 'ohlcv';
  }

  extension() {
    return 'ohlcv';
  }
}

class Feed {
  constructor(exchange, backtest) {
    this.exchange = exchange;
    this.tickers = {};
    this.candles = {};
  }

  addTickers(symbols, Type=Ticker) {
    // probably all the feeds for a while
    let tickers = Type == Ticker ? this.tickers : this.candles;
    symbols.forEach((symbol) => {
      const ticker = new Type(this.exchange, symbol, this.exchange.isRecording());
      tickers[symbol] = ticker;
    });
  }

  run() {
    for (const symbol in this.tickers) {
      this.tickers[symbol].run();
    }
    for (const symbol in this.candles) {
      this.candles[symbol].run();
    }
  }
}

module.exports = {
  Portfolio: Portfolio,
  Exchange: Exchange,
  Feed: Feed,
  Ticker: Ticker,
  CandleTicker: CandleTicker,
  RECORD: RECORD,
  BACKTEST: BACKTEST
};
