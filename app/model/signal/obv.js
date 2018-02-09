'use strict';

const sig = require('./index')
const tulind = require('tulind');

class OBV extends sig.Signal {

  init() {
    this.filename = "obv";
    this.title = "On Balance Volume";
    this.props = ["close", "volume"];
  }

  async evaluate(ticker) {
    let series = ticker.series;
    if (series && series.length() > 0) {
      let slice = series.transpose(this.props, 50);
      let last = series.last();
      let obv = await tulind.indicators.obv.indicator(slice, []);
      if (this.hasBuySignal(obv[0])) return sig.BUY;
      else if (this.hasSellSignal(obv[0])) return sig.SELL;
    }
    return sig.PASS;
  }

  hasBuySignal(obv) {
    let slice = obv.slice(-3);
    return slice[1] < 0 && slice[2];
  }

  hasSellSignal(obv) {
    let slice = obv.slice(-3);
    return slice[1] > 0 && slice[2];
  }

}

module.exports = OBV;
