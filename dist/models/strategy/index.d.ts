import { Indicator, IndicatorJSON } from "../indicator";
import { ID, Num, Value, Order } from "../types";
import { Portfolio } from "../portfolio";
import { OrderRequest } from "../order";
import { Feed } from "../exchange";
import { IMarket } from "../market";
export interface StrategyJSON {
    fileName: string;
    className: string;
    weight: number;
    indicators?: IndicatorJSON[];
    title?: string;
}
export interface TraderStrategyInterface {
    fundSymbol: string;
    fundAmount: number;
    requestOrderHandler: (strategy: Strategy, request: OrderRequest) => Order;
    feed: Feed;
}
export declare class Strategy {
    portfolio: Portfolio;
    protected tsi: TraderStrategyInterface;
    readonly id: ID;
    readonly title: string;
    readonly initialValue: Num;
    protected indicators: Indicator[];
    protected orders: Map<ID, Order>;
    originalValue: Value;
    constructor(portfolio: Portfolio, source: StrategyJSON, tsi: TraderStrategyInterface);
    before(): Promise<void>;
    after(): Promise<void>;
    protected init(source: StrategyJSON): void;
    tick(): Promise<void>;
    protected placeOrder(request: OrderRequest): Promise<Order>;
    protected placeLimitBuyOrder(market: IMarket, budget: Num, close: Num): Promise<Order>;
    protected placeLimitSellOrder(market: IMarket, budget: Num, close: Num): Promise<Order>;
    protected getTitle(): string;
}
