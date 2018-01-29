'use strict';

const strat = require('./index');
const JumpThreshold = require('../signal/jump-threshold');

class BuyDipSellPeak extends strat.Strategy {
  constructor(params={}, weight=-1) {
    super(params, weight);
    this.title = "BDSP";
    this.filename = "buy-dip-sell-peak";
    this.threshold = params.threshold;
  }

  initSignals(feed) {
    this.dive = new JumpThreshold(feed, -this.threshold);
    this.signals.push(this.dive);
    this.peak = new JumpThreshold(feed, this.threshold);
    this.signals.push(this.peak);
  }


  async tick() {
    let sells = this.peak.tick();

    sells.forEach((sell) => {
      let ticker = this.feed.tickers[sell];
      let last = ticker.last();
      let balance = this.portfolio.balanceByMarket(sell, "base");
      if (balance > 0) {
        this.requestOrder(strat.REQ_LIMIT_SELL, sell, balance, last.bid);
      }
    });

    let buys = this.dive.tick();
    //
    buys.forEach((buy) => {
      let ticker = this.feed.tickers[buy];
      let last = ticker.last();
      let balance = this.portfolio.balanceByMarket(buy);
      if (balance > 0) {
        // greedily use up funds
        let maxAmount = balance/last.ask;
        this.requestOrder(strat.REQ_LIMIT_BUY, buy, maxAmount, last.ask);
      }
    });
  }

  serialize() {
    let json = super.serialize();
    json.params.threshold = this.threshold;
    return json;
  }
}

module.exports = BuyDipSellPeak;
