"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
class Any extends _1.MultiIndicator {
    async evaluate(ticker) {
        for (const subindicator of this.subindicators) {
            let signal = await subindicator.tick();
            if (signal != _1.Signal.PASS)
                return signal;
        }
        return _1.Signal.PASS;
    }
}
exports.Any = Any;
//# sourceMappingURL=any.js.map