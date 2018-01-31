'use strict';

const uuid = require('uuid/v4');

const FREE = "free";
const RESERVED = "reserved";

class Portfolio {
  constructor(exchange) {
    this.id = uuid();
    this.exchange = exchange;
    this.balances = {};
  }

  add(symbol, amount, pool=FREE) {
    if (!this.balances[symbol]) {
      this.balances[symbol] = {free: 0, reserved: 0};
    }
    this.balances[symbol][pool] += amount;
  }

  remove(symbol, amount) {
    this.add(symbol, -amount);
  }

  balance(symbol) {
    if (!this.balances[symbol]) return {free: 0, reserved: 0};
    return this.balances[symbol];
  }

  balanceByMarket(symbol, side="quote") {
    let market = this.exchange.sym(symbol);
    if (!market) return {free: 0, reserved: 0};
    return this.balance(market[side]);
  }

  hasBuyFunds(request) {
    let balance = this.balanceByMarket(request.market);
    return balance.free >= request.cost();
  }

  hasSellFunds(request) {
    let balance = this.balanceByMarket(request.market, "base");
    return balance.free >= request.amount;
  }

  reserve(symbol, amount) {
    this.remove(symbol, amount);
    this.add(symbol, amount, RESERVED);
  }

  fill(symbol, amount) {
    let market = this.exchange.sym(symbol);
  }

  reserveForBuy(request) {
    let market = this.exchange.sym(request.market);
    this.reserve(market.quote, request.cost());
  }

  reserveForSell(request) {
    let market = this.exchange.sym(request.market);
    this.reserve(market.base, request.amount);
  }

  async value(quote='USDT') {
    let value = {free: 0, reserved: 0};
    for (var base in this.balances) {
      if (base == quote) {
        let balance = this.balances[base];
        value.free += balance.free;
        value.reserved += balance.reserved;
        value[base] = {free: balance.free, reserved: balance.reserved};
        continue;
      }
      let rate = await this.exchange.price(base, quote);
      let balance = this.balances[base];
      value[base] = {free: balance.free * rate, reserved: balance.reserved * rate};
      value.free += value[base].free;
      value.reserved += value[base].reserved;
    }
    value.total = value.free + value.reserved;
    return value;
  }
}

module.exports = Portfolio;
