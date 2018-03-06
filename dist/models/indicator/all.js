"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
class All extends _1.MultiIndicator {
    async evaluate(ticker) {
        let consensus = null;
        for (const subsignal of this.subindicators) {
            let signal = await subsignal.tick();
            if (consensus == null) {
                consensus = signal;
            }
            else if (signal != consensus) {
                return _1.Signal.PASS;
            }
        }
        return consensus;
    }
}
exports.All = All;
//# sourceMappingURL=all.js.map