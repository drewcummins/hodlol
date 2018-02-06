'use strict';

const BUY = 1;
const PASS = 0;
const SELL = -1;

class Signal {

  constructor(feed, symbol, json) {
    this.params = json;
    this.feed = feed;
    this.symbol = symbol;
    this.ticker = json.ticker;
    this.last = 0;

    this.init();
  }

  init() {
    // no default
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

  serialize() {
    return {id: this.filename, ticker: this.ticker};
  }
}

class MultiSignal extends Signal {

}

module.exports = {
  Signal: Signal,
  BUY: BUY,
  SELL: SELL,
  PASS: PASS,
  deserialize: (sigClass, json, symbol, feed) => {
    return new sigClass(feed, symbol, json);
  },
  predeserialize: (sig) => {
    if (!sig.ticker) sig.ticker = "tickers";
  }
};
