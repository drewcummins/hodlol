'use strict';

const { Strategy, REQ_LIMIT_BUY, REQ_LIMIT_SELL } = require('./index');
const mu = require('../../util/math');

class SellBestBuyWorst extends Strategy {
  init() {
    this.title = "Sell Best Buy Worst";
    this.filename = "sell-best-buy-worst";
    this.n = this.params.n || 5;
    this.period = this.params.period || 60000 * 10;
    this.time = -1;
  }

  async open() {
    this.current = {};
    const budget = this.fundAmount / this.n;
    const tickers = Object.keys(this.feed.tickers);
    while (Object.keys(this.current).length < this.n) {
      let symbol = tickers[Math.floor(Math.random() * tickers.length)];
      let market = this.portfolio.market(symbol);
      if (market.quote == this.fundSymbol && !this.current[symbol]) {
        let last = this.feed.tickers[symbol].last();
        await this.placeLimitBuyOrder(symbol, budget, last.close);
        this.current[symbol] = true;
      }
    }
  }


  async tick(time) {
    if (this.time < 0) {
      this.time = time;
      return;
    }
    if (time - this.time > this.period) {
      console.log(this.current)
      let growth = this.growth();
      let worst = null;
      let best = null;
      for (let i = 0; i < growth.length; i++) {
        if (worst == null) {
          let candidate = growth[i];
          if (!this.current[candidate.symbol]) worst = candidate;
        }
        if (best == null) {
          let candidate = growth[growth.length-i-1];
          if (this.current[candidate.symbol]) best = candidate;
        }
        if (best != null && worst != null) break;
      }
      let bestAmount = this.portfolio.balance(best.symbol).free;
      let order = await this.placeLimitSellOrder(best.symbol, bestAmount, best.close);
      order.next = {type:REQ_LIMIT_BUY, symbol: worst.symbol, amount: 1, price: worst.close};
      delete this.current[best.symbol];

      // let worstAmount = this.portfolio.balance(worst.symbol).free;
      // await this.placeLimitBuyOrder(worst.symbol, worstAmount, )
      this.time = time;
    }
  }

  growth() {
    return Object.values(this.feed.tickers).map((ticker) => {
      let lastRound = ticker.series.nearest(this.time);
      let current = ticker.last();
      return {symbol: ticker.market, close: current.close, growth: current.close / lastRound.close}
    }).sort((a, b) => a.growth > b.growth);
  }
}

module.exports = SellBestBuyWorst;
