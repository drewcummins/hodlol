import { Signal, IndicatorJSON, Indicator } from ".";
import { Ticker, OHLCVTicker } from "../ticker";
import { Series } from "../series";
import { OHLCV } from "../types";

interface ThresholdJSON extends IndicatorJSON {
  threshold:number
}

export class Threshold extends Indicator {
  protected threshold:number;

  public init(source:ThresholdJSON) {
    this.threshold = source.threshold;
  }

  public async evaluate(ticker:OHLCVTicker):Promise<Signal> {
    // we need at least 2 data points to look at whether we jumped or not
    if (ticker.length() > 1) {
      let prev:OHLCV = ticker.getAt(-2);
      let curr:OHLCV = ticker.getAt(-1);
      let phi:number = curr.close/prev.close;
      if (phi - 1 > this.threshold) {
        return Signal.SELL;
      } else if (1 - phi > this.threshold) {
        return Signal.BUY;
      }
    }
    return Signal.PASS;
  }
}