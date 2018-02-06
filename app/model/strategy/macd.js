'use strict';

const strat = require('./index');
const MACD = require('../signal/macd');

class MACDStrat extends strat.Strategy {
  constructor(params={}, weight=-1) {
    super(params, weight);
    this.title = "MACD";
    this.filename = "macd";
    if (!params.ticker) {
      this.ticker = "tickers";
    }
    if (!params.props) {
      this.props = ["close"];
    }
    if (!params.periods) {
      this.periods = [2,5,9];
    }
  }

  initIndicators(feed) {
    for (var symbol in feed.tickers) {
      // add a buy/sell threshold signal for each ticker
      this.indicators.push(new MACD(feed, symbol, this.props, this.periods));
    }
  }

}

module.exports = MACDStrat;
