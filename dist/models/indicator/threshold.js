"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
class Threshold extends _1.Indicator {
    init(source) {
        this.threshold = source.threshold;
    }
    async evaluate(ticker) {
        // we need at least 2 data points to look at whether we jumped or not
        if (ticker.length() > 1) {
            let prev = ticker.getAt(-2);
            let curr = ticker.getAt(-1);
            let phi = curr.close / prev.close;
            if (phi - 1 > this.threshold) {
                return _1.Signal.SELL;
            }
            else if (1 - phi > this.threshold) {
                return _1.Signal.BUY;
            }
        }
        return _1.Signal.PASS;
    }
}
exports.Threshold = Threshold;
//# sourceMappingURL=threshold.js.map