"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require('uuid/v4');
class Strategy {
    constructor(portfolio, source, tsi) {
        this.portfolio = portfolio;
        this.tsi = tsi;
        this.id = uuid();
        this.title = source.title || "Strategy";
        this.init(source);
    }
    init(source) {
        // 
        source.indicators.forEach(signal => {
            let indicator = new window[signal.id](signal);
        });
    }
}
exports.Strategy = Strategy;
//# sourceMappingURL=index.js.map