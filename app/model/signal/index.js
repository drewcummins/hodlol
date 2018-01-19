'use strict';

var fin = require('./fin');
var xu = require('../util/exchange-util');

class Signal {

  const BUY = 1;
  const NULL = 0;
  const SELL = -1;

  constructor(feeds) {
    this.feeds = feeds;
  }

  async tick(time) {
    return NULL;
  }
}

module.exports = Signal;
