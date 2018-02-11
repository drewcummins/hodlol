'use strict';

const BUY = 1;
const PASS = 0;
const SELL = -1;

class Signal {

  constructor(feed, symbol, json) {
    this.params = json;
    this.feed = feed;
    this.symbol = symbol;
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
    return {id: this.filename};
  }
}

class MultiSignal extends Signal {
  init() {
    this.subsignals = this.params.subsignals.map((sub) => {
      let sigClass = require(`./${sub.id}`);
      return deserialize(sigClass, sub, this.symbol, this.feed);
    });
  }

  serialize() {
    let json = super.serialize();
    json.subsignals = this.subsignals.map((subsignal) => subsignal.serialize());
    return json;
  }
}

let deserialize = (sigClass, json, symbol, feed) => {
  return new sigClass(feed, symbol, json);
}

module.exports = {
  Signal,
  MultiSignal,
  BUY,
  SELL,
  PASS,
  deserialize
};
