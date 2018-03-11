import { Indicator, IndicatorJSON, Signal } from ".";
import { Ticker, OHLCVTicker } from "../ticker";
import { Tick, ExchangeState } from "../types";

const tulind = require('tulind');

export interface OBVJSON extends IndicatorJSON {
  props?: string[]
}

export class OBV extends Indicator {

  protected props:string[];
  protected periods:number[];

  public init(source:OBVJSON) {
    this.props = source.props || ["close", "volume"];
  }

  public async evaluate(ticker:OHLCVTicker):Promise<Signal> {
    let series = ticker.series;
    if (series && series.length() > 0) {
      let slice:Number[][] = series.transpose(this.props, 50);
      let last:Tick<ExchangeState> = series.last();
      let obv = await tulind.indicators.obv.indicator(slice, []);
      if (this.hasBuySignal(obv[0])) return Signal.BUY;
      else if (this.hasSellSignal(obv[0])) return Signal.SELL;
    }
    return Signal.PASS;
  }

  protected hasBuySignal(obv:number[]):boolean {
    let slice = obv.slice(-3);
    return slice[1] < 0 && slice[2] > 0;
  }

  protected hasSellSignal(obv:number[]):boolean {
    let slice = obv.slice(-3);
    return slice[1] > 0 && slice[2] < 0;
  }

}