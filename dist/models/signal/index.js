"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SignalCode;
(function (SignalCode) {
    SignalCode[SignalCode["BUY"] = 0] = "BUY";
    SignalCode[SignalCode["SELL"] = 1] = "SELL";
    SignalCode[SignalCode["PASS"] = 2] = "PASS";
})(SignalCode = exports.SignalCode || (exports.SignalCode = {}));
class Signal {
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
        return SignalCode.PASS;
    }
    async tick() {
        const tickers = this.feed.candles;
        const ticker = tickers.get(this.symbol);
        if (this.isTickerUpdated(ticker)) {
            this.markTickerRead(ticker);
            return await this.evaluate(ticker);
        }
        return SignalCode.PASS;
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
exports.Signal = Signal;
class MultiSignal extends Signal {
    async init(source) {
        this.subsignals = [];
        for (const sub of source.subsignals) {
            const sig = await Promise.resolve().then(() => require(`./${sub.fileName}`));
            const sigClass = sig[sub.className];
            this.subsignals.push(new sigClass(this.feed, this.symbol, sub));
        }
    }
}
exports.MultiSignal = MultiSignal;
//# sourceMappingURL=index.js.map