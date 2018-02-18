"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const utils_1 = require("../utils");
class Serializer {
    constructor(props) {
        this.props = props;
    }
    /**
     * Converts a JSON tick response to CSV for recording.
     *
     * @param tick tick data to serialize to CSV format
     *
     * @returns CSV string
     */
    toCSV(tick) {
        return this.props.map((prop) => tick[prop]).join(",");
    }
    /**
     * Converts a CSV string to Tick hash
     *
     * @param csv CSV string to convert to Tick
     *
     * @returns Tick
     */
    fromCSV(csv) {
        let tick = { timestamp: 0 };
        csv.split(",").forEach((value, i) => {
            tick[this.props[i]] = this.cast(value);
        });
        return tick;
    }
    /**
     * Provides the unique key for the given Tick
     *
     * @param tick Tick
     *
     * @returns key
     */
    key(tick) {
        return tick.timestamp.toString();
    }
    cast(value) {
        return value;
    }
}
exports.Serializer = Serializer;
class TickerSerializer extends Serializer {
    constructor() {
        super(["timestamp", "high", "low", "bid", "bidVolume", "ask", "askVolume", "vwap", "open", "close", "last", "change", "baseVolume", "quoteVolume"]);
    }
}
exports.TickerSerializer = TickerSerializer;
class CandleSerializer extends Serializer {
    constructor() {
        super(["timestamp", "open", "high", "low", "close", "volume"]);
    }
    /**
     * Wraps tick in CCXT format
     *
     * @param tick tick data to wrap in the format CCXT gives back when querying ohlcv
     */
    toCCXT(tick) {
        return [this.toCSV(tick).split(",")];
    }
    cast(value) {
        // all candlestick data are numbers
        return Number(value);
    }
}
exports.CandleSerializer = CandleSerializer;
class OrderSerializer extends Serializer {
    constructor() {
        super(["id", "timestamp", "status", "symbol", "type", "side", "price", "amount", "filled", "remaining"]);
    }
    /**
     * Provides the unique key for the given order tick
     *
     * @param tick Tick
     *
     * @returns unique key as a function of creation timestamp and order status
     */
    key(tick) {
        return `${tick["timestamp"]}${tick["status"]}`;
    }
}
exports.OrderSerializer = OrderSerializer;
class Series {
    constructor(filepath, serializer, autowrite = false) {
        this.filepath = filepath;
        this.serializer = serializer;
        this.autowrite = autowrite;
        this.map = {};
        this.list = [];
        this.lastWrite = 0;
    }
    /**
     * Gets the current length of the series
    */
    length() {
        return this.list.length;
    }
    /**
     * Grabs the last tick
     *
     * @returns the last tick
    */
    last() {
        return this.list[this.length() - 1];
    }
    /**
     * Gets the tick at the given index
     *
     * If the index is less than zero, it will offset the index from the end of the series
     *
     * e.g. series.getAt(-1) returns the penultimate tick
     *
     * @param idx index to get tick at
     */
    getAt(idx) {
        if (idx < 0) {
            idx = this.length() + idx;
        }
        return this.list[idx];
    }
    /**
     * Appends a tick to the series
     *
     * @param tick tick to add to series
     * @param lock whether to ignore autowrite regardless
     */
    append(tick, lock = false) {
        let key = this.serializer.key(tick);
        if (!this.map[key]) {
            this.map[key] = true;
            this.list.push(tick);
            if (this.autowrite && !lock)
                this.write();
        }
    }
    /**
     * Appends a tick in CSV format to the series
     *
     * @param tick tick to add to series
     * @param lock whether to ignore autowrite regardless
     */
    appendFromCSV(csv, lock = false) {
        let tick = this.serializer.fromCSV(csv);
        this.append(tick, lock);
    }
    /**
     * Transforms a list of Tick objects into an ordered list of given values.
     * This is useful for passing to indicator functions.
     *
     * e.g. Assume series.list = [{x:1, y:2}, {x:3, y:5}].
     * then: series.transpose(['x', 'y']) returns [[1,3],[2,5]]
     *
     * @param props properties to transpose
     * @param tail how much of the tail to grab. Defaults to entire list
     *
     * @returns the requested values
     */
    transpose(props, tail = 0) {
        let transpose = new Map();
        let series = this.list;
        if (series.length > tail)
            series = series.slice(-tail);
        series.forEach((tick) => {
            props.forEach((prop) => {
                if (!transpose.has(prop))
                    transpose.set(prop, []);
                transpose.get(prop).push(Number(tick[prop]));
            });
        });
        return Array.from(transpose.values());
    }
    /**
     * Finds the closest tick to the given timestamp
     *
     * @param timestamp Timestamp to find closest tick to
     *
     * @returns tuple of closest tick and that tick's index in the list
     */
    nearest(timestamp) {
        return utils_1.bnearest(this.list, timestamp, (x) => timestamp - x.timestamp);
    }
    /**
     * Writes the series to disk by appending to file
    */
    write() {
        let str = "";
        let n = this.length() - 1;
        for (let i = this.lastWrite; i < n; i++) {
            str += this.serializer.toCSV(this.list[i]) + "\n";
        }
        if (str.length > 0) {
            fs.appendFile(this.filepath, str, (err) => {
                if (err)
                    throw err;
                this.lastWrite = n;
            });
        }
    }
    /**
     * Reads series from file
    */
    read() {
        if (fs.existsSync(this.filepath)) {
            let file = fs.readFileSync(this.filepath, "utf8");
            file.split("\n").forEach((line) => {
                if (line.length > 0) {
                    this.append(this.serializer.fromCSV(line));
                }
            });
        }
    }
}
exports.Series = Series;
//# sourceMappingURL=series.js.map