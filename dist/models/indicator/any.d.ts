import { MultiIndicator, Signal } from ".";
import { Ticker } from "../ticker";
export declare class Any extends MultiIndicator {
    evaluate(ticker: Ticker): Promise<Signal>;
}
