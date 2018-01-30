'use strict';

const Series = require('./series');
const config = require('../../../config');
const xu = require('../../util/exchange');
const uuid = require('uuid/v4');

const ORDER_STATUS_OPEN = 'open';
const ORDER_STATUS_CLOSED = 'closed';
const ORDER_STATUS_CANCELED = 'canceled';

class OrderFiller {
  constructor() {
    this.orders = {};
  }

  add(order) {
    this.orders[order.id] = order;
  }

  markFilled(order) {
    order.status = ORDER_STATUS_CLOSED;
    order.filled = order.amount;
    order.remaining = 0;
  }

  all() {
    return Object.values(this.orders);
  }

  tick() {
    this.all().forEach((order) => {
      if (order.status == ORDER_STATUS_OPEN) {
        this.markFilled(order);
      }
    });
  }
}

class MockAPI {
  constructor(feed) {
    this.tickers = {};
    this.candles = {};
    this.orders = new OrderFiller();
    for (var symbol in feed.tickers) {
      this.tickers[symbol] = Series.FromTicker(feed.tickers[symbol]);
    }
    for (var symbol in feed.candles) {
      this.candles[symbol] = Series.FromCandle(feed.candles[symbol]);
    }
  }

  async run() {
    while (true) {
      this.orders.tick();
      await xu.sleep(1);
    }
  }

  read() {
    let min = Number.MAX_VALUE;
    let max = 0;
    Object.values(this.tickers).forEach((series) => {
      series.read();
      if (series.series[0].timestamp < min) {
        min = series.series[0].timestamp;
      }
      if (series.series[series.series.length-1].timestamp > max) {
        max = series.series[series.series.length-1].timestamp;
      }
    });
    if (config.scenario.start == undefined) {
      config.scenario.start = min;
      config.scenario.end = max;
    }
    Object.values(this.candles).forEach((series) => series.read());
  }

  fetchTicker(pair, time) {
    let series = this.tickers[pair];
    let [last, _] = series.nearest(time);
    return last;
  }

  fetchOHLCV(pair, time) {
    let series = this.candles[pair];
    let [last, _] = series.nearest(time);
    // have to format it as the ticker expects it from CCXT
    return series.serializer.outCCXT(last);
  }

  createLimitBuyOrder(request) {
    let order = {
      id:        uuid(),
      timestamp: +new Date(),   // Unix timestamp in milliseconds
      status:    'open',          // 'open', 'closed', 'canceled'
      symbol:    request.market,  // symbol
      type:      'limit',         // 'market', 'limit'
      side:      'buy',           // 'buy', 'sell'
      price:     request.price,   // float price in quote currency
      amount:    request.amount,  // ordered amount of base currency
      filled:    0.0,             // filled amount of base currency
      remaining: request.amount,  // remaining amount to fill
      trades:   []
    };
    this.orders.add(order);
    return order;
  }

  createLimitSellOrder(request) {
    let order = {
      id:        uuid(),
      timestamp: +new Date(),   // Unix timestamp in milliseconds
      status:    'open',          // 'open', 'closed', 'canceled'
      symbol:    request.market,  // symbol
      type:      'limit',         // 'market', 'limit'
      side:      'sell',           // 'buy', 'sell'
      price:     request.price,   // float price in quote currency
      amount:    request.amount,  // ordered amount of base currency
      filled:    0.0,             // filled amount of base currency
      remaining: request.amount,  // remaining amount to fill
      trades:   []
    };
    this.orders.add(order);
    return order;
  }

  fetchOrders(symbol=undefined, since=undefined, limit=undefined) {
    let orders = this.orders.all();
    return orders.filter((order) => {
      if (symbol != undefined && order.symbol != symbol) return false;
      if (since != undefined && order.timestamp < since) return false;
      return true;
    });
  }
}

module.exports = MockAPI;
