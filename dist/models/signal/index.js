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
//# sourceMappingURL=index.js.map