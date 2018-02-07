'use strict';

const sig = require('./index')

class JumpThreshold extends sig.Signal {

  init() {
    // @threshold percent growth over previous step
    // e.g. t1 = 10, t2 = 12 represents 20% growth or 0.2
    // t1 = 10, t2 = 8 represents -20% growth or -0.2
    this.title = "Jump Threshold";
    this.filename = "jump-threshold";
    this.threshold = this.params.threshold;
    this.sig = this.threshold < 0 ? sig.BUY : sig.SELL;
  }

  evaluate(ticker) {
    return this.exceedsThreshold(ticker) ? this.sig : sig.PASS;
  }

  exceedsThreshold(ticker) {
    if (ticker.length() < 2) {
      return false;
    }

    let growth = ticker.getAt(-1).close / ticker.getAt(-2).close;
    if (this.threshold > 0) return growth - 1 >= this.threshold;
    return growth - 1 <= this.threshold;
  }

  serialize() {
    let json = super.serialize();
    json.threshold = this.threshold;
    return json;
  }

}

module.exports = JumpThreshold;
