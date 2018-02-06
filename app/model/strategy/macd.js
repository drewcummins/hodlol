'use strict';

const strat = require('./index');
const tulind = require('tulind');

class MACD extends strat.Strategy {
  constructor(params={}, weight=-1) {
    super(params, weight);
    this.title = "Moving Average Convergence Divergence";
    this.filename = "macd";
    if (!params.ticker) {
      this.ticker = "tickers";
    }
    if (!params.props) {
      this.props = ["close"];
    }
    if (!params.periods) {
      this.periods = [14, 28, 56];
    }
  }

  async tick() {
    // we're going to suggest buying when the price falls below a moving average
    let ticker = this.feed[this.ticker];
    for (var market in ticker) {
      let series = ticker[market].series;
      if (series && series.length() >= this.periods[2]) {
        let slice = series.transpose(this.props); // this grabs the desired properties from the series
        let last = series.last();
        // console.log(slice)
        let macd = await tulind.indicators.macd.indicator(slice, this.periods);
        if (this.hasBuySignal(macd[2])) {
          let balance = this.portfolio.balanceByMarket(market);
          if (balance.free > 0) {
            let maxAmount = balance.free/last.ask;
            await this.requestOrder(strat.REQ_LIMIT_BUY, market, maxAmount, last.ask);
          }
        } else if (this.hasSellSignal(macd[2])) {
          let balance = this.portfolio.balanceByMarket(market, "base");
          if (balance.free > 0) {
            await this.requestOrder(strat.REQ_LIMIT_SELL, market, balance.free, last.bid);
          }
        }
      }
    }
  }

  hasBuySignal(macd) {
    let slice = macd.slice(-3);
    return slice[0] < 0 && slice[1] > 0 && slice[2] > slice[1];
  }

  hasSellSignal(macd) {
    let slice = macd.slice(-3);
    return slice[0] > 0 && slice[1] < 0 && slice[2] < slice[1];
  }
}

module.exports = MACD;
