"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_js_1 = require("bignumber.js");
const fs = require("fs");
const errors_1 = require("../errors");
bignumber_js_1.BigNumber.config({ DECIMAL_PLACES: 15, ROUNDING_MODE: bignumber_js_1.BigNumber.ROUND_DOWN });
function BN(x) {
    return new bignumber_js_1.BigNumber(x.toString());
}
exports.BN = BN;
function BNF(x) {
    return BN(BN(x).toFixed(6));
}
exports.BNF = BNF;
class Tick {
    constructor(state) {
        this.state = state;
        // most of what we generically do with a tick is just referencing timestamp
        this.timestamp = state.timestamp;
    }
    /**
     * Provides the unique key for this tick
     *
     * @returns unique key
     */
    key() {
        return this.timestamp.toString();
    }
}
exports.Tick = Tick;
class OHLCV extends Tick {
    constructor(state) {
        super(state);
        [, this.open, this.high, this.low, this.close, this.volume] = state;
    }
}
exports.OHLCV = OHLCV;
class Order extends Tick {
    key() {
        return this.state.status + super.key();
    }
}
exports.Order = Order;
class BitfieldState {
    constructor() {
        this.state = 0;
        this.last = 0;
        this.completionMask = 0;
    }
    init(n) {
        return Array.from({ length: n }, () => this.add(true));
    }
    add(addToCompletionMask = false) {
        const mask = 1 << this.last;
        if (addToCompletionMask)
            this.completionMask |= mask;
        this.last++;
        return mask;
    }
    createMaskFromSet(bitstates) {
        return bitstates.reduce((mem, state) => mem | state, 0);
    }
    set(mask) {
        this.state |= mask;
    }
    kill(mask) {
        this.state &= ~mask;
    }
    isSet(mask) {
        return (this.state & mask) == mask;
    }
    isComplete() {
        return this.isSet(this.completionMask);
    }
}
exports.BitfieldState = BitfieldState;
var ScenarioMode;
(function (ScenarioMode) {
    ScenarioMode["PLAYBACK"] = "playback";
    ScenarioMode["RECORD"] = "record";
})(ScenarioMode = exports.ScenarioMode || (exports.ScenarioMode = {}));
class Scenario {
    constructor(file) {
        let json = null;
        if (typeof file === "string") {
            if (fs.existsSync(file)) {
                json = JSON.parse(fs.readFileSync(file, 'utf8'));
                this.mode = ScenarioMode.PLAYBACK;
            }
            else {
                throw new errors_1.ScenarioFileMissingError(file);
            }
        }
        else {
            json = file;
            this.mode = ScenarioMode.RECORD;
        }
        this.id = json.id;
        this.start = Number(json.start);
        this.end = Number(json.end);
        if (!json.record) {
            this.record = this.mode == ScenarioMode.RECORD;
        }
        else {
            this.record = json.record;
        }
        this.test = json.test === true;
        this.time = this.start;
    }
    dataDir() {
        return this.test ? "test/data" : "data";
    }
    static getInstance() {
        return Scenario.instance;
    }
    static create(filepath) {
        if (!Scenario.instance) {
            Scenario.instance = new Scenario(filepath);
        }
    }
    static createWithName(name, start, end, record = true, test = false) {
        if (!Scenario.instance) {
            Scenario.instance = new Scenario({ id: name, start: start, end: end, record: record, test: test });
        }
    }
    static shouldWrite() {
        return Scenario.getInstance().record;
    }
    static kill() {
        Scenario.instance = null;
    }
}
Scenario.instance = null;
exports.Scenario = Scenario;
//# sourceMappingURL=types.js.map