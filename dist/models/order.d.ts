import { BigNumber } from "bignumber.js";
import { Num, ID } from "./types";
import { IMarket } from "./market";
export declare enum OrderSide {
    BUY = "buy",
    SELL = "sell",
}
export declare enum OrderType {
    MARKET = "market",
    LIMIT = "limit",
}
export declare enum OrderStatus {
    OPEN = "open",
    CLOSED = "closed",
    CANCELED = "canceled",
}
export declare abstract class OrderRequest {
    readonly type: OrderType;
    readonly side: OrderSide;
    readonly market: IMarket;
    readonly amount: Num;
    readonly price: Num;
    readonly portfolioID: ID;
    constructor(type: OrderType, side: OrderSide, market: IMarket, amount: Num, price: Num, portfolioID: ID);
    cost(): Num;
    benefit(): Num;
    protected feeCoefficient(): BigNumber;
    static feeCoefficient(side: OrderSide, fee: Num): BigNumber;
}
export declare class MarketOrderRequest extends OrderRequest {
    constructor(side: OrderSide, market: IMarket, amount: Num, price: Num, portfolioID: ID);
}
export declare class LimitOrderRequest extends OrderRequest {
    constructor(side: OrderSide, market: IMarket, amount: Num, price: Num, portfolioID: ID);
    static buyMaxWithBudget(market: IMarket, budget: Num, price: Num, portfolioID: ID): LimitOrderRequest;
}
export declare class MarketBuyOrderRequest extends MarketOrderRequest {
    constructor(market: IMarket, amount: Num, price: Num, portfolioID: ID);
}
export declare class MarketSellOrderRequest extends MarketOrderRequest {
    constructor(market: IMarket, amount: Num, price: Num, portfolioID: ID);
}
export declare class LimitBuyOrderRequest extends LimitOrderRequest {
    constructor(market: IMarket, amount: Num, price: Num, portfolioID: ID);
}
export declare class LimitSellOrderRequest extends LimitOrderRequest {
    constructor(market: IMarket, amount: Num, price: Num, portfolioID: ID);
}
