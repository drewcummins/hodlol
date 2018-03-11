import { MultiIndicator, Signal } from ".";
import { Ticker } from "../ticker";
export declare class All extends MultiIndicator {
    evaluate(ticker: Ticker): Promise<Signal>;
}
