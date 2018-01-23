'use strict';

const model = require('./');
const xu = require('../util/exchange');
const strat = require('./strategy')

class Trader {
  constructor(api, fundSymbol, fundAmount) {
    this.api = api;
    this.fundSymbol = fundSymbol;
    this.fundAmount = fundAmount;
  }

  spoolTickers(tickers) {
    tickers.forEach((symbol) => this.feed.addTicker(symbol));
  }

  initStrategies(strategies) {
    this.strategies = strategies;
    const sum = this.sumWeight();
    // this normalizes the weights in all provided strategies and
    // divvies up the trader's total funds accordingly
    strategies.forEach(async (strategy) => {
      const amount = this.fundAmount * strategy.weight / sum;
      if (amount > 0) {
        strategy.register(this.fundSymbol, amount, this.consider.bind(this), this.feed);
        strategy.portfolio = new model.Portfolio(this.exchange);
        strategy.portfolio.add(this.fundSymbol, amount);
      }
      console.log((await strategy.portfolio.value()).total);
    })
  }

  async execute(hertz=10) {
    const timeout = Math.round(1000/hertz);
    while (true) {
      this.strategies.forEach(async (strat) => strat.tick());
      await xu.sleep(timeout);
    }
  }

  async consider(strategy, orderRequest) {
    let portfolio = strategy.portfolio;
    let cost = orderRequest.cost();
    if (orderRequest.type == strat.REQ_LIMIT_BUY) {
      let market = this.exchange.sym(orderRequest.market);
      if (market) {
        portfolio.remove(this.fundSymbol, cost);
        portfolio.add(market.base, orderRequest.amount);
      }
    } else if (orderRequest.type == strat.REQ_LIMIT_SELL) {
      let market = this.exchange.sym(orderRequest.market);
      if (market) {
        portfolio.add(this.fundSymbol, cost);
        portfolio.remove(market.base, orderRequest.amount);
      }
    }
    console.log((await portfolio.value()).total);
  }

  sumWeight() {
    return this.strategies.reduce((mem, strategy) => mem + strategy.weight, 0);
  }

  static async FromAPI(api, fundSymbol, fundAmount, strategies) {
    let trader = new Trader(api, fundSymbol, fundAmount);
    trader.exchange = await model.Exchange.FromAPI(trader.api);
    trader.feed = trader.exchange.feed;
    trader.initStrategies(strategies);
    return trader;
  }
}

module.exports = Trader;
