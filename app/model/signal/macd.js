'use strict';

const sig = require('./index')
const tulind = require('tulind');

class MACD extends sig.Signal {

  constructor(feed, symbol, props=["close"], periods=[20,50,100]) {
    super(feed, symbol);
    this.props = props;
    this.periods = periods;
  }

  async evaluate(ticker) {
    let series = ticker.series;
    if (series && series.length() >= this.periods[2]) {
      let slice = series.transpose(this.props); // this grabs the desired properties from the series
      let last = series.last();
      // [macd, macd signal, macd histogram]
      let [_, __, histo] = await tulind.indicators.macd.indicator(slice, this.periods);
      if (this.hasBuySignal(histo)) return sig.BUY;
      else if (this.hasSellSignal(histo)) return sig.SELL;
    }
    return sig.PASS;
  }

  hasBuySignal(macd) {
    let slice = macd.slice(-3);
    return slice[0] < 0 && slice[1] > 0 && slice[2] > slice[1] * 4;
  }

  hasSellSignal(macd) {
    let slice = macd.slice(-3);
    return slice[0] > 0 && slice[1] < 0 && slice[2] < slice[1] * 4;
  }

}

module.exports = MACD;
