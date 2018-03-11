import { OrderRequest } from "../models/order";
import { Indicator } from "../models/indicator";
export declare class InvalidMarketSymbolError extends Error {
    constructor(symbol: string);
}
export declare class InsufficientExchangeFundsError extends Error {
    constructor(symbol: string, amount: number, funds: number);
}
export declare class InsufficientFundsError extends Error {
    constructor(request: OrderRequest);
}
export declare class InvalidExchangeNameError extends Error {
    constructor(name: string);
}
export declare class InvalidSignalError extends Error {
    constructor(indicator: Indicator, signal: any);
}
export declare class InvalidOrderTypeError extends Error {
    constructor(orderRequest: OrderRequest);
}
export declare class InvalidOrderSideError extends Error {
    constructor(orderRequest: OrderRequest);
}
export declare class FileMissingError extends Error {
    constructor(filename: string, type: string);
}
export declare class BacktestFileMissingError extends FileMissingError {
    constructor(filename: string);
}
export declare class ScenarioFileMissingError extends FileMissingError {
    constructor(filename: string);
}
export declare class InvalidCSVError extends Error {
    constructor(csv: string, type: Function);
}
