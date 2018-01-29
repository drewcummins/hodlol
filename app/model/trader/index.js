'use strict';

const config = require('../../../config');
const Exchange = require('../base/exchange');
const Portfolio = require('../base/portfolio');
const xu = require('../../util/exchange');
const strat = require('../strategy');
const mkdirp = require("mkdirp");
const fs = require("fs");

class Trader {
  constructor(filepath) {
    this.filepath = filepath;
  }

  async init(params) {
    const json = JSON.parse(fs.readFileSync(this.filepath));
    if (params.backtest) {
      let scenario = JSON.parse(fs.readFileSync(params.backtest));
      config.backtest = true;
      config.scenario = scenario;
      config.dateID = scenario.date_id;
      config.record = false; // don't let recording happen if we're backtesting
    } else {
      config.dateID = xu.DATE_ID;
      config.record = json.record;
    }
    if (json.record) {
      // make sure we have directories setup if we're going to record
      mkdirp.sync(`./data/${json.exchange}/${config.dateID}`);
    }
    this.strategies = json.strategies.map((strat) => {
      let stratClass = require(`../strategy/${strat.id}`);
      return new stratClass(strat.params, strat.weight);
    });
    let api = xu.getExchange(json.exchange);
    this.exchange = await Exchange.FromAPI(api);
    this.fundSymbol = params.fundSymbol;
    this.fundAmount = params.fundAmount;
    this.feed = this.exchange.feed;
    this.exchange.addTickers(json.tickers, json.candles);
    this.initStrategies();
  }

  initStrategies() {
    const sum = this.sumWeight();
    // this normalizes the weights in all provided strategies and
    // divvies up the trader's total funds accordingly
    this.strategies.forEach((strategy) => {
      const amount = this.fundAmount * strategy.weight / sum;
      if (amount > 0) {
        strategy.register(this.fundSymbol, amount, this.consider.bind(this), this.feed);
        strategy.portfolio = new Portfolio(this.exchange);
        strategy.portfolio.add(this.fundSymbol, amount);
      }
    });
  }


  run() {
    this.feed.run();
  }


  async consider(strategy, orderRequest) {
  }


  serialize() {
    let json = {
      exchange: this.api.name.toLowerCase(),
      name: this.name,
      strategies: this.strategies.map((strat) => strat.serialize()),
      tickers: Object.keys(this.feed.tickers),
      candles: Object.keys(this.feed.candles),
      executionRate: this.executionRate,
      record: config.record
    };
    return JSON.stringify(json);
  }


  static async deserialize(filepath, params) {
    let trader = new Trader(filepath);
    await trader.init(params);
    return trader;
  }


  sumWeight() {
    return this.strategies.reduce((mem, strategy) => mem + strategy.weight, 0);
  }
}

module.exports = Trader;
