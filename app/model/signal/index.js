'use strict';

const BUY = 1;
const PASS = 0;
const SELL = -1;

class Signal {

  constructor(feed, symbol, ticker="tickers") {
    this.feed = feed;
    this.symbol = symbol;
    this.ticker = ticker;
    this.last = 0;
  }

  async tick(time) {
    const tickers = this.feed.tickers;
    const ticker = tickers[this.symbol];
    if (this.isTickerUpdated(ticker)) {
      this.markTickerRead(ticker);
      return await this.evaluate(ticker);
    }
    return PASS;
  }

  async evaluate(ticker) {
    return PASS;
  }

  markTickerRead(ticker) {
    const last = ticker.last();
    if (last) this.last = last.timestamp;
  }

  isTickerUpdated(ticker) {
    const last = ticker.last();
    return last && last.timestamp > this.last;
  }
}

module.exports = {
  Signal: Signal,
  BUY: BUY,
  SELL: SELL,
  PASS: PASS
};
