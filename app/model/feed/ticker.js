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
    this.ticks = [];
  }

  async run() {
    const exchange = this.exchange;
    while (true) {
      const ticker = await exchange.fetchTicker(this.market);
      this.ticks.push(ticker);
      await xu.sleep(3000);
    }
  }

}

module.exports = Ticker;
