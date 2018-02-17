import { Exchange } from "./exchange";
import { Series, Tick, Serializer, TickerSerializer, CandleSerializer, OrderSerializer } from "./series";
import { sleep } from "../utils";
import { Order } from "./order";
import { ID } from "./types";

export class Ticker {
  public kill:boolean = false;
  protected series:Series;
  constructor(protected exchange:Exchange, readonly symbol:string, readonly record:boolean=false, readonly timeout:number=5000) {
    this.series = new Series(this.filepath(), this.generateSerializer(), record);
  }

  public async read() {
    return this.series.read();
  }
  
  public async run() {
    while (true) {
      if (this.kill) break;
      await this.step();
      await this.sleep();
    }
  }

  public async step() {
    const tick = await this.exchange.fetchTicker(this.symbol);
    this.series.append(tick);
    this.exchange.invalidate();
  }

  public async sleep() {
    await sleep(this.timeout);
  }

  public length():number {
    return this.series.length();
  }

  public getAt(idx:number):Tick {
    return this.series.getAt(idx);
  }

  public last():Tick {
    return this.series.last();
  }

  protected filename():string {
    return `${this.symbol.replace("/", "-")}.${this.extension()}`;
  }

  protected subdir():string {
    return ""; //`${config.dateID}`
  }

  protected filepath():string {
    return `./data/${this.exchange.name()}/${this.subdir()}/${this.filename()}`;
  }

  protected extension():string {
    return 'ticker';
  }

  public generateSerializer():Serializer {
    return new TickerSerializer();
  }
}

export class CandleTicker extends Ticker {
  constructor(exchange:Exchange, symbol:string, record:boolean=false, timeout:number=35000, private period:string="1m") {
    super(exchange, symbol, record, timeout);
  }

  public async step() {
    let last:Tick = this.last();
    let since:number = last ? Number(last.timestamp) : this.exchange.time;
    const tick = await this.exchange.fetchOHLCV(this.symbol, this.period, since);
    tick.forEach((candlestick:Array<number>) => {
      let csv:string = candlestick.join(",");
      this.series.appendFromCSV(csv, true);
      this.exchange.invalidate();
    });
    if (this.series.autowrite) this.series.write();
  }

  public extension():string {
    return 'ohlcv';
  }

  public generateSerializer():Serializer {
    return new CandleSerializer();
  }
}

export class OrderTicker extends Ticker {
  readonly orderID:ID;
  constructor(exchange:Exchange, readonly order:Order, record:boolean=false, timeout:number=5000) {
    super(exchange, order.symbol, record, timeout);
    this.orderID = order.id;
  }

  public async step() {
    const tick = await this.exchange.fetchOrder(this.orderID, this.symbol);
    if (this.hasChanged(tick)) {
      this.series.append(tick);
      this.order.status = tick.status;
      this.exchange.invalidate();
    }
  }

  public hasChanged(tick:Tick):boolean {
    let last:Tick = this.last();
    if (!last) return true;
    if (last.status != tick.status) return true;
    if (last.filled != tick.filled) return true;
    return false;
  }

  public extension():string {
    return 'order';
  }

  public generateSerializer():Serializer {
    return new OrderSerializer();
  }
}