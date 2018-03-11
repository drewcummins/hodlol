import { Signal, IndicatorJSON, Indicator } from ".";
import { OHLCVTicker } from "../ticker";
export interface ThresholdJSON extends IndicatorJSON {
    threshold: number;
}
export declare class Threshold extends Indicator {
    protected threshold: number;
    init(source: ThresholdJSON): void;
    evaluate(ticker: OHLCVTicker): Promise<Signal>;
}
