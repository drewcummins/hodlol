import { BigNumber } from "bignumber.js"
import { OrderRequest } from "./order";
import * as fs from "fs";
import * as mkdirp from "mkdirp";
import { ScenarioFileMissingError } from "../errors";
import * as ccxt from "ccxt";

BigNumber.config({ DECIMAL_PLACES:15, ROUNDING_MODE:BigNumber.ROUND_DOWN });

export function BN(x:Num):BigNumber {
  return new BigNumber(x.toString());
}

export function BNF(x:Num):BigNumber {
  return BN(BN(x).toFixed(6));
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
  fetchTicker(pair:string):Promise<TickerTick>;
  fetchOHLCV(symbol:string, period:string, since:number|undefined):Promise<OHLCVTick[]>;
  createLimitBuyOrder(market:string, amount:Num, price:Num):Promise<OrderTick>;
  createLimitSellOrder(market:string, amount:Num, price:Num):Promise<OrderTick>;
  fetchOrders(symbol:string, since:number, limit:number):Promise<OrderTick[]>;
  fetchOrder(orderID:ID, symbol:string):Promise<OrderTick>;
  fetchBalance():Promise<any>;
  cancelOrder(orderID:ID, symbol:string):Promise<any>;
}


export type OrderTick = ccxt.Order;
export type OrderBookTick = ccxt.OrderBook;
export type TradeTick = ccxt.Trade;
export type TickerTick = ccxt.Ticker;
export type OHLCVTick = ccxt.OHLCV & { timestamp:number };
export type ExchangeState = OHLCVTick | OrderTick | OrderBookTick | TradeTick | TickerTick;

export class Tick<T extends ExchangeState> {
  readonly timestamp:number;
  constructor(readonly state:T) {
    // most of what we generically do with a tick is just referencing timestamp
    this.timestamp = state.timestamp;
  }

  /**
   * Provides the unique key for this tick
   * 
   * @returns unique key
   */
  public key():string {
    return this.timestamp.toString();
  }
}

export type OrderBook = Tick<OrderBookTick>;
export type Trade = Tick<TradeTick>;
export type Ticker = Tick<TickerTick>;
export class OHLCV extends Tick<OHLCVTick> {
  readonly open:number; 
  readonly high:number;
  readonly low:number;
  readonly close:number;
  readonly volume:number;
  constructor(state:OHLCVTick) {
    super(state);
    [,this.open,this.high,this.low,this.close,this.volume] = state;
  }
}

export class Order extends Tick<OrderTick> {
  public key():string {
    return this.state.status + super.key();
  }
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
  end: number,
  record?: boolean
}

export enum ScenarioMode {
  PLAYBACK="playback",
  RECORD="record"
}

export class Scenario implements IScenario {
  readonly id:ID;
  readonly start:number;
  readonly end:number;
  readonly record:boolean;

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

    if (!json.record) {
      this.record = this.mode == ScenarioMode.RECORD;
    } else {
      this.record = json.record;
    }

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

  public static createWithName(name:string, start:number, end:number, record:boolean=true):void {
    if (!Scenario.instance) {
      Scenario.instance = new Scenario({id:name, start:start, end:end, record:record});
    }
  }

  public static shouldWrite() {
    return Scenario.getInstance().record;
  }

  public static kill():void {
    Scenario.instance = null;
  }
}