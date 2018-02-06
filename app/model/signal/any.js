'use strict';

const sig = require('./index')

class Any extends sig.Signal {

  init() {
    this.filename = "any";
    this.title = "Any";
    this.subsignals = params.subsignals.map((sub) => {
      let sigClass = require(`./${sub.id}`);
      return sig.deserialize(sigClass, sub, symbol, feed);
    });
  }

  async evaluate(ticker) {
    for (var i = 0; i < this.subsignals.length; i++) {
      let signal = await this.subsignals[i].tick();
      if (signal != sig.PASS) {
        return signal;
      }
    }
    return sig.PASS;
  }

}

module.exports = JumpThreshold;
