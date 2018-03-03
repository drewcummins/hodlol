import { API, Num, BN, Balance, Scenario, OrderTick, Order, OHLCVTick, Ticker, TickerTick, ID } from "./types";
import { OrderType, OrderSide, OrderStatus } from "./order"
import { Feed } from "./exchange";
import { Series, OHLCVSerializer } from "./series";
import { Thread } from "../utils";
import { OHLCVTicker } from "./ticker";
const uuid = require('uuid/v4');

export class MockAPI implements API {
  public name:string;
  private thread:Thread;
  protected candles:Map<string, Series> = new Map<string, Series>();
  protected orders:Map<string, OrderTick> = new Map<string, OrderTick>();
  constructor(protected api:API) {
    this.name = api.name;
  }

  public async loadTickers(feed:Feed) {
    for (const candle of feed.candles.values()) {
      let series = candle.seriesFromTicker();
      await series.read();
      this.candles.set(candle.symbol, series);
    }
  }

  public async run() {
    this.thread = new Thread();
    while (this.thread.isRunning()) {
      await this.thread.sleep(1);
      // fill any open orders
      this.orders.forEach((order:OrderTick) => {
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

  public async fetchTicker(pair:string):Promise<TickerTick> {
    // not using this yet
    return;
  }

  public async fetchOHLCV(symbol:string, period:string, since:number|undefined):Promise<OHLCVTick[]> {
    let series = this.candles.get(symbol);
    let [ohlcv] = series.nearest(Scenario.getInstance().time);
    return [ohlcv.state as OHLCVTick];
  }

  public async createLimitBuyOrder(market:string, amount:Num, price:Num):Promise<OrderTick> {
    let order:OrderTick = {
      id:        uuid(),
      datetime:  "N/A",
      timestamp: +new Date(),               // Unix timestamp in milliseconds
      status:    OrderStatus.OPEN,          // 'open', 'closed', 'canceled'
      symbol:    market,                    // symbol
      type:      OrderType.LIMIT,           // 'market', 'limit'
      side:      OrderSide.BUY,             // 'buy', 'sell'
      price:     Number(price),                     // float price in quote currency
      amount:    Number(amount),                    // ordered amount of base currency
      cost:      BN(price).times(amount).toNumber(),
      filled:    0.0,                       // filled amount of base currency
      remaining: Number(amount),
      fee: 0,
      info: {}
    };
    this.orders.set(order.id, order);
    return order;
  }

  public createLimitSellOrder(market:string, amount:Num, price:Num):Promise<OrderTick> {
    let order:OrderTick = {
      id:        uuid(),
      datetime:  "N/A",
      timestamp: +new Date(),               // Unix timestamp in milliseconds
      status:    OrderStatus.OPEN,          // 'open', 'closed', 'canceled'
      symbol:    market,                    // symbol
      type:      OrderType.LIMIT,           // 'market', 'limit'
      side:      OrderSide.SELL,             // 'buy', 'sell'
      price:     Number(price),                     // float price in quote currency
      amount:    Number(amount),                    // ordered amount of base currency
      cost:      BN(price).times(amount).toNumber(),
      filled:    0.0,                       // filled amount of base currency
      remaining: Number(amount),
      fee: 0,
      info: {}
    };
    this.orders.set(order.id, order);
    return Promise.resolve(order);
  }

  public fetchOrders(symbol:string, since:number=-1, limit:number=100):Promise<OrderTick[]> {
    let orders:OrderTick[] = [];
    this.orders.forEach((val:OrderTick) => {
      if (val.symbol == symbol && val.timestamp >= since) orders.push(val);
    });
    return Promise.resolve(orders.slice(0, limit));
  }

  public fetchOrder(orderID:string, symbol:string):Promise<OrderTick> {
    return Promise.resolve(this.orders.get(orderID));
  }

  public fetchBalance():Promise<Balance> {
    return Promise.resolve({free:BN(0), reserved:BN(0)});
  }

  public cancelOrder(id:ID):Promise<any> {
    if (this.orders.has(id)) {
      let order:OrderTick = this.orders.get(id);
      order.status = OrderStatus.CANCELED;
      return Promise.resolve(order);
    }
    return Promise.resolve({});
  }
}