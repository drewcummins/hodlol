import { MultiIndicator, Signal } from ".";
import { Ticker } from "../ticker";
import { Element } from "../types";

export class Any extends MultiIndicator {
  public async evaluate(ticker:Ticker):Promise<Signal> {
    for (const subindicator of this.subindicators) {
      let signal:Signal = await subindicator.tick();
      if (signal != Signal.PASS) return signal;
    }
    return Signal.PASS;
  }
}