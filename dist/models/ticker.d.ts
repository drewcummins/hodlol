import { Exchange } from "./exchange";
import { Series, Serializer, TickerSerializer, OrderSerializer, OHLCVSerializer } from "./series";
import { Thread } from "../utils";
import { ID, TTicker, Order, OHLCV, Element } from "./types";
export declare class BaseTicker<T extends Element> {
    protected exchange: Exchange;
    readonly symbol: string;
    readonly series: Series<T>;
    protected thread: Thread;
    protected timeout: number;
    constructor(exchange: Exchange, symbol: string);
    /**
     * Kicks off the ticker process. This runs asynchronously
    */
    run(): Promise<void>;
    /**
     * Move one step forward
    */
    step(): Promise<void>;
    /**
     * Gets the length of the series
     *
     * @returns series length
    */
    length(): number;
    /**
     * Gets the tick at @idx
     *
     * @param idx index of tick to grab
     *
     * @returns tick
     */
    getAt(idx: number): T;
    /**
     * Gets the last tick
     *
     * @returns the last tick in the series
    */
    last(): T;
    /**
     * Kills this ticker (stops its run loop)
    */
    kill(): void;
    protected filename(): string;
    protected subdir(): string;
    protected filepath(): string;
    protected extension(): string;
    protected generateSerializer(): Serializer<T>;
    seriesFromTicker(): Series<T>;
}
export declare class Ticker extends BaseTicker<TTicker> {
    protected generateSerializer(): TickerSerializer;
}
export declare class OHLCVTicker extends BaseTicker<OHLCV> {
    private period;
    isTradeable: boolean;
    constructor(exchange: Exchange, symbol: string, period?: string, isTradeable?: boolean);
    /**
     * Grabbing candlestick data returns 0 <= n <= 500 ticks, so we have to iterate over all of them and add each
    */
    step(): Promise<void>;
    protected extension(): string;
    protected generateSerializer(): OHLCVSerializer;
}
export declare class OrderTicker extends BaseTicker<Order> {
    readonly portfolioID: ID;
    readonly orderID: ID;
    constructor(exchange: Exchange, order: Order, portfolioID: ID);
    step(): Promise<void>;
    private hasChanged(tick);
    protected extension(): string;
    protected generateSerializer(): OrderSerializer;
}
