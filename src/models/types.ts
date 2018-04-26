import { BigNumber } from "bignumber.js"
import { OrderRequest } from "./order";
import * as fs from "fs";
import * as mkdirp from "mkdirp";
import { ScenarioFileMissingError } from "../errors";
import * as ccxt from "ccxt";
import { LoggerApi } from "../utils/logger";
const chrono =  require("chrono-node");

const logger = new LoggerApi();

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

/**
 * Turns a Balance into human readable set of strings
 * that can be logged easily
 */
export class ReadableBalance implements Balance, IHumanReadable {
  private innerBalance: Balance;
  public free : string;
  public reserved : string;
  constructor(balance: Balance){
      this.innerBalance = balance;
      this.free = this.format(this.innerBalance.free);
      this.reserved = this.format(this.innerBalance.reserved);
  }

  format(value:Num):string{
      return BN(value).toFormat(2);
  }

  readable():any{
    this.free = this.format(this.innerBalance.free);
    this.reserved = this.format(this.innerBalance.reserved);
    return {
        free: this.free,
        reserved: this.reserved
    }
  }
}

export type Value = { [key:string]:Balance };

export interface API {
  readonly name:string;
  loadMarkets():Promise<any>;
  fetchTicker(pair:string):Promise<TickerTick>;
  fetchOHLCV(symbol:string, period:string, since:number|undefined):Promise<OHLCVTick[]>;
  createLimitBuyOrder(market:string, amount:Num, price:Num):Promise<OrderTick>;
  createLimitSellOrder(market:string, amount:Num, price:Num):Promise<OrderTick>;
  createMarketBuyOrder(market:string, amount:Num, price:Num):Promise<OrderTick>;
  createMarketSellOrder(market:string, amount:Num, price:Num):Promise<OrderTick>;
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
export type TTicker = Tick<TickerTick>;
export class OHLCV extends Tick<OHLCVTick> implements IHumanReadable{
  readonly open:number; 
  readonly high:number;
  readonly low:number;
  readonly close:number;
  readonly volume:number;
  constructor(state:OHLCVTick) {
    super(state);
    [,this.open,this.high,this.low,this.close,this.volume] = state;
  }
  readable(){
      return {
          open: this.open,
          high: this.high,
          low: this.low,
          close: this.close,
          volume: this.volume
      }
  }
}

export class Order extends Tick<OrderTick> {
    public key():string {
        return this.state.status + super.key();
    }
}

export type SeriesElement = Order | OHLCV | TTicker | Trade | OrderBook;
export type Element = SeriesElement; // shorthand

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
    start: number | string,
    end: number | string,
  record?: boolean,
  test?: boolean
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
  readonly test:boolean;

  public time:number;
  public mode:ScenarioMode;

  private static instance:Scenario = null;

  private constructor(file:string | IScenario) {
    let json:IScenario = null;
    if (typeof file === "string") {
      logger.info("constructing Scenario from:" + file);
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
        const [start, end]:number[] = this.tryParseStartEnd(json);
        this.start = start;
        this.end = end;

    if (!json.record) {
      this.record = this.mode == ScenarioMode.RECORD;
    } else {
      this.record = json.record;
    }

    this.test = json.test === true;

    this.time = this.start;
  }

    public tryParseStartEnd(json:IScenario): number[]{
        let start:any = Number(json.start);
        let end:any = Number(json.end);
        //non numbers will fail out as nan
        if (isNaN(start)){
            start = this.tryParseDateString(json.start);
        }

        if (isNaN(end)){
            end = this.tryParseDateString(json.end);
        }

        logger.info("Scenario running: ", start, " to ", end);

        return [start, end];
    }

    public tryParseDateString(input:number | string):number {
        let startDate:Date = chrono.parseDate(input);
        if (startDate === null){
            logger.fatal("Bailing out, couldn't interpret scenario file start time", "start:", input);
        }
        else {
            return startDate.getTime();
        }
    }

  public dataDir():string {
    return this.test ? "test/data" : "data";
  }

  public static getInstance():Scenario {
    return Scenario.instance;
  }

  public static create(filepath:string):void {
    if (!Scenario.instance) {
      Scenario.instance = new Scenario(filepath);
    }
  }

  public static createWithName(name:string, start:number, end:number, record:boolean=true, test:boolean=false):void {
    if (!Scenario.instance) {
      Scenario.instance = new Scenario({id:name, start:start, end:end, record:record, test:test});
    }
  }

    public static createWithObject(json:IScenario, force:boolean):void {
        if (!Scenario.instance || force) {
            Scenario.instance = new Scenario(json);
        }
    }

  public static shouldWrite() {
    return Scenario.getInstance().record;
  }

  public static kill():void {
    Scenario.instance = null;
  }
}

/**
 * Contract to expose a plain old object form
 * of yourself that is easily readable in serialized
 * form. Useful for sticking a readable summary into the
 * logger and events
 */
export interface IHumanReadable {
  readable(): any
}