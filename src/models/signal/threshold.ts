import { Signal, SignalJSON, SignalCode } from ".";
import { Ticker } from "../ticker";
import { Series } from "../series";
import { OHLCV } from "../types";

interface ThresholdJSON extends SignalJSON {
  threshold:number
}

export class Threshold extends Signal {
  protected threshold:number;

  public init(source:ThresholdJSON) {
    this.threshold = source.threshold;
  }

  public async evaluate(ticker:Ticker):Promise<SignalCode> {
    let series:Series = ticker.series;
    // we need at least 2 data points to look at whether we jumped or not
    if (series && series.length() > 1) {
      let last:OHLCV = series.getAt(-2) as OHLCV;
      let curr:OHLCV = series.getAt(-1) as OHLCV;
      let phi:number = curr.close/last.close;
      if (phi - 1 > this.threshold) {
        return SignalCode.SELL;
      } else if (1 - phi > this.threshold) {
        return SignalCode.BUY;
      }
    }
    return SignalCode.PASS;
  }
}