'use strict';

const sig = require('./index')

class Any extends sig.MultiSignal {

  init() {
    this.filename = "any";
    this.title = "Any";
    super.init();
  }

  async evaluate(ticker) {
    for (let subsignal of this.subsignals) {
      let signal = await subsignal.tick();
      if (signal != sig.PASS) return signal;
    }
    return sig.PASS;
  }

}

module.exports = Any;
