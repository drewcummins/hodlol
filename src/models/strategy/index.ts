import { Indicator, IndicatorJSON, Signal } from "../indicator";
import { ID, Num, BN, Value, Order, OHLCV } from "../types";
import { Portfolio } from "../portfolio";
import { OrderRequest, OrderType, OrderSide, LimitOrderRequest, LimitSellOrderRequest, MarketBuyOrderRequest, MarketSellOrderRequest } from "../order";
import { Feed } from "../exchange";
import { MACD } from "../indicator/macd";
import { OHLCVTicker } from "../ticker";
import { InvalidSignalError } from "../../errors";
import { IMarket } from "../market";
import { load } from "../../utils";
const uuid = require('uuid/v4');

export interface StrategyJSON {
  fileName: string,
  className: string,
  weight: number,
  indicators?: IndicatorJSON[],
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
  protected indicators:Indicator[] = [];
  protected orders:Map<ID,Order> = new Map<ID,Order>();
  public originalValue:Value;

  constructor(public portfolio:Portfolio, source:StrategyJSON, protected tsi:TraderStrategyInterface) {
    this.id = uuid();
    this.title = source.title || this.getTitle();
    this.initialValue = tsi.fundAmount;
    this.init(source);
  } 

  public async before() {
    //
  }

  public async after() {
    //
  }

  protected init(source:StrategyJSON) {
    const feed = this.tsi.feed;
    if (source.indicators) {
      source.indicators.forEach(async signal => {
        const sig = await load(signal.fileName, "models/indicator", "../indicator");
        const sigClass = sig[signal.className];
        for (const [symbol, ticker] of feed.candles.entries()) {
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
      if (signal == Signal.PASS) continue;

      let ticker:OHLCVTicker = feed.candles.get(indicator.symbol);
      let last:OHLCV = ticker.last();
      let market:IMarket = this.portfolio.marketBySymbol(indicator.symbol);
      if (signal == Signal.BUY) {
        let [base, quote] = this.portfolio.balanceByMarket(indicator.symbol);
        if (BN(quote.free).isGreaterThan(0)) {
          // greedily use up funds
          const order = await this.placeLimitBuyOrder(market, BN(quote.free), BN(last.close));
        }
      } else if (signal == Signal.SELL) {
        let [base, quote] = this.portfolio.balanceByMarket(indicator.symbol);
        if (BN(base.free).isGreaterThan(0)) {
          const order = await this.placeLimitSellOrder(market, BN(base.free), BN(last.close));
        }
      } else {
        throw new InvalidSignalError(indicator, signal);
      }
    };
  }

  protected async placeOrder(request:OrderRequest):Promise<Order> {
    try {
      let order:Order = await this.tsi.requestOrderHandler(this, request);
      this.orders.set(order.state.id, order);
      return order;
    } catch(err) {
      // default to doing nothing; strategy subclasses can handle this differently
      return null; 
    }
  }

  protected async placeLimitBuyOrder(market:IMarket, budget:Num, close:Num):Promise<Order> {
    return this.placeOrder(LimitOrderRequest.buyMaxWithBudget(market, budget, close, this.portfolio.id));
  }

  protected async placeLimitSellOrder(market:IMarket, budget:Num, close:Num):Promise<Order> {
    return this.placeOrder(new LimitSellOrderRequest(market, budget, close, this.portfolio.id));
  }

  protected getTitle():string {
    return "Strategy";
  }
}