
export function sleep(ms:number):Promise<NodeJS.Timer> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

type Compare = (candidate:any) => number;
interface IState {
  min:number,
  max:number,
  nearest:any,
  nearIdx:number,
  nearDist:number
};
type State = IState | undefined;

export function bnearest(list:Array<any>, value:number, compare:Compare, state:State=undefined):[any, number] {
  if (state == undefined) {
    state = { min:0,
              max:list.length-1,
              nearest:null,
              nearIdx:-1,
              nearDist:Number.MAX_VALUE};
  }
  const mid:number = state.min + ((state.max - state.min) >> 1);
  const candidate:any = list[mid];
  const diff:number = compare(candidate);
  if (diff == 0) return [candidate, mid];
  if (Math.abs(diff) < state.nearDist) {
    state.nearDist = Math.abs(diff);
    state.nearest = candidate;
    state.nearIdx = mid;
  }
  if (state.min == state.max) {
    // list of length 1
    return [state.nearest, state.nearIdx];
  }
  if (diff > 0) state.min = Math.min(mid + 1, state.max);
  else state.max = Math.max(mid - 1, state.min);
  return bnearest(list, value, compare, state);
}