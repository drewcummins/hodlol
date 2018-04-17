import { Signal, IndicatorJSON, Indicator } from ".";
import { OHLCVTicker } from "../ticker";
import { OHLCV } from "../types";
export declare enum OperationSeverity {
    aggressive = 0,
    midline = 1,
    conservative = 2,
}
export interface QuadBandJSON extends IndicatorJSON {
    prop: string;
    period: number;
    stdDev1: number;
    stdDev2: number;
    buyStyle: number;
    sellSeverity: OperationSeverity;
    buySeverity: OperationSeverity;
}
export declare class OrderSpec {
    lowBuy: number;
    midBuy: number;
    hold: number;
    midSell: number;
    highSell: number;
    constructor(band1: any, band2: any);
}
export declare class QuadBand extends Indicator {
    protected prop: string;
    protected period: number;
    protected stdDev1: number;
    protected stdDev2: number;
    sellSeverity: OperationSeverity;
    buySeverity: OperationSeverity;
    init(source: QuadBandJSON): void;
    evaluate(ticker: OHLCVTicker): Promise<Signal>;
    protected hasBuySignal(last: OHLCV, spec: OrderSpec): boolean;
    protected hasSellSignal(last: OHLCV, spec: OrderSpec): boolean;
    /**
     * For an aggressive buyer (buy often), we buy anytime we are at more below hold
     * @param {number[]} last
     * @param {OrderSpec} spec
     */
    private hasAggressiveBuySignal(last, spec);
    /**
     * Midline buy means we should buy we are at or bloe the midBuy
     * @param {OHLCV} last
     * @param {OrderSpec} spec
     * @returns {boolean}
     */
    private hasMidlineBuySignal(last, spec);
    /**
     * conservative buy means we should buy if below lowBuy line
     * @param {OHLCV} last
     * @param {OrderSpec} spec
     * @returns {boolean}
     */
    private hasConservativeBuySignal(last, spec);
    /**
     * For an aggressive seller, (sell often)
     * @param {number[]} last
     * @param {OrderSpec} spec
     */
    private hasAggressiveSellSignal(last, spec);
    /**
     * Midline sell means we should sell above low sell
     * @param {OHLCV} last
     * @param {OrderSpec} spec
     * @returns {boolean}
     */
    private hasMidlineSellSignal(last, spec);
    /**
     * conservative sell means we should only if above high sell
     * @param {OHLCV} last
     * @param {OrderSpec} spec
     * @returns {boolean}
     */
    private hasConservativeSellSignal(last, spec);
    private generateAdvice(data);
}
