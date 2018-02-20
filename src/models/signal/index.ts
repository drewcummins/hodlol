import { Feed } from "../exchange";
import { Ticker } from "../ticker";
import { ID } from "../types";

export enum SignalCode {
  BUY,
  SELL,
  PASS
}

export interface SignalJSON {
  fileName: string,
  className: string
}

export class Signal {
  private last:number = 0;
  protected filename:string;
  constructor(protected feed:Feed, public symbol:string, source:SignalJSON) {
    this.init(source);
  }

  public init(source:SignalJSON) {
    // no default
  }

  public async evaluate(ticker:Ticker):Promise<SignalCode> {
    // defaults to no action
    return SignalCode.PASS;
  }

  public async tick():Promise<SignalCode> {
    const tickers = this.feed.candles;
    const ticker = tickers.get(this.symbol);
    if (this.isTickerUpdated(ticker)) {
      this.markTickerRead(ticker);
      return await this.evaluate(ticker);
    }
    return SignalCode.PASS;
  }

  protected isTickerUpdated(ticker:Ticker):boolean {
    const last = ticker.last();
    return last && last.timestamp > this.last;
  }

  protected markTickerRead(ticker:Ticker):void {
    const last = ticker.last();
    if (last) this.last = last.timestamp;
  }

}