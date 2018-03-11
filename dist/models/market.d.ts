import { Num } from './types';
export interface IMarket {
    readonly symbol: string;
    readonly base: string;
    readonly quote: string;
    readonly maker: Num;
    readonly taker: Num;
}
export declare type Market = IMarket | undefined;
export declare type MarketMap = {
    [symbol: string]: Market;
};
export declare class Marketplace {
    private symbolMap;
    private baseMap;
    private quoteMap;
    constructor(markets: MarketMap);
    /**
     * Gets market for the given symbol
     *
     * @param symbol Market symbol to grab
     *
     * @returns market with given symbol
     */
    getWithSymbol(symbol: string): Market;
    /**
     * Gets market by base and quote symbols
     *
     * @param base Base symbol of pair
     * @param quote Quote symbol of pair
     *
     * @returns appropriate market
     */
    getWithBase(base: string, quote: string): Market;
    /**
     * Gets markets by base
     *
     * @param base Base symbol of pair
     *
     * @returns matching markets
     */
    getMarketsWithBase(base: string): MarketMap;
    /**
     * Gets market by base and quote symbols
     *
     * @param quote Quote symbol of pair
     * @param base Base symbol of pair
     *
     * @returns appropriate market
     */
    getWithQuote(quote: string, base: string): Market;
    /**
     * Gets markets by quote
     *
     * @param quote Quote symbol of pair
     *
     * @returns matching markets
     */
    getMarketsWithQuote(quote: string): MarketMap;
    private getMarket(map, symbol);
    private getMarketMap(mm, symbol);
}
