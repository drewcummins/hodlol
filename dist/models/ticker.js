"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const series_1 = require("./series");
const utils_1 = require("../utils");
class Ticker {
    constructor(exchange, symbol, record = false, timeout = 5000) {
        this.exchange = exchange;
        this.symbol = symbol;
        this.record = record;
        this.timeout = timeout;
        this.kill = false;
        this.series = new series_1.Series(this.filepath(), this.generateSerializer(), record);
    }
    /**
     * Tells the series to get reading
    */
    async read() {
        return this.series.read();
    }
    /**
     * Kicks off the ticker process. This runs asynchronously
    */
    async run() {
        while (true) {
            if (this.kill)
                break;
            await this.step();
            await this.sleep();
        }
    }
    async step() {
        const tick = await this.exchange.fetchTicker(this.symbol);
        this.series.append(tick);
        this.exchange.invalidate();
    }
    async sleep() {
        await utils_1.sleep(this.timeout);
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
    filename() {
        return `${this.symbol.replace("/", "-")}.${this.extension()}`;
    }
    subdir() {
        return ""; //`${config.dateID}`
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
}
exports.Ticker = Ticker;
class CandleTicker extends Ticker {
    constructor(exchange, symbol, record = false, timeout = 35000, period = "1m") {
        super(exchange, symbol, record, timeout);
        this.period = period;
    }
    async step() {
        let last = this.last();
        let since = last ? last.timestamp : this.exchange.time;
        const tick = await this.exchange.fetchOHLCV(this.symbol, this.period, since);
        tick.forEach((candlestick) => {
            let csv = candlestick.join(",");
            this.series.appendFromCSV(csv, true);
            this.exchange.invalidate();
        });
        if (this.series.autowrite)
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
    constructor(exchange, order, record = false, timeout = 5000) {
        super(exchange, order.symbol, record, timeout);
        this.order = order;
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