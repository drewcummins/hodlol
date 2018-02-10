'use strict';

const sig = require('../signal');
const uuid = require('uuid/v4');
const path = require('path');
const mu = require('../../util/math');

const REQ_LIMIT_BUY = 1;
const REQ_LIMIT_SELL = 2;
const REQ_MARKET_BUY = 3;
const REQ_MARKET_SELL = 4;

class OrderRequest {
  constructor(type, market, amount, price=null, portfolioID=null) {
    this.type = type;
    this.market = market;
    this.amount = amount;
    this.price = price;
    this.portfolioID = portfolioID;
  }

  cost() {
    return this.amount * this.price;
  }
}

class Strategy {
  constructor(json) {
    this.params = json.params || {};
    this.weight = json.weight || 1;
    this.id = uuid();
    this.pendingIndicators = json.indicators || [];
    this.indicators = [];
    this.portfolio = null;
    this.title = json.displayName || "Strategy";

    this.init();
  }

  init() {
    // no default
  }

  register(fundSymbol, fundAmount, requestHandler, feed) {
    this.fundSymbol = fundSymbol;
    this.fundAmount = fundAmount;
    this.requestHandler = requestHandler;
    this.feed = feed;
    this.initIndicators(feed);
  }

  async open() {
    // this gets called before everything kicks off, which allows for any orders
  }

  // default to instaniating any signals explicitly listed in the trader file
  initIndicators(feed) {
    this.pendingIndicators.forEach((signal) => {
      let sigClass = require(`../signal/${signal.id}`);
      Object.keys(feed.tickers).forEach((symbol) => {
        this.indicators.push(sig.deserialize(sigClass, signal, symbol, feed));
      });
    });
  }

  // vanilla strategy is to ask all indicators for buy/sell signals and request
  // that trader order accordingly
  async tick(time) {
    for (let indicator of this.indicators) {
      let signal = await indicator.tick();
      if (signal == sig.PASS) return;

      let ticker = this.feed.tickers[indicator.symbol];
      let last = ticker.last();
      if (signal == sig.BUY) {
        let balance = this.portfolio.balanceByMarket(indicator.symbol);
        if (balance.free > 0) {
          // greedily use up funds
          await this.placeLimitBuyOrder(indicator.symbol, balance.free, last.close);
        }
      } else if (signal == sig.SELL) {
        let balance = this.portfolio.balanceByMarket(indicator.symbol, "base");
        if (balance.free > 0) {
          await this.placeLimitSellOrder(indicator.symbol, balance.free, last.close);
        }
      } else {
        throw new Error("Invalid signal from", indicator);
      }
    };
  }

  async placeLimitBuyOrder(symbol, budget, close) {
    let amount = budget / close;
    while (amount * close > budget) {
      // fix floating point error
      // not sure the actual way to do this
      amount *= 0.999;
    }
    return await this.requestOrder(REQ_LIMIT_BUY, symbol, amount, close);
  }

  async placeLimitSellOrder(symbol, budget, close) {
    return await this.requestOrder(REQ_LIMIT_SELL, symbol, budget, close);
  }

  async requestOrder(type, market, amount, price=null) {
    let request = new OrderRequest(type, market, amount, price, this.portfolio.id);
    try {
      let order = await this.requestHandler(this, request);
    } catch(err) {
      console.log("Error on request order:", request, err.message);
      return {}; // figure out how we want to handle this generic error case
    }
  }

  basename() {
    return this.filename;
  }

  serialize() {
    let cache = {};
    this.indicators.forEach((indicator) => {
      let json = indicator.serialize();
      let hash = JSON.stringify(json);
      if (!cache[hash]) cache[hash] = json;
    });
    let json = {id: this.basename(), weight: this.weight}
    let indicators = Object.values(cache);
    if (indicators.length > 0) json.indicators = indicators;
    return json;
  }
}

module.exports = {
  Strategy: Strategy,
  REQ_LIMIT_BUY: REQ_LIMIT_BUY,
  REQ_LIMIT_SELL: REQ_LIMIT_SELL,
  REQ_MARKET_BUY: REQ_MARKET_BUY,
  REQ_MARKET_SELL: REQ_MARKET_SELL,
  deserialize: (stratClass, json) => {
    return new stratClass(json);
  }
};
