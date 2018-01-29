'use strict';
const xu = require('../../util/exchange');
const Series = require('./series');
const config = require('../../../config');

class Ticker {
  constructor(exchange, symbol, record, timeout=5000) {
    this.exchange = exchange;
    this.symbol = symbol;
    this.timeout = timeout;
    this.record = record;
    this.series = Series.FromTicker(this);
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
    this.exchange.invalidate(this, tick);
  }

  async sleep(timeout) {
    await xu.sleep(timeout ? timeout : this.timeout);
  }

  length() {
    return this.series.length();
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
    return `${config.dateID}`
  }

  filepath() {
    return `./data/${this.exchange.name.toLowerCase()}/${this.subdir()}/${this.filename()}`;
  }

  extension() {
    return 'ticker';
  }
}

class CandleTicker extends Ticker {
  constructor(exchange, symbol, record, timeout=35000, period="1m") {
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

  extension() {
    return 'ohlcv';
  }
}

class Feed {
  constructor() {
    this.tickers = {};
    this.candles = {};
  }

  addTickers(exchange, symbols, Type=Ticker, timeout=5000) {
    // probably all the feeds for a while
    let tickers = Type == Ticker ? this.tickers : this.candles;
    symbols.forEach((symbol) => {
      const ticker = new Type(exchange, symbol, exchange.isRecording(), timeout);
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

Feed.Ticker = Ticker;
Feed.CandleTicker = CandleTicker;

module.exports = Feed;
