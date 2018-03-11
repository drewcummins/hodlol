import { ID, API, BitState, Order, TTicker, OHLCV } from "./types";
import { Marketplace } from "./market";
import { OHLCVTicker, OrderTicker } from "./ticker";
import { OrderRequest } from "./order";
import { Portfolio } from "./portfolio";
export declare type Feed = {
    candles: Map<string, OHLCVTicker>;
    orders: Map<string, OrderTicker>;
};
export declare class Exchange {
    readonly api: API;
    markets: Marketplace;
    readonly feed: Feed;
    private portfolios;
    readonly time: number;
    private state;
    private dirty;
    readonly marketsLoaded: BitState;
    readonly feedsLoaded: BitState;
    readonly tickersRunning: BitState;
    readonly fundsSufficient: BitState;
    constructor(api: API);
    /**
     * Registers a portfolio for the exchange to mutate
     *
     * @param portfolio Portfolio to register
     */
    registerPortfolio(portfolio: Portfolio): void;
    /**
     * Marks the exchange to process a change in ticker/order state
    */
    invalidate(): void;
    /**
     * Opposite of invalidate
    */
    clean(): void;
    /**
     * Gets the name of the current API being used
     *
     * e.g. "binance"
     *
     * @returns name of API
    */
    name(): string;
    /**
     * Indicates whether markets have been downloaded yet
     *
     * @returns boolean
    */
    hasMarkets(): boolean;
    /**
     * Indicates whether feeds have been initialized yet
     *
     * @returns boolean
    */
    hasFeeds(): boolean;
    /**
     * Indicates whether tickers have kicked off
     *
     * @returns boolean
    */
    areTickersRunning(): boolean;
    /**
     * Indicates whether all things have been initalized
     *
     * @returns true if feeds and markets are loaded, false otherwise
    */
    isLoaded(): boolean;
    /**
     * Indicates whether the exchange needs an update call
     *
     * @returns true if exchange dirty
    */
    isDirty(): boolean;
    /**
     * Indicates whether the funds requested are available
     *
     * @returns true if funds are available
    */
    hasSufficientFunds(): boolean;
    /**
     * Grabs marketplace from API
    */
    loadMarketplace(tickers?: string[]): Promise<void>;
    /**
     * Loads all given tickers
     *
     * @param tickers tickers for feed to load
     */
    loadFeeds(tickers: string[]): void;
    /**
     * Validates that there are sufficient funds for the given symbol
     *
     * @param fundSymbol Symbol to extract funds from
     * @param fundAmount Amount to use
     */
    validateFunds(fundSymbol: string, fundAmount: number): Promise<boolean>;
    /**
     * Runs all tickers (each in their own "thread")
    */
    runTickers(): void;
    /**
     * Cleans up order tickers when status has changed to closed or cancelled
    */
    processOrderState(): void;
    /**
     * Gets the given exchange API's markets
     *
     * @returns markets
    */
    loadMarkets(): Promise<any>;
    /**
     * Gets ticker data for given pair
     *
     * @param pair market pair to grab ticker info for
     *
     * @returns ticker data
     */
    fetchTicker(pair: string): Promise<TTicker>;
    /**
     * Gets candlestick (open, high, low, close, volume) data for @symbol
     *
     * @param symbol market symbol to grab
     * @param period timescale to build candlesticks from
     * @param since start time to grab data from
     *
     * @returns candlestick data
     */
    fetchOHLCV(symbol: string, period?: string, since?: number | undefined): Promise<OHLCV[]>;
    /**
     * Gets an order by given ID
     *
     * @param orderID ID of order to grab
     * @param symbol symbol associated with that order (don't know why exchanges operate like this)
     *
     * @return requested order if it exists
     */
    fetchOrder(orderID: ID, symbol: string): Promise<Order>;
    /**
     * Cancels an order by id
     *
     * @param orderID ID of order to cancel
     *
     * @return
     */
    cancelOrder(orderID: ID, symbol: string): Promise<any>;
    /**
     * Gets exchange balance
     *
     * @returns balance hash
    */
    fetchBalance(): Promise<any>;
    /**
     * Creates an order according to the given OrderRequest
     *
     * @param request Order request
     *
     * @returns the newly created order
     * @throws InvalidOrderTypeError if an invalid order type is set
     */
    createOrder(request: OrderRequest): Promise<Order>;
    /**
     * Creates a new candlestick ticker for @symbol
     *
     * @param symbol market symbol to track candlestick data for
     *
     * @returns the candleticker
     */
    addCandlestick(symbol: string): OHLCVTicker;
    /**
     * Creates a ticker to follow an order
     *
     * @param order order to track
     *
     * @returns the OrderTicker
     */
    protected addOrder(order: Order, portfolioID: ID): OrderTicker;
    /**
     * Calculates price for @base in @quote units
     *
     * @param base base symbol
     * @param quote quote symbol
     *
     * @returns price value
     */
    price(base: string, quote: string): Promise<number>;
    /**
     * Calculates a market path from market a to market b
     *
     * @param a symbol to start from
     * @param b symbol to go to
     *
     * @returns the path if one exists, null otherwise
     */
    path(a: string, b: string): string[] | null;
    private _path(a, b);
}
