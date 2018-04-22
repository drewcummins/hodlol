import { BigNumber } from "bignumber.js";
import * as ccxt from "ccxt";
export declare function BN(x: Num): BigNumber;
export declare function BNF(x: Num): BigNumber;
export declare type ID = string;
export declare type Num = BigNumber | number | string;
export declare type HashMap<T> = Map<string, T>;
export interface Balance {
    free: Num;
    reserved: Num;
}
/**
 * Turns a Balance into human readable set of strings
 * that can be logged easily
 */
export declare class ReadableBalance implements Balance, IHumanReadable {
    private innerBalance;
    free: string;
    reserved: string;
    constructor(balance: Balance);
    format(value: Num): string;
    readable(): any;
}
export declare type Value = {
    [key: string]: Balance;
};
export interface API {
    readonly name: string;
    loadMarkets(): Promise<any>;
    fetchTicker(pair: string): Promise<TickerTick>;
    fetchOHLCV(symbol: string, period: string, since: number | undefined): Promise<OHLCVTick[]>;
    createLimitBuyOrder(market: string, amount: Num, price: Num): Promise<OrderTick>;
    createLimitSellOrder(market: string, amount: Num, price: Num): Promise<OrderTick>;
    createMarketBuyOrder(market: string, amount: Num, price: Num): Promise<OrderTick>;
    createMarketSellOrder(market: string, amount: Num, price: Num): Promise<OrderTick>;
    fetchOrders(symbol: string, since: number, limit: number): Promise<OrderTick[]>;
    fetchOrder(orderID: ID, symbol: string): Promise<OrderTick>;
    fetchBalance(): Promise<any>;
    cancelOrder(orderID: ID, symbol: string): Promise<any>;
}
export declare type OrderTick = ccxt.Order;
export declare type OrderBookTick = ccxt.OrderBook;
export declare type TradeTick = ccxt.Trade;
export declare type TickerTick = ccxt.Ticker;
export declare type OHLCVTick = ccxt.OHLCV & {
    timestamp: number;
};
export declare type ExchangeState = OHLCVTick | OrderTick | OrderBookTick | TradeTick | TickerTick;
export declare class Tick<T extends ExchangeState> {
    readonly state: T;
    readonly timestamp: number;
    constructor(state: T);
    /**
     * Provides the unique key for this tick
     *
     * @returns unique key
     */
    key(): string;
}
export declare type OrderBook = Tick<OrderBookTick>;
export declare type Trade = Tick<TradeTick>;
export declare type TTicker = Tick<TickerTick>;
export declare class OHLCV extends Tick<OHLCVTick> implements IHumanReadable {
    readonly open: number;
    readonly high: number;
    readonly low: number;
    readonly close: number;
    readonly volume: number;
    constructor(state: OHLCVTick);
    readable(): {
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
    };
}
export declare class Order extends Tick<OrderTick> {
    key(): string;
}
export declare type SeriesElement = Order | OHLCV | TTicker | Trade | OrderBook;
export declare type Element = SeriesElement;
export declare type BitState = number;
export declare class BitfieldState {
    private state;
    private last;
    private completionMask;
    init(n: number): number[];
    add(addToCompletionMask?: boolean): number;
    createMaskFromSet(bitstates: BitState[]): BitState;
    set(mask: number): void;
    kill(mask: number): void;
    isSet(mask: number): boolean;
    isComplete(): boolean;
}
export interface IScenario {
    id: ID;
    start: number | string;
    end: number | string;
    record?: boolean;
    test?: boolean;
}
export declare enum ScenarioMode {
    PLAYBACK = "playback",
    RECORD = "record",
}
export declare class Scenario implements IScenario {
    readonly id: ID;
    readonly start: number;
    readonly end: number;
    readonly record: boolean;
    readonly test: boolean;
    time: number;
    mode: ScenarioMode;
    private static instance;
    private constructor();
    tryParseStartEnd(json: IScenario): number[];
    tryParseDateString(input: number | string): number;
    dataDir(): string;
    static getInstance(): Scenario;
    static create(filepath: string): void;
    static createWithName(name: string, start: number, end: number, record?: boolean, test?: boolean): void;
    static createWithObject(json: IScenario, force: boolean): void;
    static shouldWrite(): boolean;
    static kill(): void;
}
/**
 * Contract to expose a plain old object form
 * of yourself that is easily readable in serialized
 * form. Useful for sticking a readable summary into the
 * logger and events
 */
export interface IHumanReadable {
    readable(): any;
}
