"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require('uuid/v4');
const dateFormat = require('dateformat');
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
function formatTimestamp(time) {
    return dateFormat(time, "mmmm-d-yyyy-h:MM:ss-TT");
}
exports.formatTimestamp = formatTimestamp;
async function load(filepath, rootdir, relativepath) {
    var file;
    try {
        file = await Promise.resolve().then(() => require(`${relativepath}/${filepath}`));
    }
    catch (err) {
        try {
            file = await Promise.resolve().then(() => require(`${rootdir}/${filepath}`));
        }
        catch (err) {
            file = await Promise.resolve().then(() => require(filepath));
        }
    }
    return file;
}
exports.load = load;
class Thread {
    constructor() {
        this.running = true;
        this.cycles = 0;
        this.id = uuid();
        Thread.threads.set(this.id, this);
    }
    async sleep(time) {
        let next = +new Date() + time;
        while (this.running && +new Date() < next) {
            await sleep(1);
            this.cycles++;
        }
    }
    hasCycled(period) {
        return this.cycles % period == 0;
    }
    async kill() {
        this.running = false;
        await sleep(1);
        Thread.threads.delete(this.id);
    }
    isRunning() {
        return this.running;
    }
    static killAll() {
        Thread.threads.forEach((thread) => thread.kill());
    }
}
Thread.threads = new Map();
exports.Thread = Thread;
//# sourceMappingURL=index.js.map