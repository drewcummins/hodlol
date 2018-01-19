'use strict';

const fin = require('../fin');
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
}

class Strategy {
  constructor(weight=1) {
    this.weight = weight;
    this.id = uuid();
  }
  
  register(fundSymbol, fundAmount, requestHandler) {
    this.fundSymbol = fundSymbol;
    this.fundAmount = fundAmount;
    this.requestHandler = requestHandler;
  }

}

module.exports = Strategy;
