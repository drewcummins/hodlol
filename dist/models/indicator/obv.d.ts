import { Indicator, IndicatorJSON, Signal } from ".";
import { OHLCVTicker } from "../ticker";
export interface OBVJSON extends IndicatorJSON {
    props?: string[];
}
export declare class OBV extends Indicator {
    protected props: string[];
    protected periods: number[];
    init(source: OBVJSON): void;
    evaluate(ticker: OHLCVTicker): Promise<Signal>;
    protected hasBuySignal(obv: number[]): boolean;
    protected hasSellSignal(obv: number[]): boolean;
}
