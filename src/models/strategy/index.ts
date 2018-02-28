import { SignalJSON, Signal, SignalCode } from "../signal";
import { ID, Num, BN, Value } from "../types";
import { Portfolio } from "../portfolio";
import { OrderRequest, Order, OrderType, OrderSide } from "../order";
import { Feed } from "../exchange";
import { MACD } from "../signal/macd";
import { CandleTicker } from "../ticker";
import { Tick } from "../series";
import { InvalidSignalError } from "../../errors/exchange-error";
const uuid = require('uuid/v4');

export interface StrategyJSON {
  fileName: string,
  className: string,
  weight: number,
  indicators?: SignalJSON[],
  title?: string
}

export interface TraderStrategyInterface {
  fundSymbol: string,
  fundAmount: number,
  requestOrderHandler: (strategy:Strategy, request:OrderRequest) => Order,
  feed: Feed
}

export class Strategy {
  readonly id:ID;
  readonly title:string;
  readonly initialValue:Num;
  protected indicators:Signal[] = [];
  protected orders:Map<ID,Order> = new Map<ID,Order>();
  public originalValue:Value;

  constructor(public portfolio:Portfolio, source:StrategyJSON, protected tsi:TraderStrategyInterface) {
    this.id = uuid();
    this.title = source.title || this.getTitle();
    this.initialValue = tsi.fundAmount;
    this.init(source);
  } 

  public async before() {
    // console.log(`Strategy ${this.title} before called.`);
  }

  public async after() {
    // console.log(`Strategy ${this.title} after called.`);
  }

  protected init(source:StrategyJSON) {
    const feed = this.tsi.feed;
    if (source.indicators) {
      source.indicators.forEach(async signal => {
        const sig = await import(`../signal/${signal.fileName}`);
        const sigClass = sig[signal.className];
        for (const [symbol,ticker] of feed.candles.entries()) {
          let indicator = new sigClass(feed, symbol, signal);
          this.indicators.push(indicator);
        }
      });
    }
  }

  public async tick() {
    const feed = this.tsi.feed;
    for (let indicator of this.indicators) {
      let signal = await indicator.tick();
      if (signal == SignalCode.PASS) continue;

      let ticker:CandleTicker = feed.candles.get(indicator.symbol);
      let last:Tick = ticker.last();
      if (signal == SignalCode.BUY) {
        let [base, quote] = this.portfolio.balanceByMarket(indicator.symbol);
        if (BN(quote.free).isGreaterThan(0)) {
          // greedily use up funds
          const order = await this.placeLimitBuyOrder(indicator.symbol, BN(quote.free).toNumber(), BN(last.close));
        }
      } else if (signal == SignalCode.SELL) {
        let [base, quote] = this.portfolio.balanceByMarket(indicator.symbol);
        if (BN(base.free).isGreaterThan(0)) {
          const order = await this.placeLimitSellOrder(indicator.symbol, BN(base.free).toNumber(), BN(last.close));
        }
      } else {
        throw new InvalidSignalError(indicator, signal);
      }
    };
  }

  protected async placeLimitBuyOrder(symbol:string, budget:Num, close:Num):Promise<Order> {
    let amount = BN(budget).dividedBy(BN(close));
    return await this.requestOrder(OrderType.LIMIT, OrderSide.BUY, symbol, amount, close);
  }

  protected async placeLimitSellOrder(symbol:string, budget:Num, close:Num):Promise<Order> {
    return await this.requestOrder(OrderType.LIMIT, OrderSide.SELL, symbol, budget, close);
  }

  protected async requestOrder(type:OrderType, side:OrderSide, market:string, amount:Num, price:Num=null):Promise<Order> {
    let request = new OrderRequest(type, side, market, amount, price, this.portfolio.id);
    try {
      let order = await this.tsi.requestOrderHandler(this, request);
      this.orders.set(order.id, order);
      return order;
    } catch(err) {
      // console.log("Error on request order:", request, err.message);
      return null; // figure out how we want to handle this generic error case
    }
  }

  protected getTitle():string {
    return "Strategy";
  }
}