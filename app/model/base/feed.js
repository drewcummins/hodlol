'use strict';
const xu = require('../../util/exchange');
const Series = require('./series');
const config = require('../../../config');

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

Feed.Ticker = Ticker;
Feed.CandleTicker = CandleTicker;

module.exports = Feed;
