'use strict';

const bnearest = (list, value, compare, state=undefined) => {
  if (state == undefined) {
    state = { min:0,
              max:list.length-1,
              nearest:null,
              nearDist:Number.MAX_VALUE};
  }
  const mid = state.min + ((state.max - state.min) >> 1);
  // console.log(state.min, mid, state.max, list.length);
  const candidate = list[mid];
  const diff = compare(candidate);
  if (diff == 0) return candidate;
  if (Math.abs(diff) < state.nearDist) {
    state.nearDist = Math.abs(diff);
    state.nearest = candidate;
  }
  if (state.min == state.max) {
    // list of length 1
    return state.nearest;
  }
  if (diff > 0) state.min = Math.min(mid + 1, state.max);
  else state.max = Math.max(mid - 1, state.min);
  return bnearest(list, value, compare, state);
}

module.exports.bnearest = bnearest;
