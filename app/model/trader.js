'use strict';

var fin = require('./fin');
var xu = require('../util/exchange-util')
const Ticker = require('./feed/ticker')

class Trader {
  constructor(exchange, fundSymbol, fundAmount) {
    this.exchange = exchange;
    this.fundSymbol = fundSymbol;
    this.fund = fundAmount;
  }

  async connect() {
    this.markets = await this.exchange.loadMarkets();
    this.marketMap = xu.buildBaseQuoteSymbolMap(this.markets);
    await xu.sleep(500);
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
    this.portfolio = new fin.Portfolio();
    // const asset = new fin.Asset();
  }

  async spoolFeeds(tickers) {
    tickers.forEach((symbol) => {
      let ticker = new Ticker(this.exchange, symbol);
      ticker.run();
    })
  }
}

module.exports = Trader;
