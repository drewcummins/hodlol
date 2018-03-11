import { Balance, Num, Value, Order } from './types';
import { OrderRequest } from './order';
import { Marketplace, IMarket } from './market';
export declare class Portfolio {
    private markets;
    readonly fundSymbol: string;
    readonly fundAmount: Num;
    readonly id: string;
    private balances;
    constructor(markets: Marketplace, fundSymbol?: string, fundAmount?: Num);
    /**
     * Gets balance for the given currency
     *
     * @param symbol currency symbol to get balance for
     *
     * @returns balance
     */
    balance(symbol: string): Balance;
    /**
     * Gets market associated with symbol
     *
     * @param marketSymbol market symbol to get market for
     *
     * @returns Relevant market
     * @throws InvalidMarketSymbolError if symbol doesn't exist in markets
     */
    marketBySymbol(marketSymbol: string): IMarket;
    /**
     * Gets balance for base and quote of given market
     *
     * @param marketSymbol market symbol to get balance of
     *
     * @returns base and quote balances
     * @throws InvalidMarketSymbolError if symbol doesn't exist in markets
     */
    balanceByMarket(marketSymbol: string): Balance[];
    /**
     * Checks whether there are sufficient funds for the given request
     *
     * @param request OrderRequest to verify funds for
     *
     * @returns whethere there are sufficient funds or not
     * @throws InvalidOrderSideError if request.side not set correctly
     */
    hasSufficientFunds(request: OrderRequest): Boolean;
    /**
     * Reserves the appropriate funds necessary to make the given request.
     *
     * This mutates the portfolio state.
     *
     * @param request request to accommodate
     */
    reserve(request: OrderRequest): void;
    /**
     * Undoes a reservation made for a request
     *
     * @param request request to undo
     */
    undo(request: OrderRequest): void;
    /**
     * Fills the given order.
     *
     * This mutates the portfolio state.
     *
     * @param order Order to fill
     */
    fill(order: Order): void;
    private addFree(symbol, amount);
    private addReserved(symbol, amount);
    private removeFree(symbol, amount);
    private removeReserved(symbol, amount);
    private ensureBalance(symbol);
    /**
     * Gets the value of the portfolio in @quote
     *
     * @param quote Quote symbol to get price in
     * @param price Price function (on exchange)--this is sloppy
     *
     * @returns portfolio value
     */
    value(quote: string, price: (base: string, quote: string) => Num): Promise<Value>;
}
