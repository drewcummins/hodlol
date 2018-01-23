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
      this.reads[ticker.market] = last.timestamp;
    } else {
      this.reads[ticker.market] = 0;
    }
  }

  isTickerUpdated(ticker) {
    if (!this.reads[ticker.market]) {
      this.reads[ticker.market] = 0;
    }
    const last = ticker.last();
    if (last) {
      return last.timestamp > this.reads[ticker.market];
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
