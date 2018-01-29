'use strict';

const BUY = 1;
const NULL = 0;
const SELL = -1;

class Signal {

  constructor(feed) {
    this.feed = feed;
    this.reads = {};
  }

  async tick(time) {
    return NULL;
  }

  markTickerRead(ticker) {
    const last = ticker.last();
    if (last) {
      this.reads[ticker.symbol] = last.timestamp;
    } else {
      this.reads[ticker.symbol] = 0;
    }
  }

  isTickerUpdated(ticker) {
    // console.log(ticker.symbol);
    if (!this.reads[ticker.symbol]) {
      this.reads[ticker.symbol] = 0;
    }
    const last = ticker.last();
    if (last) {
      return last.timestamp > this.reads[ticker.symbol];
    }
    return false;
  }
}

module.exports = {
  Signal: Signal,
  BUY: BUY,
  SELL: SELL,
  NULL: NULL
};
