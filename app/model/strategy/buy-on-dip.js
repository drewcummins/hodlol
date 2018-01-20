'use strict';

const strat = require('./index');
const HugeDive = require('../signal/huge-dive');

class BuyOnDip extends strat.Strategy {
  constructor(weight=1) {
    super(weight);
  }

  initSignals(feeds) {
    this.dive = new HugeDive(feeds);
    this.signals.push(this.dive);
  }

  async tick() {
    let buys = await this.dive.tick();
    buys.forEach((buy) => {
      // greedily use up funds
      let last = this.feeds.tickers[buy].last();
      let orderRequest = strat.Strategy.orderRequest(strat.REQ_LIMIT_BUY, buy, this.fundAmount, last.ask);
      this.requestHandler(orderRequest);
    });
  }
}

module.exports = BuyOnDip;
