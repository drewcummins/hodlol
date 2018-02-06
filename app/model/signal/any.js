'use strict';

const sig = require('./index')

class Any extends sig.MultiSignal {

  init() {
    this.filename = "any";
    this.title = "Any";
    super.init();
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

module.exports = Any;
