import { Signal, IndicatorJSON, Indicator } from ".";
import { OHLCVTicker } from "../ticker";
export interface MACDJSON extends IndicatorJSON {
    props?: string[];
    periods?: number[];
}
export declare class MACD extends Indicator {
    protected props: string[];
    protected periods: number[];
    init(source: MACDJSON): void;
    evaluate(ticker: OHLCVTicker): Promise<Signal>;
    protected hasBuySignal(macd: number[]): boolean;
    protected hasSellSignal(macd: number[]): boolean;
}
