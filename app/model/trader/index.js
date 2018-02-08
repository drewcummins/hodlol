'use strict';

const config = require('../../../config');
const Exchange = require('../base/exchange');
const Portfolio = require('../base/portfolio');
const xu = require('../../util/exchange');
const strat = require('../strategy');
const mkdirp = require("mkdirp");
const fs = require("fs");
const dateFormat = require('dateformat');
const colors = require('ansicolors');

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
    config.fakeOrders = params.fakeOrders;
    if (json.record) {
      // make sure we have directories setup if we're going to record
      mkdirp.sync(`./data/${json.exchange}/${config.dateID}`);
    }
    this.strategies = json.strategies.map((strategy) => {
      let stratClass = strat.Strategy;
      // if we have an explicitly defined strategy
      if (strategy.id) stratClass = require(`../strategy/${strategy.id}`);
      return strat.deserialize(stratClass, strategy);
    });
    let api = xu.getExchange(json.exchange);
    this.exchange = await Exchange.FromAPI(api);
    this.executionRate = json.executionRate;
    this.fundSymbol = params.symbol;
    this.fundAmount = params.amount;
    this.feed = this.exchange.feed;
    this.exchange.addTickers(json.tickers);
    if (!(await this.exchange.isValid(params.symbol, params.amount))) {
      throw new Error("Insufficient Trader Funds.", params);
    }

    if (this.exchange.isBacktesting()) this.exchange.time = config.scenario.start;
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
        strategy.initIndicators(this.feed);
      }
    });
  }


  async stepExchange() {
    if (this.exchange.dirty) {
      await this.strategies.forEach(async (strategy) => await strategy.tick());
      this.exchange.processOrderState();
      this.exchange.dirty = false;
    }
  }


  async run() {
    this.feed.run();
    let n = 0;
    while (true) {
      await this.stepExchange();

      if (++n % 100 == 0) {
        this.printPerformance();
      }

      if (this.exchange.isBacktesting()) {

        if (this.exchange.time > config.scenario.end) {
          await this.stepExchange();
          await xu.sleep(1000); // let everything wrap up!
          await this.printPerformance();
          console.log("Ended backtest");
          process.exit();
        }

        this.exchange.time += 10000; // add 10 seconds per tick in backtest mode
      }
      await xu.sleep(1);
    }
  }


  async consider(strategy, orderRequest) {
    // console.log(this.exchange.feed.tickers[orderRequest.market].last().timestamp);
    let portfolio = strategy.portfolio;
    if (orderRequest.type == strat.REQ_LIMIT_BUY) {
      if (portfolio.hasBuyFunds(orderRequest)) {
        portfolio.reserveForBuy(orderRequest);
        let order = await this.exchange.createLimitBuyOrder(orderRequest);
        return order;
      }
      throw new Error("Insufficient funds.", orderRequest);
    } else if (orderRequest.type == strat.REQ_LIMIT_SELL) {
      if (portfolio.hasSellFunds(orderRequest)) {
        portfolio.reserveForSell(orderRequest);
        let order = await this.exchange.createLimitSellOrder(orderRequest);
        return order;
      }
      throw new Error("Insufficient funds.", orderRequest);
    }
    throw new Error("Unactionable order type.", orderRequest);
  }


  serialize() {
    let json = {
      exchange: this.exchange.name,
      name: this.name,
      strategies: this.strategies.map((strat) => strat.serialize()),
      tickers: Object.keys(this.feed.tickers),
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


  async printPerformance() {
    if (this.strategies.length == 0) return;
    console.log('\x1Bc');
    var date = "";
    if (this.exchange.isBacktesting()) {
      let dateStart = colors.magenta(dateFormat(config.scenario.start, "mmm d, h:MM:ssTT"));
      let dateEnd = colors.magenta(dateFormat(config.scenario.end, "mmm d, h:MM:ssTT"));
      date = colors.magenta(dateFormat(this.exchange.time, "h:MM:ssTT"));
      console.log(` | Backtesting from ${dateStart} to ${dateEnd}\n`);
    }
    for (var i = 0; i < this.strategies.length; i++) {
      let strategy = this.strategies[i];
      try {
        let value = await strategy.portfolio.value("USDT");
        console.log(" |=> " + strategy.title + ": $" + value.total.toFixed(2));
      } catch(err) {
        throw err;
        console.log("Error calculating value");
      }
    }
    console.log("");
    console.log(` | [${date}]`);
    console.log("\n");
  }
}

module.exports = Trader;
