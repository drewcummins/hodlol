"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Signal;
(function (Signal) {
    Signal[Signal["BUY"] = 0] = "BUY";
    Signal[Signal["SELL"] = 1] = "SELL";
    Signal[Signal["PASS"] = 2] = "PASS";
})(Signal = exports.Signal || (exports.Signal = {}));
class Indicator {
    constructor(feed, symbol, source) {
        this.feed = feed;
        this.symbol = symbol;
        this.last = 0;
        this.init(source);
    }
    init(source) {
        // no default
    }
    async evaluate(ticker) {
        // defaults to no action
        return Signal.PASS;
    }
    async tick() {
        const tickers = this.feed.candles;
        const ticker = tickers.get(this.symbol);
        if (this.isTickerUpdated(ticker)) {
            this.markTickerRead(ticker);
            return await this.evaluate(ticker);
        }
        return Signal.PASS;
    }
    isTickerUpdated(ticker) {
        const last = ticker.last();
        return last && last.timestamp > this.last;
    }
    markTickerRead(ticker) {
        const last = ticker.last();
        if (last)
            this.last = last.timestamp;
    }
}
exports.Indicator = Indicator;
class MultiIndicator extends Indicator {
    async init(source) {
        this.subindicators = [];
        for (const sub of source.subindicators) {
            const sig = await Promise.resolve().then(() => require(`./${sub.fileName}`));
            const sigClass = sig[sub.className];
            this.subindicators.push(new sigClass(this.feed, this.symbol, sub));
        }
    }
}
exports.MultiIndicator = MultiIndicator;
//# sourceMappingURL=index.js.map