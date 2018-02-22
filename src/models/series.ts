import * as fs from "fs";
import { bnearest } from "../utils";

type TickProp = { [property:string]:number | string } | undefined;
interface ITick {
  timestamp:number;
}
export type Tick = TickProp & ITick; //{ [property:string]:number | string } | undefined;

export class Serializer {
  protected props:string[];
  constructor(props:string[]) {
    this.props = props;
  }

  /**
   * Converts a JSON tick response to CSV for recording.
   * 
   * @param tick tick data to serialize to CSV format
   * 
   * @returns CSV string
   */
  public toCSV(tick:Tick):string {
    return this.props.map((prop) => tick[prop]).join(",");
  }

  /**
   * Converts a CSV string to Tick hash
   * 
   * @param csv CSV string to convert to Tick
   * 
   * @returns Tick
   */
  public fromCSV(csv:string):Tick {
    let tick:Tick = {timestamp:0};
    csv.split(",").forEach((value:number | string, i:number) => {
      tick[this.props[i]] = this.cast(value);
    })
    return tick;
  }

  /**
   * Provides the unique key for the given Tick
   * 
   * @param tick Tick
   * 
   * @returns key
   */
  public key(tick:Tick):string {
    return tick.timestamp.toString();
  }

  protected cast(value:number | string):number | string {
    return value;
  }
}

export class TickerSerializer extends Serializer {
  constructor() {
    super(["timestamp", "high", "low", "bid", "bidVolume", "ask","askVolume", "vwap", "open", "close", "last", "change","baseVolume", "quoteVolume"])
  }
}

export class CandleSerializer extends Serializer {
  constructor() {
    super(["timestamp", "open", "high", "low", "close", "volume"]);
  }

  /**
   * Wraps tick in CCXT format
   * 
   * @param tick tick data to wrap in the format CCXT gives back when querying ohlcv
   */
  public toCCXT(tick:Tick):string[][] {
    return [this.toCSV(tick).split(",")];
  }

  protected cast(value:number | string):number | string {
    // all candlestick data are numbers
    return Number(value);
  }
}

export class OrderSerializer extends Serializer {
  constructor() {
    super(["id", "timestamp", "status", "symbol", "type", "side", "price", "amount", "filled", "remaining"]);
  }

  /**
   * Provides the unique key for the given order tick
   * 
   * @param tick Tick
   * 
   * @returns unique key as a function of creation timestamp and order status
   */
  public key(tick:Tick):string {
    return `${tick["timestamp"]}${tick["status"]}`;
  }
}

export class Series {
  private map:{ [idx:string]:boolean } = {};
  private list:Tick[] = [];
  private lastWrite:number = 0;

  constructor(readonly filepath:string, readonly serializer:Serializer, readonly autowrite:boolean=false) {}

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
  public last():Tick {
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
  public getAt(idx:number):Tick {
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
  public append(tick:Tick, lock:boolean=false):void {
    let key:string = this.serializer.key(tick);
    if (!this.map[key]) {
      this.map[key] = true;
      this.list.push(tick);
      if (this.autowrite && !lock) this.write();
    }
  }

  /**
   * Appends a tick in CSV format to the series
   * 
   * @param tick tick to add to series
   * @param lock whether to ignore autowrite regardless
   */
  public appendFromCSV(csv:string, lock:boolean=false):void {
    let tick:Tick = this.serializer.fromCSV(csv);
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
    series.forEach((tick:Tick) => {
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
  public nearest(timestamp:number):[Tick, number] {
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
   * Reads series from file
  */
  public read():void {
    if (fs.existsSync(this.filepath)) {
      let file = fs.readFileSync(this.filepath, "utf8");
      file.split("\n").forEach((line:string) => {
        if (line.length > 0) {
          this.append(this.serializer.fromCSV(line));
        }
      });
    }
  }
}