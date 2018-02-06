'use strict';

const sig = require('./index')
const tulind = require('tulind');

class MACD extends sig.Signal {

  init() {
    this.filename = "macd";
    this.title = "Moving Average Convergence Divergence";
    this.props = this.params.props;
    this.periods = this.params.periods;
  }

  async evaluate(ticker) {
    let series = ticker.series;
    if (series && series.length() >= this.periods[2]) {
      let slice = series.transpose(this.props, this.props[2]); // this grabs the desired properties from the series
      let last = series.last();
      // [macd, macd signal, macd histogram]
      let [foo, bar, histo] = await tulind.indicators.macd.indicator(slice, this.periods);
      if (this.hasBuySignal(histo)) return sig.BUY;
      else if (this.hasSellSignal(histo)) return sig.SELL;
    }
    return sig.PASS;
  }

  hasBuySignal(macd) {
    let slice = macd.slice(-3);
    return slice[0] < 0 && slice[1] > 0 && slice[2] > slice[1] * 5;
  }

  hasSellSignal(macd) {
    let slice = macd.slice(-3);
    return slice[0] > 0 && slice[1] < 0 && slice[2] < slice[1] * 3;
  }

}

module.exports = MACD;
