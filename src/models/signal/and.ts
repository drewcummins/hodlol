import { MultiSignal, SignalCode } from ".";
import { Ticker } from "../ticker";

export class And extends MultiSignal {
  public async evaluate(ticker:Ticker):Promise<SignalCode> {
    let consensus:SignalCode = null;
    for (const subsignal of this.subsignals) {
      let signal:SignalCode = await subsignal.tick();
      if (consensus == null) {
        consensus = signal;
      } else if (signal != consensus) {
        return SignalCode.PASS;
      }
    }
    return consensus;
  }
}