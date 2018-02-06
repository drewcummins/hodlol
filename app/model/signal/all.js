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
    for (var i = 0; i < this.subsignals.length; i++) {
      let signal = await this.subsignals[i].tick();
      if (current == null) current = signal;
      else if (signal != current) return sig.PASS;
    }
    return current;
  }

}

module.exports = All;
