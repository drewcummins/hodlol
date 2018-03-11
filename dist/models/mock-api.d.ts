import { API, Num, Balance, OrderTick, OHLCVTick, TickerTick, ID, OHLCV } from "./types";
import { Feed } from "./exchange";
import { Series } from "./series";
export declare class MockAPI implements API {
    protected api: API;
    name: string;
    private thread;
    protected candles: Map<string, Series<OHLCV>>;
    protected orders: Map<string, OrderTick>;
    constructor(api: API);
    loadTickers(feed: Feed): Promise<void>;
    run(): Promise<void>;
    loadMarkets(): Promise<any>;
    fetchTicker(pair: string): Promise<TickerTick>;
    fetchOHLCV(symbol: string, period: string, since: number | undefined): Promise<OHLCVTick[]>;
    createLimitBuyOrder(market: string, amount: Num, price: Num): Promise<OrderTick>;
    createMarketBuyOrder(market: string, amount: Num, price: Num): Promise<OrderTick>;
    createLimitSellOrder(market: string, amount: Num, price: Num): Promise<OrderTick>;
    createMarketSellOrder(market: string, amount: Num, price: Num): Promise<OrderTick>;
    fetchOrders(symbol: string, since?: number, limit?: number): Promise<OrderTick[]>;
    fetchOrder(orderID: string, symbol: string): Promise<OrderTick>;
    fetchBalance(): Promise<Balance>;
    cancelOrder(id: ID): Promise<any>;
}
