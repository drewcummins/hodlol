"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const logger_1 = require("../../utils/logger");
const Bands = require('technicalindicators').BollingerBands;
const logger = new logger_1.LoggerApi();
var OperationSeverity;
(function (OperationSeverity) {
    OperationSeverity[OperationSeverity["aggressive"] = 0] = "aggressive";
    OperationSeverity[OperationSeverity["midline"] = 1] = "midline";
    OperationSeverity[OperationSeverity["conservative"] = 2] = "conservative";
})(OperationSeverity = exports.OperationSeverity || (exports.OperationSeverity = {}));
class OrderSpec {
    constructor(band1, band2) {
        this.lowBuy = band2.lower;
        this.midBuy = band1.lower;
        this.hold = band2.middle;
        this.midSell = band2.upper;
        this.highSell = band1.upper;
    }
}
exports.OrderSpec = OrderSpec;
class QuadBand extends _1.Indicator {
    init(source) {
        logger.info("received args:", source);
        this.stdDev1 = typeof source.stdDev1 !== "number" ? 2 : source.stdDev1;
        this.stdDev2 = typeof source.stdDev2 !== "number" ? 1 : source.stdDev2;
        this.period = typeof source.period !== "number" ? 20 : source.period;
        this.prop = typeof source.prop !== "string" ? "close" : source.prop;
        this.buySeverity = typeof source.buySeverity !== "number" ? OperationSeverity.aggressive : source.buySeverity;
        this.sellSeverity = typeof source.sellSeverity !== "number" ? OperationSeverity.aggressive : source.sellSeverity;
    }
    async evaluate(ticker) {
        let series = ticker.series;
        logger.info("evaluating");
        if (series && series.length() >= this.period) {
            let slice = series.transpose([this.prop], this.period); // this grabs the desired properties from the series
            let last = series.last();
            const orderSpec = this.generateAdvice(slice[0]);
            logger.info("generated advice:", orderSpec, " checking against last:", last);
            if (this.hasBuySignal(last, orderSpec)) {
                logger.info("Signal BUY");
                return _1.Signal.BUY;
            }
            else if (this.hasSellSignal(last, orderSpec)) {
                logger.info("Signal SELL");
                return _1.Signal.SELL;
            }
        }
        logger.info("no signal, PASS");
        return _1.Signal.PASS;
    }
    hasBuySignal(last, spec) {
        //if the last price is between
        if (this.buySeverity === OperationSeverity.aggressive) {
            return this.hasAggressiveBuySignal(last, spec);
        }
        if (this.buySeverity === OperationSeverity.midline) {
            return this.hasMidlineBuySignal(last, spec);
        }
        if (this.buySeverity === OperationSeverity.conservative) {
            return this.hasConservativeBuySignal(last, spec);
        }
        return false;
    }
    hasSellSignal(last, spec) {
        if (this.sellSeverity === OperationSeverity.aggressive) {
            return this.hasAggressiveSellSignal(last, spec);
        }
        if (this.sellSeverity === OperationSeverity.midline) {
            return this.hasMidlineSellSignal(last, spec);
        }
        if (this.sellSeverity === OperationSeverity.conservative) {
            return this.hasConservativeSellSignal(last, spec);
        }
        return false;
    }
    /**
     * For an aggressive buyer (buy often), we buy anytime we are at more below hold
     * @param {number[]} last
     * @param {OrderSpec} spec
     */
    hasAggressiveBuySignal(last, spec) {
        return last.close <= spec.hold;
    }
    /**
     * Midline buy means we should buy we are at or bloe the midBuy
     * @param {OHLCV} last
     * @param {OrderSpec} spec
     * @returns {boolean}
     */
    hasMidlineBuySignal(last, spec) {
        return last.close <= spec.midBuy;
    }
    /**
     * conservative buy means we should buy if below lowBuy line
     * @param {OHLCV} last
     * @param {OrderSpec} spec
     * @returns {boolean}
     */
    hasConservativeBuySignal(last, spec) {
        return last.close <= spec.lowBuy;
    }
    /**
     * For an aggressive seller, (sell often)
     * @param {number[]} last
     * @param {OrderSpec} spec
     */
    hasAggressiveSellSignal(last, spec) {
        return last.close >= spec.hold;
    }
    /**
     * Midline sell means we should sell above low sell
     * @param {OHLCV} last
     * @param {OrderSpec} spec
     * @returns {boolean}
     */
    hasMidlineSellSignal(last, spec) {
        return last.close >= spec.midSell;
    }
    /**
     * conservative sell means we should only if above high sell
     * @param {OHLCV} last
     * @param {OrderSpec} spec
     * @returns {boolean}
     */
    hasConservativeSellSignal(last, spec) {
        return last.close >= spec.highSell;
    }
    generateAdvice(data) {
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
    }
    ;
}
exports.QuadBand = QuadBand;
//# sourceMappingURL=quad-band.js.map