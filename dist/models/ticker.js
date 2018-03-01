"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const series_1 = require("./series");
const utils_1 = require("../utils");
const types_1 = require("./types");
class Ticker {
    constructor(exchange, symbol) {
        this.exchange = exchange;
        this.symbol = symbol;
        this._kill = false;
        this.series = new series_1.Series(this.filepath(), this.generateSerializer());
        this.thread = new utils_1.Thread();
        this.timeout = types_1.Scenario.getInstance().mode == types_1.ScenarioMode.PLAYBACK ? 1 : 5000;
    }
    /**
     * Kicks off the ticker process. This runs asynchronously
    */
    async run() {
        while (this.thread.isRunning()) {
            await this.step();
            await this.thread.sleep(this.timeout);
        }
    }
    /**
     * Move one step forward
    */
    async step() {
        const tick = await this.exchange.fetchTicker(this.symbol);
        this.series.append(tick);
        this.exchange.invalidate();
    }
    /**
     * Gets the length of the series
     *
     * @returns series length
    */
    length() {
        return this.series.length();
    }
    /**
     * Gets the tick at @idx
     *
     * @param idx index of tick to grab
     *
     * @returns tick
     */
    getAt(idx) {
        return this.series.getAt(idx);
    }
    /**
     * Gets the last tick
     *
     * @returns the last tick in the series
    */
    last() {
        return this.series.last();
    }
    kill() {
        this.thread.kill();
    }
    filename() {
        return `${this.symbol.replace("/", "-")}.${this.extension()}`;
    }
    subdir() {
        return types_1.Scenario.getInstance().id;
    }
    filepath() {
        return `./data/${this.exchange.name()}/${this.subdir()}/${this.filename()}`;
    }
    extension() {
        return 'ticker';
    }
    generateSerializer() {
        return new series_1.TickerSerializer();
    }
    seriesFromTicker() {
        return new series_1.Series(this.filepath(), this.generateSerializer());
    }
}
exports.Ticker = Ticker;
class CandleTicker extends Ticker {
    constructor(exchange, symbol, period = "1m") {
        super(exchange, symbol);
        this.period = period;
        this.timeout = types_1.Scenario.getInstance().mode == types_1.ScenarioMode.PLAYBACK ? 1 : 35000;
    }
    async step() {
        let last = this.last();
        let since = last ? last.timestamp : types_1.Scenario.getInstance().time;
        const tick = await this.exchange.fetchOHLCV(this.symbol, this.period, since);
        tick.forEach((candlestick) => {
            let csv = candlestick.join(",");
            this.series.appendFromCSV(csv, true);
            this.exchange.invalidate();
        });
        if (types_1.Scenario.getInstance().mode == types_1.ScenarioMode.RECORD)
            this.series.write();
    }
    extension() {
        return 'ohlcv';
    }
    generateSerializer() {
        return new series_1.CandleSerializer();
    }
}
exports.CandleTicker = CandleTicker;
class OrderTicker extends Ticker {
    constructor(exchange, order, portfolioID) {
        super(exchange, order.symbol);
        this.order = order;
        this.portfolioID = portfolioID;
        this.orderID = order.id;
    }
    async step() {
        const tick = await this.exchange.fetchOrder(this.orderID, this.symbol);
        if (this.hasChanged(tick)) {
            this.series.append(tick);
            this.order.status = tick.status;
            this.exchange.invalidate();
        }
    }
    hasChanged(tick) {
        let last = this.last();
        if (!last)
            return true;
        if (last.status != tick.status)
            return true;
        if (last.filled != tick.filled)
            return true;
        return false;
    }
    extension() {
        return 'order';
    }
    generateSerializer() {
        return new series_1.OrderSerializer();
    }
}
exports.OrderTicker = OrderTicker;
//# sourceMappingURL=ticker.js.map