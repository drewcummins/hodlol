'use strict';

const strat = require('./index');
const JumpThreshold = require('../signal/jump-threshold');

class BuyDipSellPeak extends strat.Strategy {
  constructor(threshold, weight=1) {
    super(weight);
    this.threshold = threshold;
  }

  initSignals(feeds) {
    this.dive = new JumpThreshold(feeds, -this.threshold);
    this.signals.push(this.dive);
    this.peak = new JumpThreshold(feeds, this.threshold);
    this.signals.push(this.peak);
  }

  async tick() {
    let buys = await this.dive.tick();
    let sells = await this.peak.tick();

    sells.forEach((sell) => {
      let ticker = this.feeds.tickers[sell];
      let last = ticker.last();
      let balance = this.portfolio.balance(ticker.quote, ticker.base);
      console.log("sell balance:", ticker.quote, ticker.base, balance);
      if (balance > 0) {
        let orderRequest = strat.Strategy.orderRequest(strat.REQ_LIMIT_SELL, sell, balance, last.bid);
        this.requestHandler(orderRequest);
      }
    });

    buys.forEach((buy) => {
      let ticker = this.feeds.tickers[buy];
      let last = ticker.last();
      // we're only taking this from our "fund"
      // so the quote is in USDT
      // the base is the quote of whatever market the signal is saying to buy (probably BTC)
      let balance = this.portfolio.balance("USDT", ticker.quote);
      console.log("buy balance:", "USDT", ticker.quote, balance);
      // greedily use up funds
      let orderRequest = strat.Strategy.orderRequest(strat.REQ_LIMIT_BUY, buy, balance, last.ask);
      this.requestHandler(orderRequest);
    });
  }
}

module.exports = BuyDipSellPeak;
