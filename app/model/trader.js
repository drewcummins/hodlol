'use strict';

var fin = require('./fin');
var xu = require('../util/exchange-util');
const Ticker = require('./feed/ticker');
const strat = require('./strategy')

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
        strategy.register(this.fundSymbol, amount, this.handleStrategyRequest.bind(this), this.feeds);
        strategy.portfolio = this.portfolios[strategy.id] = new fin.Portfolio();
        const market = this.marketMap.getMarket(this.fundSymbol, quote);
        const ticker = await this.exchange.fetchTicker(market.symbol);
        const pair = new fin.Pair(this.fundSymbol, quote, ticker);
        const asset = new fin.Asset(pair, amount);
        strategy.portfolio.addAsset(asset);
        this.pool = asset;
      }
    })
  }

  handleStrategyRequest(request) {
    if (request.type == strat.REQ_LIMIT_BUY) {
      console.log("Got buy order request!", request);
      const market = this.markets[request.market];
      const fee = market.taker * request.amount * request.price;

      const pair = new fin.Pair(market.base, market.quote);
      const price = new fin.Price(request.price, + new Date());
      pair.push(price);
      const asset = new fin.Asset(pair, request.amount);
      let s = this.strategies[0];
      s.portfolio.addAsset(asset);
      s.portfolio.removeAsset(this.pool);
      this.pool == null;
    } else {
      console.log("Got SELL order request!!!", request);
    }
    // console.log("Got a request!", request);
  }

  sumWeight() {
    return this.strategies.reduce((mem, strategy) => mem + strategy.weight, 0);
  }

  async getToWork() {
    while (true) {
      await xu.sleep(100);
      this.strategies.forEach(async (strategy) => {
        strategy.tick();
      });
    }
  }
}

module.exports = Trader;
