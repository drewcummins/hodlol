import { Signal, IndicatorJSON, Indicator } from ".";
import { OHLCVTicker } from "../ticker";
import { OHLCV } from "../types";
import { LoggerApi } from "../../utils/logger"
const Bands = require('technicalindicators').BollingerBands;

const logger = new LoggerApi();


export enum OperationSeverity {
    aggressive = 0,
    midline,
    conservative,
}

export interface QuadBandJSON extends IndicatorJSON {
    prop: string,
    period: number,
    stdDev1: number,
    stdDev2: number,
    buyStyle: number,
    sellSeverity: OperationSeverity,
    buySeverity: OperationSeverity
}


export class OrderSpec {
    public lowBuy: number;
    public midBuy: number;
    public hold: number;
    public midSell: number;
    public highSell: number;
    constructor(band1:any, band2: any){
        this.lowBuy = band2.lower;
        this.midBuy = band1.lower;
        this.hold = band2.middle;
        this.midSell = band2.upper;
        this.highSell = band1.upper;
    }
}

export class QuadBand extends Indicator {

    protected prop:string;
    protected period:number;
    protected stdDev1:number;
    protected stdDev2:number;
    sellSeverity: OperationSeverity;
    buySeverity: OperationSeverity;


    public init(source:QuadBandJSON) {
        logger.info("received args:", source);
        this.stdDev1 = typeof source.stdDev1 !== "number" ? 2 : source.stdDev1;
        this.stdDev2 = typeof source.stdDev2 !== "number" ? 1 : source.stdDev2;
        this.period = typeof source.period !== "number" ? 20 : source.period;
        this.prop = typeof source.prop !== "string" ? "close" : source.prop;
        this.buySeverity = typeof source.buySeverity !== "number" ?  OperationSeverity.aggressive : source.buySeverity;
        this.sellSeverity = typeof source.sellSeverity !== "number" ?  OperationSeverity.aggressive : source.sellSeverity;
    }

    public async evaluate(ticker:OHLCVTicker):Promise<Signal> {
        let series = ticker.series;
        logger.info("evaluating");
        if (series && series.length() >= this.period) {
            let slice = series.transpose([this.prop], this.period); // this grabs the desired properties from the series
            let last:OHLCV = series.last();
            const orderSpec = this.generateAdvice(slice[0]);
            logger.info("generated advice:", orderSpec, " checking against last:", last);
            if (this.hasBuySignal(last, orderSpec)) {
                logger.info("Signal BUY");
                return Signal.BUY;
            }
            else if (this.hasSellSignal(last, orderSpec)) {
                logger.info("Signal SELL");
                return Signal.SELL;
            }
        }
        logger.info("no signal, PASS");
        return Signal.PASS;
    }

    protected hasBuySignal(last:OHLCV, spec:OrderSpec):boolean {
        //if the last price is between
        if (this.buySeverity === OperationSeverity.aggressive){
            return this.hasAggressiveBuySignal(last, spec);
        }

        if (this.buySeverity === OperationSeverity.midline){
            return this.hasMidlineBuySignal(last, spec);
        }

        if (this.buySeverity === OperationSeverity.conservative){
            return this.hasConservativeBuySignal(last, spec);
        }
        return false;

    }

    protected hasSellSignal(last:OHLCV, spec:OrderSpec):boolean {
        if (this.sellSeverity === OperationSeverity.aggressive){
            return this.hasAggressiveSellSignal(last, spec);
        }

        if (this.sellSeverity === OperationSeverity.midline){
            return this.hasMidlineSellSignal(last, spec);
        }

        if (this.sellSeverity === OperationSeverity.conservative){
            return this.hasConservativeSellSignal(last, spec);
        }
        return false;
    }

    /**
     * For an aggressive buyer (buy often), we buy anytime we are at more below hold
     * @param {number[]} last
     * @param {OrderSpec} spec
     */
    private hasAggressiveBuySignal(last:OHLCV, spec:OrderSpec):boolean{
        return last.close <= spec.hold;
    }

    /**
     * Midline buy means we should buy we are at or bloe the midBuy
     * @param {OHLCV} last
     * @param {OrderSpec} spec
     * @returns {boolean}
     */
    private hasMidlineBuySignal(last:OHLCV, spec:OrderSpec):boolean{
        return last.close <= spec.midBuy;
    }

    /**
     * conservative buy means we should buy if below lowBuy line
     * @param {OHLCV} last
     * @param {OrderSpec} spec
     * @returns {boolean}
     */
    private hasConservativeBuySignal(last:OHLCV, spec:OrderSpec):boolean{
        return last.close <= spec.lowBuy;
    }

    /**
     * For an aggressive seller, (sell often)
     * @param {number[]} last
     * @param {OrderSpec} spec
     */
    private hasAggressiveSellSignal(last:OHLCV, spec:OrderSpec):boolean{
        return last.close >= spec.hold;
    }

    /**
     * Midline sell means we should sell above low sell
     * @param {OHLCV} last
     * @param {OrderSpec} spec
     * @returns {boolean}
     */
    private hasMidlineSellSignal(last:OHLCV, spec:OrderSpec):boolean{
        return last.close >= spec.midSell;
    }

    /**
     * conservative sell means we should only if above high sell
     * @param {OHLCV} last
     * @param {OrderSpec} spec
     * @returns {boolean}
     */
    private hasConservativeSellSignal(last:OHLCV, spec:OrderSpec):boolean{
        return last.close >= spec.highSell;
    }

   

    private generateAdvice(data:Number[]):OrderSpec{
        //given a set of bars, generate two bollinger bands
        let std1 = Bands.calculate({
                                       period: this.period,
                                       values: data,
                                       stdDev: this.stdDev1
                                   })[0];


        let std2 = Bands.calculate({
                                       period: this.period,
                                       values: data,
                                       stdDev: this.stdDev2
                                   })[0];

        return new OrderSpec(std1, std2);
    };
}