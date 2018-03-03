"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
class Any extends _1.MultiSignal {
    async evaluate(ticker) {
        for (const subsignal of this.subsignals) {
            let signal = await subsignal.tick();
            if (signal != _1.SignalCode.PASS)
                return signal;
        }
        return _1.SignalCode.PASS;
    }
}
exports.Any = Any;
//# sourceMappingURL=any.js.map