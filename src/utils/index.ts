import { ID } from "../models/types";

const uuid = require('uuid/v4');
const dateFormat = require('dateformat');

export function sleep(ms:number):Promise<NodeJS.Timer> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export type Compare = (candidate:any) => number;
export interface IState {
  min:number,
  max:number,
  nearest:any,
  nearIdx:number,
  nearDist:number
};
export type State = IState | undefined;

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

export function formatTimestamp(time:number) {
  return dateFormat(time, "mmmm-d-yyyy-h:MM:ss-TT");
}

export class Thread {
  private static threads:Map<ID,Thread> = new Map<ID,Thread>();
  private running:boolean=true;
  private id:ID;
  private cycles:number = 0;
  constructor() {
    this.id = uuid();
    Thread.threads.set(this.id, this);
  }
  public async sleep(time:number) {
    let next:number = +new Date() + time;
    while (this.running && +new Date() < next) {
      await sleep(1);
      this.cycles++;
    }
  }
  public hasCycled(period:number):boolean {
    return this.cycles % period == 0;
  }
  public async kill() {
    this.running = false;
    await sleep(1);
    Thread.threads.delete(this.id);
  }
  public isRunning() {
    return this.running;
  }
  public static killAll() {
    Thread.threads.forEach((thread) => thread.kill());
  }
}