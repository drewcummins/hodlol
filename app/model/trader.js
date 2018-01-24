'use strict';

const model = require('./');
const xu = require('../util/exchange');
const strat = require('./strategy');
var fs = require("fs");

class Trader {
  constructor(api, fundSymbol, fundAmount) {
    this.api = api;
    this.fundSymbol = fundSymbol;
    this.fundAmount = fundAmount;
  }

  spoolTickers(tickers) {
    tickers.forEach((symbol) => this.feed.addTicker(symbol));
  }

  spoolCandleTickers(tickers) {
    tickers.forEach((symbol) => this.feed.addCandleTicker(symbol));
  }

  async printPerformance() {
    if (this.strategies.length == 0) return;
    console.log("==============================================");
    for (var i = 0; i < this.strategies.length; i++) {
      let strategy = this.strategies[i];
      let value = await strategy.portfolio.value("USDT");
      console.log(" |=> " + strategy.title + ": $" + value.total.toFixed(2));
    }
    console.log("==============================================\n");
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
    });
    this.printPerformance();
  }

  async execute(hertz=10) {
    const timeout = Math.round(1000/hertz);
    this.executionRate = hertz;
    let n = 0;
    while (true) {
      this.strategies.forEach(async (strat) => strat.tick());
      await xu.sleep(timeout);
      if (++n % 50 == 0) {
        this.printPerformance();
      }
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
  }

  sumWeight() {
    return this.strategies.reduce((mem, strategy) => mem + strategy.weight, 0);
  }

  serialize() {
    let json = {
      exchange: this.api.name.toLowerCase(),
      name: this.name,
      strategies: this.strategies.map((strat) => strat.serialize()),
      tickers: Object.keys(this.feed.tickers),
      candles: Object.keys(this.feed.candles),
      executionRate: this.executionRate
    };
    return JSON.stringify(json);
  }

  static async FromAPI(api, fundSymbol, fundAmount, strategies) {
    let trader = new Trader(api, fundSymbol, fundAmount);
    trader.exchange = await model.Exchange.FromAPI(trader.api);
    trader.feed = trader.exchange.feed;
    trader.initStrategies(strategies);
    return trader;
  }

  static async deserialize(path, fund, run=true) {
    const json = JSON.parse(fs.readFileSync(path));
    let api = xu.getExchange(json.exchange);
    let strategies = json.strategies.map((strat) => {
      let stratClass = require(`./strategy/${strat.id}`);
      return new stratClass(strat.params, strat.weight);
    });
    let trader = await Trader.FromAPI(api, fund.symbol, fund.amount, strategies);
    if (run) {
      trader.spoolTickers(json.tickers);
      trader.spoolCandleTickers(json.candles);
      trader.execute(json.executionRate);
    }
    trader.source = json;
    return trader;
  }
}

module.exports = Trader;
