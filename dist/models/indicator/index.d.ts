import { Feed } from "../exchange";
import { BaseTicker } from "../ticker";
import { Element } from "../types";
export declare enum Signal {
    BUY = 0,
    SELL = 1,
    PASS = 2,
}
export interface IndicatorJSON {
    fileName: string;
    className: string;
}
export declare class Indicator {
    protected feed: Feed;
    symbol: string;
    private last;
    constructor(feed: Feed, symbol: string, source: IndicatorJSON);
    init(source: IndicatorJSON): void;
    evaluate(ticker: BaseTicker<Element>): Promise<Signal>;
    tick(): Promise<Signal>;
    protected isTickerUpdated(ticker: BaseTicker<Element>): boolean;
    protected markTickerRead(ticker: BaseTicker<Element>): void;
}
export interface MultiIndicatorJSON extends IndicatorJSON {
    subindicators: IndicatorJSON[];
}
export declare class MultiIndicator extends Indicator {
    protected subindicators: Indicator[];
    init(source: MultiIndicatorJSON): Promise<void>;
}
