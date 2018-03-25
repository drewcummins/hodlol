import { Feed } from "../exchange";
import { Ticker, BaseTicker } from "../ticker";
import { ID, Element } from "../types";
import { load } from "../../utils";

export enum Signal {
  BUY,
  SELL,
  PASS
}

export interface IndicatorJSON {
  fileName: string,
  className: string
}

export class Indicator {
  private last:number = 0;
  constructor(protected feed:Feed, public symbol:string, source:IndicatorJSON) {
    this.init(source);
  }

  public init(source:IndicatorJSON):void {
    // no default
  }

  public async evaluate(ticker:BaseTicker<Element>):Promise<Signal> {
    // defaults to no action
    return Signal.PASS;
  }

  public async tick():Promise<Signal> {
    const tickers = this.feed.candles;
    const ticker = tickers.get(this.symbol);
    if (this.isTickerUpdated(ticker)) {
      this.markTickerRead(ticker);
      return await this.evaluate(ticker);
    }
    return Signal.PASS;
  }

  protected isTickerUpdated(ticker:BaseTicker<Element>):boolean {
    const last = ticker.last();
    return last && last.timestamp > this.last;
  }

  protected markTickerRead(ticker:BaseTicker<Element>):void {
    const last = ticker.last();
    if (last) this.last = last.timestamp;
  }

}

export interface MultiIndicatorJSON extends IndicatorJSON {
  subindicators:IndicatorJSON[]
}

export class MultiIndicator extends Indicator {
  protected subindicators:Indicator[];
  public async init(source:MultiIndicatorJSON) {
    this.subindicators = [];
    for (const sub of source.subindicators) {
      const sig = await load(sub.fileName, "models/indicator", "./");
      const sigClass = sig[sub.className];
      this.subindicators.push(new sigClass(this.feed, this.symbol, sub));
    }
  }
}