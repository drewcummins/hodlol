import { Signal, SignalJSON, SignalCode } from ".";
import { Ticker } from "../ticker";

const tulind = require('tulind');

interface MACDJSON extends SignalJSON {
  props?: string[],
  periods?: number[]
}

export class MACD extends Signal {

  protected props:string[];
  protected periods:number[];

  public init(source:MACDJSON) {
    this.filename = "macd";
    this.props = source.props || ["close"];
    this.periods = source.periods || [2, 5, 9];
  }

  public async evaluate(ticker:Ticker):Promise<SignalCode> {
    let series = ticker.series;
    if (series && series.length() >= this.periods[2]) {
      let slice = series.transpose(this.props, this.periods[2] * 5); // this grabs the desired properties from the series
      let last = series.last();
      // [macd, macd signal, macd histogram]
      let [, , histo] = await tulind.indicators.macd.indicator(slice, this.periods);
      if (this.hasBuySignal(histo)) return SignalCode.BUY;
      else if (this.hasSellSignal(histo)) return SignalCode.SELL;
    }
    return SignalCode.PASS;
  }

  protected hasBuySignal(macd:number[]):boolean {
    let slice = macd.slice(-3);
    return slice[0] < 0 && slice[1] > 0 && slice[2] > slice[1] * 5;
  }

  protected hasSellSignal(macd:number[]):boolean {
    let slice = macd.slice(-3);
    return slice[0] > 0 && slice[1] < 0 && slice[2] < slice[1] * 10;
  }

}