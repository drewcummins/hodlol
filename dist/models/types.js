"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_js_1 = require("bignumber.js");
const fs = require("fs");
const exchange_error_1 = require("../errors/exchange-error");
bignumber_js_1.BigNumber.config({ DECIMAL_PLACES: 5 });
function BN(x) {
    return new bignumber_js_1.BigNumber(x.toString());
}
exports.BN = BN;
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
    ScenarioMode[ScenarioMode["PLAYBACK"] = 0] = "PLAYBACK";
    ScenarioMode[ScenarioMode["RECORD"] = 1] = "RECORD";
})(ScenarioMode = exports.ScenarioMode || (exports.ScenarioMode = {}));
class Scenario {
    constructor(filepath) {
        let json = null;
        if (typeof filepath === "string") {
            if (fs.existsSync(filepath)) {
                json = JSON.parse(fs.readFileSync(filepath, 'utf8'));
                this.mode = ScenarioMode.PLAYBACK;
            }
            else {
                throw new exchange_error_1.ScenarioFileMissingError(filepath);
            }
        }
        else {
            json = filepath;
            this.mode = ScenarioMode.RECORD;
        }
        this.id = json.id;
        this.start = Number(json.start);
        this.end = Number(json.end);
        this.time = this.start;
    }
    static getInstance() {
        return Scenario.instance;
    }
    static create(filepath) {
        if (!Scenario.instance) {
            Scenario.instance = new Scenario(filepath);
        }
    }
    static createWithName(name, start, end) {
        if (!Scenario.instance) {
            Scenario.instance = new Scenario({ id: name, start: start, end: end });
        }
    }
    static kill() {
        Scenario.instance = null;
    }
}
Scenario.instance = null;
exports.Scenario = Scenario;
//# sourceMappingURL=types.js.map