import { Signal, IndicatorJSON, Indicator } from ".";
import { Ticker, OHLCVTicker } from "../ticker";

const tulind = require('tulind');

export interface MACDJSON extends IndicatorJSON {
  props?: string[],
  periods?: number[]
}

export class MACD extends Indicator {

  protected props:string[];
  protected periods:number[];

  public init(source:MACDJSON) {
    this.props = source.props || ["close"];
    this.periods = source.periods || [2, 5, 9];
  }

  public async evaluate(ticker:OHLCVTicker):Promise<Signal> {
    let series = ticker.series;
    if (series && series.length() >= this.periods[2]) {
      let slice = series.transpose(this.props, this.periods[2] * 5); // this grabs the desired properties from the series
      let last = series.last();
      // [macd, macd signal, macd histogram]
      let [, , histo] = await tulind.indicators.macd.indicator(slice, this.periods);
      if (this.hasBuySignal(histo)) return Signal.BUY;
      else if (this.hasSellSignal(histo)) return Signal.SELL;
    }
    return Signal.PASS;
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