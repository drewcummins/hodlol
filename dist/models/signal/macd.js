"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const tulind = require('tulind');
class MACD extends _1.Signal {
    init(source) {
        this.filename = "macd";
        this.props = source.props || ["close"];
        this.periods = source.periods || [2, 5, 9];
    }
    async evaluate(ticker) {
        let series = ticker.series;
        if (series && series.length() >= this.periods[2]) {
            let slice = series.transpose(this.props, this.periods[2] * 5); // this grabs the desired properties from the series
            let last = series.last();
            // [macd, macd signal, macd histogram]
            let [foo, bar, histo] = await tulind.indicators.macd.indicator(slice, this.periods);
            if (this.hasBuySignal(histo))
                return _1.SignalCode.BUY;
            else if (this.hasSellSignal(histo))
                return _1.SignalCode.SELL;
        }
        return _1.SignalCode.PASS;
    }
    hasBuySignal(macd) {
        let slice = macd.slice(-3);
        return slice[0] < 0 && slice[1] > 0 && slice[2] > slice[1] * 5;
    }
    hasSellSignal(macd) {
        let slice = macd.slice(-3);
        return slice[0] > 0 && slice[1] < 0 && slice[2] < slice[1] * 10;
    }
}
exports.MACD = MACD;
//# sourceMappingURL=macd.js.map