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
      if (this.kill) break; // give each ticker a simple way to remove themselves
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
      this.exchange.invalidate(this, tick);
    });
    if (this.series.autoWrite) this.series.write();
  }

  extension() {
    return 'ohlcv';
  }
}

class OrderTicker extends Ticker {
  constructor(exchange, order, record, timeout=5000) {
    super(exchange, order.symbol, record, timeout);
    this.series = Series.FromOrder(this);
    this.orderID = order.id;
  }

  async step() {
    const tick = await this.exchange.fetchOrder(this.orderID, this.symbol);
    if (this.hasChanged(tick)) {
      this.series.append(tick);
      this.exchange.invalidate(this, tick);
    }
  }

  hasChanged(tick) {
    let last = this.last();
    if (!last) return true;
    if (last.status != tick.status) return true;
    if (last.filled != tick.filled) return true;
    return false;
  }

  extension() {
    return 'order';
  }
}

class Feed {
  constructor() {
    this.tickers = {};
    this.orders = {};
  }

  addOrder(exchange, order, portfolioID) {
    let timeout = exchange.isBacktesting() ? 1 : 5000;
    let ticker = new OrderTicker(exchange, order, exchange.isRecording(), timeout);
    ticker.portfolioID = portfolioID;
    this.orders[ticker.orderID] = ticker;
    ticker.run();
  }

  removeOrder(orderID) {
    delete this.orders[orderID];
  }

  addTickers(exchange, symbols, Type=Ticker, timeout=5000) {
    let tickers = this.tickers;
    symbols.forEach((symbol) => {
      const ticker = new Type(exchange, symbol, exchange.isRecording(), timeout);
      tickers[symbol] = ticker;
    });
  }

  run() {
    Object.values(this.tickers).forEach((ticker) => ticker.run());
  }

}

Feed.Ticker = Ticker;
Feed.CandleTicker = CandleTicker;

module.exports = Feed;
