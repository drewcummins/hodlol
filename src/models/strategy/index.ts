import { SignalJSON, Signal } from "../signal";
import { ID } from "../types";
import { Portfolio } from "../portfolio";
import { OrderRequest, Order } from "../order";
import { Feed } from "../exchange";
import { MACD } from "../signal/macd";
const uuid = require('uuid/v4');

export interface StrategyJSON {
  weight: number,
  indicators?: SignalJSON[],
  title?: string
}

export interface TraderStrategyInterface {
  fundSymbol: string,
  fundAmount: number,
  requestOrderHandler: (request:OrderRequest) => Order,
  feed: Feed
}

export class Strategy {
  readonly id:ID;
  readonly title:string;
  protected indicators:Signal[];

  constructor(public portfolio:Portfolio, source:StrategyJSON, protected tsi:TraderStrategyInterface) {
    this.id = uuid();
    this.title = source.title || "Strategy";
    
    this.init(source);
  } 

  public init(source:StrategyJSON) {
    source.indicators.forEach(async signal => {
      const sig = await import(`../signal/${signal.fileName}`);
      const sigClass = sig[signal.className];
      for (const [symbol,ticker] of this.tsi.feed.candles.entries()) {
        let indicator = new sigClass(this.tsi.feed, symbol, signal);
        this.indicators.push(indicator);
      }
    });
  }
}