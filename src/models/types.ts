import { BigNumber } from "bignumber.js"
import { OrderRequest, Order } from "./order";
import * as fs from "fs";
import { ScenarioFileMissingError } from "../errors/exchange-error";
import { Balances } from "ccxt";

BigNumber.config({ DECIMAL_PLACES:5 });

export function BN(x: Num):BigNumber {
  return new BigNumber(x.toString());
}

export type ID = string;

export type Num = BigNumber | number | string;

export type HashMap<T> = Map<string, T>;

export interface Balance {
  free: Num;
  reserved: Num;
}

export type Value = { [key:string]:Balance };
// (request.market, request.amount, request.price);
export interface API {
  readonly name:string;
  loadMarkets():Promise<any>;
  fetchTicker(pair:string):Promise<any>;
  fetchOHLCV(symbol:string, period:string, since:number|undefined):Promise<any>;
  createLimitBuyOrder(market:string, amount:Num, price:Num):Promise<Order>;
  createLimitSellOrder(market:string, amount:Num, price:Num):Promise<Order>;
  fetchOrders(symbol:string, since:number, limit:number):Promise<any>;
  fetchOrder(orderID:string, symbol:string):Promise<any>;
  fetchBalance():Promise<any>;
}

export type BitState = number;

export class BitfieldState {
  private state:number = 0;
  private last:number = 0;
  private completionMask:number=0;

  public init(n:number):number[] {
    return Array.from({length:n}, () => this.add(true));
  }
  
  public add(addToCompletionMask:boolean=false):number {
    const mask:number = 1 << this.last;
    if (addToCompletionMask) this.completionMask |= mask;
    this.last++;
    return mask;
  }

  public createMaskFromSet(bitstates:BitState[]):BitState {
    return bitstates.reduce((mem, state) => mem | state, 0);
  }

  public set(mask:number):void {
    this.state |= mask;
  }

  public kill(mask:number):void {
    this.state &= ~mask;
  }

  public isSet(mask:number):boolean {
    return (this.state & mask) == mask;
  }

  public isComplete():boolean {
    return this.isSet(this.completionMask);
  }
}

export interface IScenario {
  id: ID,
  start: number,
  end: number
}

export enum ScenarioMode {
  PLAYBACK,
  RECORD
}

export class Scenario implements IScenario {
  readonly id:ID;
  readonly start:number;
  readonly end:number;

  public time:number;
  public mode:ScenarioMode;

  private static instance:Scenario = null;

  private constructor(file:string | IScenario) {
    let json:IScenario = null;
    if (typeof file === "string") {
      if (fs.existsSync(file as string)) {
        json = JSON.parse(fs.readFileSync(file as string, 'utf8'));
        this.mode = ScenarioMode.PLAYBACK;
      } else {
        throw new ScenarioFileMissingError(file as string);
      }
    } else {
      json = file as IScenario;
      this.mode = ScenarioMode.RECORD;
    }
    this.id = json.id;
    this.start = Number(json.start);
    this.end = Number(json.end);

    this.time = this.start;
  }

  public static getInstance():Scenario {
    return Scenario.instance;
  }

  public static create(filepath:string):void {
    if (!Scenario.instance) {
      Scenario.instance = new Scenario(filepath);
    }
  }

  public static createWithName(name:string, start:number, end:number):void {
    if (!Scenario.instance) {
      Scenario.instance = new Scenario({id:name, start:start, end:end});
    }
  }

  public static kill():void {
    Scenario.instance = null;
  }
}