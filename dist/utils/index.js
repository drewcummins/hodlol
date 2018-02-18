"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;
;
function bnearest(list, value, compare, state = undefined) {
    if (state == undefined) {
        state = { min: 0,
            max: list.length - 1,
            nearest: null,
            nearIdx: -1,
            nearDist: Number.MAX_VALUE };
    }
    const mid = state.min + ((state.max - state.min) >> 1);
    const candidate = list[mid];
    const diff = compare(candidate);
    if (diff == 0)
        return [candidate, mid];
    if (Math.abs(diff) < state.nearDist) {
        state.nearDist = Math.abs(diff);
        state.nearest = candidate;
        state.nearIdx = mid;
    }
    if (state.min == state.max) {
        // list of length 1
        return [state.nearest, state.nearIdx];
    }
    if (diff > 0)
        state.min = Math.min(mid + 1, state.max);
    else
        state.max = Math.max(mid - 1, state.min);
    return bnearest(list, value, compare, state);
}
exports.bnearest = bnearest;
//# sourceMappingURL=index.js.map