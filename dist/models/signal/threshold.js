"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
class Threshold extends _1.Signal {
    init(source) {
        this.threshold = source.threshold;
    }
    async evaluate(ticker) {
        let series = ticker.series;
        // we need at least 2 data points to look at whether we jumped or not
        if (series && series.length() > 1) {
            let last = series.getAt(-2);
            let curr = series.getAt(-1);
            let phi = curr.close / last.close;
            if (phi - 1 > this.threshold) {
                return _1.SignalCode.SELL;
            }
            else if (1 - phi > this.threshold) {
                return _1.SignalCode.BUY;
            }
        }
        return _1.SignalCode.PASS;
    }
}
exports.Threshold = Threshold;
//# sourceMappingURL=threshold.js.map