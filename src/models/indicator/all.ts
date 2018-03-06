import { MultiIndicator, Signal } from ".";
import { Ticker } from "../ticker";
import { Element } from "../types";

export class All extends MultiIndicator {
  public async evaluate(ticker:Ticker):Promise<Signal> {
    let consensus:Signal = null;
    for (const subsignal of this.subindicators) {
      let signal:Signal = await subsignal.tick();
      if (consensus == null) {
        consensus = signal;
      } else if (signal != consensus) {
        return Signal.PASS;
      }
    }
    return consensus;
  }
}