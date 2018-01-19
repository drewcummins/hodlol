'use strict';

var fin = require('./fin');
var xu = require('../util/exchange-util');
const Ticker = require('./feed/ticker');

class Trader {
  constructor(exchange, fundSymbol, fundAmount) {
    this.exchange = exchange;
    this.fundSymbol = fundSymbol;
    this.fund = fundAmount;
    this.feeds = {tickers:{}};
  }

  async connect() {
    this.markets = await this.exchange.loadMarkets();
    this.marketMap = xu.buildBaseQuoteSymbolMap(this.markets);
    const balances = await this.exchange.fetchBalance();
    let hasSufficientFunds = false;
    if (balances && balances[this.fundSymbol]) {
      // the current available amount
      const balance = balances[this.fundSymbol].free;
      hasSufficientFunds = balance >= this.fund;
    }
    if (!hasSufficientFunds) {
      throw new Error("Insufficient funds.");
    }
    console.log('Trader connected to', this.exchange.name, 'with', this.fund, this.fundSymbol);
  }

  spoolFeeds(tickers) {
    var t1 = null;
    tickers.forEach((symbol) => {
      let ticker = new Ticker(this.exchange, symbol);
      this.feeds.tickers[symbol] = ticker;
      ticker.run();
    });
  }

  initStrategies(strategies, quote = 'BTC') {
    this.strategies = strategies;
    this.portfolios = {};
    const sum = this.sumWeight();
    this.strategies.forEach(async (strategy) => {
      const amount = this.fund * strategy.weight / sum;
      if (amount > 0) {
        strategy.register(this.fundSymbol, amount, this.handleStrategyRequest);
        const portfolio = this.portfolios[strategy.id] = new fin.Portfolio();
        const market = this.marketMap.getMarket(this.fundSymbol, quote);
        const ticker = await this.exchange.fetchTicker(market.symbol);
        const pair = new fin.Pair(this.fundSymbol, quote, ticker);
        const asset = new fin.Asset(pair, amount);
        portfolio.addAsset(asset);
      }
    })
  }

  handleStrategyRequest(request) {

  }

  sumWeight() {
    return this.strategies.reduce((mem, strategy) => mem + strategy.weight, 0);
  }

  async getToWork() {

  }
}

module.exports = Trader;
