import { API, Num, BN, Balance } from "./types";
import { Order, OrderType, OrderSide, OrderStatus } from "./order"
import { Feed } from "./exchange";
import { Series, Tick, CandleSerializer } from "./series";
import { Thread } from "../utils";
import { CandleTicker } from "./ticker";
const uuid = require('uuid/v4');

export class MockAPI implements API {
  public name:string;
  public time:number;
  private thread:Thread;
  protected candles:Map<string, Series> = new Map<string, Series>();
  protected orders:Map<string, Order> = new Map<string, Order>();
  constructor(protected api:API) {
    this.name = api.name;
  }

  protected async loadTickers(feed:Feed) {
    for (const candle of feed.candles.values()) {
      let series = candle.seriesFromTicker();
      await series.read();
      this.candles.set(candle.symbol, series);
    }
  }

  public async run(feed:Feed) {
    await this.loadTickers(feed);
    this.thread = new Thread();
    while (this.thread.isRunning()) {
      await this.thread.sleep(1);
      // fill any open orders
      this.orders.forEach((order:Order) => {
        if (order.status == OrderStatus.OPEN) {
          order.status = OrderStatus.CLOSED;
          order.filled = order.amount;
          order.remaining = 0;
        }
      });
    }
  }

  public async loadMarkets():Promise<any> {
    return this.api.loadMarkets();
  }

  public async fetchTicker(pair:string):Promise<any> {
    // not using this yet
    return;
  }

  public async fetchOHLCV(symbol:string, period:string, since:number|undefined):Promise<any> {
    let series = this.candles.get(symbol);
    let [tick] = series.nearest(this.time);
    let serializer = series.serializer as CandleSerializer;
    return Promise.resolve(serializer.toCCXT(tick));
  }

  public async createLimitBuyOrder(market:string, amount:Num, price:Num):Promise<Order> {
    let order:Order = {
      id:        uuid(),
      timestamp: +new Date(),               // Unix timestamp in milliseconds
      status:    OrderStatus.OPEN,          // 'open', 'closed', 'canceled'
      symbol:    market,                    // symbol
      type:      OrderType.LIMIT,           // 'market', 'limit'
      side:      OrderSide.BUY,             // 'buy', 'sell'
      price:     price,                     // float price in quote currency
      amount:    amount,                    // ordered amount of base currency
      cost:      BN(price).times(amount),
      filled:    0.0,                       // filled amount of base currency
      remaining: amount,
    };
    this.orders.set(order.id, order);
    return Promise.resolve(order);
  }

  public createLimitSellOrder(market:string, amount:Num, price:Num):Promise<Order> {
    let order:Order = {
      id:        uuid(),
      timestamp: +new Date(),             // Unix timestamp in milliseconds
      status:    OrderStatus.OPEN,        // 'open', 'closed', 'canceled'
      symbol:    market,                  // symbol
      type:      OrderType.LIMIT,         // 'market', 'limit'
      side:      OrderSide.SELL,          // 'buy', 'sell'
      price:     price,                   // float price in quote currency
      amount:    amount,                  // ordered amount of base currency
      cost:      BN(price).times(amount),
      filled:    0.0,                     // filled amount of base currency
      remaining: amount,
    };
    this.orders.set(order.id, order);
    return Promise.resolve(order);
  }

  public fetchOrders(symbol:string, since:number=-1, limit:number=100):Promise<any> {
    let orders:Order[] = [];
    this.orders.forEach((val:Order) => {
      if (val.symbol == symbol && val.timestamp >= since) orders.push(val);
    });
    return Promise.resolve(orders.slice(0, limit));
  }

  public fetchOrder(orderID:string, symbol:string):Promise<any> {
    return Promise.resolve(this.orders.get(orderID));
  }

  public fetchBalance():Promise<Balance> {
    return Promise.resolve({free:BN(0), reserved:BN(0)});
  }
}