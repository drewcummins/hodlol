'use strict';

const sig = require('./index')

class HugeDive extends sig.Signal {
  constructor(feeds) {
    super(feeds);
  }

  async tick(time) {
    const tickers = this.feeds.tickers;
    let buys = [];
    for (var symbol in tickers) {
      const ticker = tickers[symbol];
      if (this.isTickerUpdated(ticker)) {
        this.markTickerRead(ticker);
        if (this.isHugeDive(ticker)) {
          buys.push(symbol);
        }
      }
    }
    return buys;
  }

  isHugeDive(ticker) {
    if (ticker.length() < 2) {
      return false;
    }
    return ticker.getAt(-1).ask / ticker.getAt(-2).ask < 0.999;
  }

}

module.exports = HugeDive;
