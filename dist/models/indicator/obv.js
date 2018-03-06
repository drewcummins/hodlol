"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const tulind = require('tulind');
class OBV extends _1.Indicator {
    init(source) {
        this.props = source.props || ["close", "volume"];
    }
    async evaluate(ticker) {
        let series = ticker.series;
        if (series && series.length() > 0) {
            let slice = series.transpose(this.props, 50);
            let last = series.last();
            let obv = await tulind.indicators.obv.indicator(slice, []);
            if (this.hasBuySignal(obv[0]))
                return _1.Signal.BUY;
            else if (this.hasSellSignal(obv[0]))
                return _1.Signal.SELL;
        }
        return _1.Signal.PASS;
    }
    hasBuySignal(obv) {
        let slice = obv.slice(-3);
        return slice[1] < 0 && slice[2] > 0;
    }
    hasSellSignal(obv) {
        let slice = obv.slice(-3);
        return slice[1] > 0 && slice[2] < 0;
    }
}
exports.OBV = OBV;
//# sourceMappingURL=obv.js.map