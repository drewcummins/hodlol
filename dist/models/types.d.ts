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
export declare class OHLCV extends Tick<OHLCVTick> {
    readonly open: number;
    readonly high: number;
    readonly low: number;
    readonly close: number;
    readonly volume: number;
    constructor(state: OHLCVTick);
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
    start: number;
    end: number;
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
    dataDir(): string;
    static getInstance(): Scenario;
    static create(filepath: string): void;
    static createWithName(name: string, start: number, end: number, record?: boolean, test?: boolean): void;
    static shouldWrite(): boolean;
    static kill(): void;
}
