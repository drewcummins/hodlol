import { Signal, SignalJSON, SignalCode } from ".";
import { Ticker } from "../ticker";
import { Tick, ExchangeState } from "../types";

const tulind = require('tulind');

interface OBVJSON extends SignalJSON {
  props?: string[]
}

export class OBV extends Signal {

  protected props:string[];
  protected periods:number[];

  public init(source:OBVJSON) {
    this.props = source.props || ["close", "volume"];
  }

  public async evaluate(ticker:Ticker):Promise<SignalCode> {
    let series = ticker.series;
    if (series && series.length() > 0) {
      let slice:Number[][] = series.transpose(this.props, 50);
      let last:Tick<ExchangeState> = series.last();
      let obv = await tulind.indicators.obv.indicator(slice, []);
      if (this.hasBuySignal(obv[0])) return SignalCode.BUY;
      else if (this.hasSellSignal(obv[0])) return SignalCode.SELL;
    }
    return SignalCode.PASS;
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