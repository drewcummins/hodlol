'use strict';

const uuid = require('uuid/v4');

const REQ_LIMIT_BUY = 1;
const REQ_LIMIT_SELL = 2;
const REQ_MARKET_BUY = 3;
const REQ_MARKET_SELL = 4;

class OrderRequest {
  constructor(type, market, amount, price=null) {
    this.type = type;
    this.market = market;
    this.amount = amount;
    this.price = price;
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
    let order = this.requestHandler(this, new OrderRequest(type, market, amount, price));
  }

}

module.exports = {
  Strategy: Strategy,
  REQ_LIMIT_BUY: REQ_LIMIT_BUY,
  REQ_LIMIT_SELL: REQ_LIMIT_SELL,
  REQ_MARKET_BUY: REQ_MARKET_BUY,
  REQ_MARKET_SELL: REQ_MARKET_SELL
};
