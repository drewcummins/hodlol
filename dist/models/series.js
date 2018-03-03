"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const utils_1 = require("../utils");
const exchange_error_1 = require("../errors/exchange-error");
const types_1 = require("./types");
class Serializer {
    properties(tick) {
        return [tick.timestamp];
    }
    /**
     * Converts a JSON tick response to CSV for recording.
     *
     * @param tick tick data to serialize to CSV format
     *
     * @returns CSV string
     */
    toCSV(tick) {
        return this.properties(tick).join(",");
    }
    /**
     * Converts a CSV string to Tick hash
     *
     * @param csv CSV string to convert to Tick
     *
     * @returns Tick
     */
    fromCSV(csv) {
        return;
    }
}
exports.Serializer = Serializer;
class TickerSerializer extends Serializer {
    properties(tick) {
        let state = tick.state;
        return [tick.timestamp, state.high, state.low, state.bid, state.ask];
    }
    /**
     * Converts a CSV string to TickerTick
     *
     * @param csv CSV string to convert to Tick
     *
     * @returns TickerTick
     */
    fromCSV(csv) {
        let props = csv.split(",").map((x) => Number(x));
        if (props.length != 5) {
            throw new exchange_error_1.InvalidCSVError(csv, TickerSerializer);
        }
        let ticker = {
            symbol: "N/A",
            datetime: "N/A",
            timestamp: props[0],
            high: props[1],
            low: props[2],
            bid: props[3],
            ask: props[4],
            info: {}
        };
        return new types_1.Tick(ticker);
    }
}
exports.TickerSerializer = TickerSerializer;
class OHLCVSerializer extends Serializer {
    properties(tick) {
        return tick.state;
    }
    /**
     * Converts a CSV string to OHLCVTick
     *
     * @param csv CSV string to convert to Tick
     *
     * @returns OHLCVTick
     */
    fromCSV(csv) {
        let ohlcv = csv.split(",").map((x) => Number(x));
        if (ohlcv.length != 6) {
            throw new exchange_error_1.InvalidCSVError(csv, OHLCVSerializer);
        }
        return new types_1.OHLCV(ohlcv);
    }
}
exports.OHLCVSerializer = OHLCVSerializer;
class OrderSerializer extends Serializer {
    properties(tick) {
        let state = tick.state;
        return [tick.timestamp, state.id, state.status, state.symbol, state.type, state.side, state.price, state.cost, state.amount, state.filled, state.remaining, state.fee];
    }
    /**
     * Converts a CSV string to OHLCVTick
     *
     * @param csv CSV string to convert to Tick
     *
     * @returns OHLCVTick
     */
    fromCSV(csv) {
        let props = csv.split(",");
        if (props.length != 12) {
            throw new exchange_error_1.InvalidCSVError(csv, OrderSerializer);
        }
        let order = {
            id: props[1],
            info: {},
            timestamp: Number(props[0]),
            datetime: "N/A",
            status: props[2],
            symbol: props[3],
            type: props[4],
            side: props[5],
            price: Number(props[6]),
            cost: Number(props[7]),
            amount: Number(props[8]),
            filled: Number(props[9]),
            remaining: Number(props[10]),
            fee: Number(props[11])
        };
        return new types_1.Order(order);
    }
}
exports.OrderSerializer = OrderSerializer;
class Series {
    constructor(filepath, serializer) {
        this.filepath = filepath;
        this.serializer = serializer;
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
        if (!this.map[tick.key()]) {
            this.map[tick.key()] = true;
            this.list.push(tick);
            if (types_1.Scenario.getInstance().mode == types_1.ScenarioMode.RECORD && !lock)
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
        // can't type tick here, props have to be right!
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
     * Reads series from file--this only applies to mocking
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
        else {
            throw new exchange_error_1.BacktestFileMissingError(this.filepath);
        }
    }
}
exports.Series = Series;
//# sourceMappingURL=series.js.map