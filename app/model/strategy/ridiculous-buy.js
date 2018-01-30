'use strict';

const strat = require('./index');

class RidiculousBuy extends strat.Strategy {
  constructor(params={}, weight=-1) {
    super(params, weight);
    this.lowball = "ETH/BTC";
    this.hasOrdered = false;
    this.title = "Ridiculous Buy";
    this.filename = "ridiculous-buy";
  }

  async tick() {
    if (!this.hasOrdered) {
      let ticker = this.feed.tickers[this.lowball];
      let last = ticker.last();
      if (last == undefined) {
        return;
      }
      this.hasOrdered = true;
      let balance = this.portfolio.balanceByMarket(this.lowball);
      if (balance.free > 0) {
        let maxAmount = balance.free/last.ask;
        await this.requestOrder(strat.REQ_LIMIT_BUY, this.lowball, maxAmount * 0.5, last.ask*0.3);
      }
    }
  }
}

module.exports = RidiculousBuy;
