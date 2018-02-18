"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_js_1 = require("bignumber.js");
function BN(x) {
    return new bignumber_js_1.BigNumber(x);
}
exports.BN = BN;
class BitfieldState {
    constructor() {
        this.state = 0;
        this.last = 0;
        this.completionMask = 0;
    }
    init(n) {
        return Array.from({ length: n }, () => this.add());
    }
    add(setOn = false, addToCompletionMask = true) {
        const mask = 1 << this.last;
        if (setOn)
            this.set(mask);
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
        return (this.state & this.completionMask) == this.completionMask;
    }
}
exports.BitfieldState = BitfieldState;
//# sourceMappingURL=types.js.map