'use strict';

const strat = require('./index');

class HODL extends strat.Strategy {
  constructor(params={}, weight=-1) {
    super(weight);
    this.title = "HODL";
  }
}

module.exports = HODL;
