'use strict';

const strat = require('./');
const sig = require('../signal');
const JumpThreshold = require('../signal/jump-threshold');

class BuyDipSellPeak extends strat.Strategy {
  constructor(params={}, weight=-1) {
    super(params, weight);
    this.title = "BDSP";
    this.filename = "buy-dip-sell-peak";
    this.threshold = params.threshold;
  }

  initIndicators(feed) {
    for (var symbol in feed.tickers) {
      // add a buy/sell threshold signal for each ticker
      this.indicators.push(new JumpThreshold(feed, symbol, -this.threshold));
      this.indicators.push(new JumpThreshold(feed, symbol, this.threshold));
    }
  }

  serialize() {
    let json = super.serialize();
    json.params.threshold = this.threshold;
    return json;
  }
}

module.exports = BuyDipSellPeak;
