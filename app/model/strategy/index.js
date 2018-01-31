'use strict';

const uuid = require('uuid/v4');
const path = require('path');

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
  constructor(params={}, weight=-1) {
    this.weight = weight;
    this.id = uuid();
    this.signals = [];
    this.portfolio = null;
    this.title = "Strategy";
  }

  register(fundSymbol, fundAmount, requestHandler, feed) {
    this.fundSymbol = fundSymbol;
    this.fundAmount = fundAmount;
    this.requestHandler = requestHandler;
    this.feed = feed;
    this.initSignals(feed);
  }

  initSignals(feeds) {
    //
  }

  tick() {
    this.signals.forEach((signal) => {
      signal.tick();
    });
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
    return {id: this.basename(), weight: this.weight, params: {}};
  }
}

module.exports = {
  Strategy: Strategy,
  REQ_LIMIT_BUY: REQ_LIMIT_BUY,
  REQ_LIMIT_SELL: REQ_LIMIT_SELL,
  REQ_MARKET_BUY: REQ_MARKET_BUY,
  REQ_MARKET_SELL: REQ_MARKET_SELL
};
