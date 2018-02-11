'use strict';

const { Strategy } = require('./index');

class HODL extends Strategy {
  init() {
    this.title = "HODL";
    this.filename = "hodl";
  }
}

module.exports = HODL;
