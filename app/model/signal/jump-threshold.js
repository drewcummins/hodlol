'use strict';

const sig = require('./index')

class JumpThreshold extends sig.Signal {
  // @threshold percent growth over previous step
  // e.g. t1 = 10, t2 = 12 represents 20% growth or 0.2
  // t1 = 10, t2 = 8 represents -20% growth or -0.2
  constructor(feed, threshold) {
    super(feed);
    this.threshold = threshold;
  }

  async tick(time) {
    const tickers = this.feed.tickers;
    let moves = [];
    for (var symbol in tickers) {
      const ticker = tickers[symbol];
      if (this.isTickerUpdated(ticker)) {
        this.markTickerRead(ticker);
        if (this.exceedsThreshold(ticker)) {
          moves.push(symbol);
        }
      }
    }
    return moves;
  }

  exceedsThreshold(ticker) {
    if (ticker.length() < 2) {
      return false;
    }

    if (this.threshold > 0) {
      let growth = ticker.getAt(-1).bid / ticker.getAt(-2).bid;
      return growth - 1 >= this.threshold;
    }
    let growth = ticker.getAt(-1).ask / ticker.getAt(-2).ask;
    return growth - 1 <= this.threshold;
  }

}

module.exports = JumpThreshold;
