import * as fs from "fs";
import { bnearest } from "../utils";
import { BacktestFileMissingError, InvalidCSVError } from "../errors/exchange-error";
import { OrderSide, OrderType } from "./order";
import { Scenario, ScenarioMode, Tick, ExchangeState, OHLCVTick, OHLCV, TickerTick, Ticker, OrderTick, Order } from "./types";

export class Serializer {

  protected properties(tick:Tick<ExchangeState>):any[] {
    return [tick.timestamp];
  }

  /**
   * Converts a JSON tick response to CSV for recording.
   * 
   * @param tick tick data to serialize to CSV format
   * 
   * @returns CSV string
   */
  public toCSV(tick:Tick<ExchangeState>):string {
    return this.properties(tick).join(",");
  }

  /**
   * Converts a CSV string to Tick hash
   * 
   * @param csv CSV string to convert to Tick
   * 
   * @returns Tick
   */
  public fromCSV(csv:string):Tick<ExchangeState> {
    return;
  }
}

export class TickerSerializer extends Serializer {
  protected properties(tick:Ticker):any[] {
    let state = tick.state;
    return [tick.timestamp,state.high,state.low,state.bid,state.ask];
  }
  /**
   * Converts a CSV string to TickerTick
   * 
   * @param csv CSV string to convert to Tick
   * 
   * @returns TickerTick
   */
  public fromCSV(csv:string):Ticker {
    let props:any = csv.split(",").map((x) => Number(x));
    if (props.length != 5) {
      throw new InvalidCSVError(csv, TickerSerializer);
    }
    let ticker:TickerTick = {
      symbol: "N/A",
      datetime: "N/A",
      timestamp: props[0],
      high: props[1],
      low: props[2],
      bid: props[3],
      ask: props[4],
      info: {}
    }
    return new Tick<TickerTick>(ticker);
  }
}

export class OHLCVSerializer extends Serializer {
  protected properties(tick:OHLCV):any[] {
    return tick.state;
  }

  /**
   * Converts a CSV string to OHLCVTick
   * 
   * @param csv CSV string to convert to Tick
   * 
   * @returns OHLCVTick
   */
  public fromCSV(csv:string):OHLCV {
    let ohlcv:any = csv.split(",").map((x) => Number(x));
    if (ohlcv.length != 6) {
      throw new InvalidCSVError(csv, OHLCVSerializer);
    }
    return new OHLCV(ohlcv);
  }
}

export class OrderSerializer extends Serializer {
  protected properties(tick:Order):any[] {
    let state = tick.state;
    return [tick.timestamp,state.id,state.status,state.symbol,state.type,state.side,state.price,state.cost,state.amount,state.filled,state.remaining,state.fee];
  }

  /**
   * Converts a CSV string to OHLCVTick
   * 
   * @param csv CSV string to convert to Tick
   * 
   * @returns OHLCVTick
   */
  public fromCSV(csv:string):Order {
    let props:any = csv.split(",");
    if (props.length != 12) {
      throw new InvalidCSVError(csv, OrderSerializer);
    }
    let order:OrderTick = {
      id: props[1],
      info: {},
      timestamp: Number(props[0]),
      datetime: "N/A",
      status: props[2],
      symbol: props[3],
      type: props[4],
      side: props[5],
      price: Number(props[6]),
      cost: Number(props[7]),
      amount: Number(props[8]),
      filled: Number(props[9]),
      remaining: Number(props[10]),
      fee: Number(props[11])
    }
    return new Order(order);
  }
}

type Point = Tick<ExchangeState>;

export class Series {
  private map:{ [idx:string]:boolean } = {};
  private list:Point[] = [];
  private lastWrite:number = 0;

  constructor(readonly filepath:string, readonly serializer:Serializer) {}

  /** 
   * Gets the current length of the series
  */
  public length():number {
    return this.list.length;
  }

  /** 
   * Grabs the last tick
   * 
   * @returns the last tick
  */
  public last():Point {
    return this.list[this.length()-1];
  }

  /**
   * Gets the tick at the given index
   * 
   * If the index is less than zero, it will offset the index from the end of the series
   * 
   * e.g. series.getAt(-1) returns the penultimate tick
   * 
   * @param idx index to get tick at
   */
  public getAt(idx:number):Point {
    if (idx < 0) {
      idx = this.length() + idx;
    }
    return this.list[idx];
  }

  /**
   * Appends a tick to the series
   * 
   * @param tick tick to add to series
   * @param lock whether to ignore autowrite regardless
   */
  public append(tick:Point, lock:boolean=false):void {
    if (!this.map[tick.key()]) {
      this.map[tick.key()] = true;
      this.list.push(tick);
      if (Scenario.getInstance().mode == ScenarioMode.RECORD && !lock) this.write();
    }
  }

  /**
   * Appends a tick in CSV format to the series
   * 
   * @param tick tick to add to series
   * @param lock whether to ignore autowrite regardless
   */
  public appendFromCSV(csv:string, lock:boolean=false):void {
    let tick:Point = this.serializer.fromCSV(csv);
    this.append(tick, lock);
  }

  /**
   * Transforms a list of Tick objects into an ordered list of given values.
   * This is useful for passing to indicator functions.
   * 
   * e.g. Assume series.list = [{x:1, y:2}, {x:3, y:5}].
   * then: series.transpose(['x', 'y']) returns [[1,3],[2,5]]
   * 
   * @param props properties to transpose
   * @param tail how much of the tail to grab. Defaults to entire list
   * 
   * @returns the requested values
   */
  public transpose(props:string[], tail:number=0):Number[][] {
    let transpose = new Map<string, number[]>();
    let series = this.list;
    if (series.length > tail) series = series.slice(-tail);
    // can't type tick here, props have to be right!
    series.forEach((tick:any) => {
      props.forEach((prop) => {
        if (!transpose.has(prop)) transpose.set(prop, []);
        transpose.get(prop).push(Number(tick[prop]));
      });
    });
    return Array.from(transpose.values());
  }

  /**
   * Finds the closest tick to the given timestamp
   * 
   * @param timestamp Timestamp to find closest tick to
   * 
   * @returns tuple of closest tick and that tick's index in the list
   */
  public nearest(timestamp:number):[Point, number] {
    return bnearest(this.list, timestamp, (x) => timestamp - x.timestamp);
  }

  /** 
   * Writes the series to disk by appending to file
  */
  public write():void {
    let str = "";
    let n = this.length() - 1;
    for (let i = this.lastWrite; i < n; i++) {
      str += this.serializer.toCSV(this.list[i]) + "\n";
    }
    if (str.length > 0) {
      fs.appendFile(this.filepath, str, (err:Error) => {
        if (err) throw err;
        this.lastWrite = n;
      });
    }
  }

  /** 
   * Reads series from file--this only applies to mocking
  */
  public read():void {
    if (fs.existsSync(this.filepath)) {
      let file = fs.readFileSync(this.filepath, "utf8");
      file.split("\n").forEach((line:string) => {
        if (line.length > 0) {
          this.append(this.serializer.fromCSV(line));
        }
      });
    } else {
      throw new BacktestFileMissingError(this.filepath);
    }
  }
}