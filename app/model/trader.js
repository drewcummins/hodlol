'use strict';

const config = require('../../config');
const model = require('./');
const xu = require('../util/exchange');
const strat = require('./strategy');
const mkdirp = require("mkdirp");
var fs = require("fs");

class Trader {
  constructor(exchange, fundSymbol, fundAmount) {
    this.exchange = exchange;
    this.fundSymbol = fundSymbol;
    this.fundAmount = fundAmount;
  }

  spoolTickers(tickers, record) {
    tickers.forEach((symbol) => this.feed.addTicker(symbol, record));
  }

  spoolCandleTickers(tickers, record) {
    tickers.forEach((symbol) => this.feed.addCandleTicker(symbol, record));
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
    let exchange = await model.Exchange.FromAPI(api);
    let trader = new Trader(exchange, fundSymbol, fundAmount);
    trader.feed = trader.exchange.feed;
    trader.initStrategies(strategies);
    return trader;
  }

  static async deserialize(path, params, run=true) {
    const json = JSON.parse(fs.readFileSync(path));
    if (params.backtest) {
      let scenario = JSON.parse(fs.readFileSync(params.backtest));
      config.backtest = true;
      config.scenario = scenario;
      config.dateID = scenario.date_id;
    } else {
      config.dateID = xu.DATE_ID;
    }
    let strategies = json.strategies.map((strat) => {
      let stratClass = require(`./strategy/${strat.id}`);
      return new stratClass(strat.params, strat.weight);
    });
    let api = xu.getExchange(json.exchange, params.backtest);
    let trader = await Trader.FromAPI(api, params.symbol, params.amount, strategies);
    if (json.record) {
      // make sure we have directories setup if we're going to record
      mkdirp.sync(`./data/${json.exchange}/ticker/${config.dateID}`);
      mkdirp.sync(`./data/${json.exchange}/ohlcv`);
    }
    if (run) {
      trader.spoolTickers(json.tickers, json.record);
      trader.spoolCandleTickers(json.candles, json.record);
      trader.execute(json.execution_rate);
    }
    trader.source = json;
    return trader;
  }
}

module.exports = Trader;
