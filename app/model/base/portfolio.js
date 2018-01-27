'use strict';

class Portfolio {
  constructor(exchange) {
    this.id = uuid();
    this.exchange = exchange;
    this.balances = {};
  }

  add(symbol, amount) {
    if (!this.balances[symbol]) {
      this.balances[symbol] = 0;
    }
    this.balances[symbol] += amount;
  }

  remove(symbol, amount) {
    this.add(symbol, -amount);
  }

  balance(symbol) {
    if (!this.balances[symbol]) return 0;
    return this.balances[symbol];
  }

  balanceByMarket(symbol, side="quote") {
    let market = this.exchange.sym(symbol);
    if (!market) return 0;
    return this.balance(market[side]);
  }

  async value(quote='USDT') {
    let value = {total: 0};
    for (var base in this.balances) {
      if (base == quote) {
        value.total += this.balances[base];
        value[base] = this.balances[base];
        continue;
      }
      let rate = await this.exchange.price(base, quote);
      value[base] = rate * this.balances[base];
      value.total += value[base];
    }
    return value;
  }
}
