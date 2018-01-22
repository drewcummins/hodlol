'use strict';

const ccxt = require('ccxt');
const asTable = require('as-table');
const log = require('ololog');
const ansi = require('ansicolor').nice;
const xu = require('../../util/exchange-util');

class Ticker {
  constructor(exchange, market) {
    this.exchange = exchange;
    this.market = market;
    [this.base, this.quote] = market.split("/");
    this.ticks = [];
  }

  async run() {
    const exchange = this.exchange;
    while (true) {
      const ticker = await exchange.fetchTicker(this.market);
      // console.log(ticker);
      this.ticks.push(ticker);
      await xu.sleep(3000);
    }
  }

  length() {
    return this.ticks.length;
  }

  getAt(idx) {
    if (idx < 0) {
      idx = this.length() + idx;
    }
    return this.ticks[idx];
  }

  last() {
    return this.ticks[this.length() - 1];
  }

}

module.exports = Ticker;
