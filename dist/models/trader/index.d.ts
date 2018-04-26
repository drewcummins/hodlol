import { Exchange } from "../exchange";
import { Order } from "../types";
import { Thread } from "../../utils";
import { Strategy, StrategyJSON } from "../strategy";
import { OrderRequest } from "../order";
export interface TraderJSON {
    name: string;
    exchange: string;
    strategies: StrategyJSON[];
    tickers: string[];
}
export interface TraderParams {
    symbol: string;
    quote: string;
    amount: number;
    backtest?: string;
    mock: boolean;
}
export declare class Trader {
    protected source: TraderJSON;
    protected params: TraderParams;
    protected exchange: Exchange;
    protected strategies: Strategy[];
    protected thread: Thread;
    protected print: boolean;
    /**
     * Creates a new Trader
     *
     * @param source The trader json that describes how to initialize strategies etc.
     * @param params Parameters that describe how to interact with an exchange
     */
    constructor(source: TraderJSON, params: TraderParams);
    protected stepExchange(): Promise<void>;
    protected initStrategies(): Promise<void>;
    protected initExchange(): Promise<void>;
    /**
     * Kicks off everything necessary for the exchange and initializes all strategies
    */
    run(): Promise<void>;
    /**
     * Kills this trader's run thread
     *
     * This will leave "orphaned threads"
     * To kill everything call @Thread.killAll()
    */
    kill(): void;
    /**
     * Asks the trader to "consider" an order
     *
     * @param strategy Strategy requesting the order
     * @param orderRequest Order being requested
     *
     * @returns the created order if successful
     */
    consider(strategy: Strategy, orderRequest: OrderRequest): Promise<Order>;
    protected printPerformance(): Promise<void>;
}
