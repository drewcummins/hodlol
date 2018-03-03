import { MultiSignal, SignalCode } from ".";
import { Ticker } from "../ticker";

export class Any extends MultiSignal {
  public async evaluate(ticker:Ticker):Promise<SignalCode> {
    for (const subsignal of this.subsignals) {
      let signal:SignalCode = await subsignal.tick();
      if (signal != SignalCode.PASS) return signal;
    }
    return SignalCode.PASS;
  }
}