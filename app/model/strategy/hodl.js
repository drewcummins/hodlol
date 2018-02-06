'use strict';

const strat = require('./index');

class HODL extends strat.Strategy {
  init() {
    this.title = "HODL";
    this.filename = "hodl";
  }
}

module.exports = HODL;
