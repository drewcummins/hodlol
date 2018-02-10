'use strict';

const sig = require('./index')

class All extends sig.MultiSignal {

  init() {
    this.filename = "all";
    this.title = "All";
    super.init();
  }

  async evaluate(ticker) {
    let current = null;
    for (let subsignal of this.subsignals) {
      let signal = await subsignal.tick();
      if (current == null) current = signal;
      else if (signal != current) return sig.PASS;
    }
    return current;
  }

}

module.exports = All;
