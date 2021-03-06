import { OrderRequest } from "../models/order";
import { Indicator, Signal } from "../models/indicator";

export class InvalidMarketSymbolError extends Error {
  constructor(symbol:string) {
    super(`Invalid market symbol provided: ${symbol}`);
  }
}

export class InsufficientExchangeFundsError extends Error {
  constructor(symbol:string, amount:number, funds:number) {
    super(`Insufficient funds on exchange: Expected ${amount} ${symbol} to be >= ${funds} ${symbol}`);
  }
}

export class InsufficientFundsError extends Error {
  constructor(request:OrderRequest) {
    super(`Insufficient funds for request: ${request}`);
  }
}

export class InvalidExchangeNameError extends Error {
  constructor(name:string) {
    super(`Invalid exchange name error: ${name}. No such exchange exists on CCXT.`);
  }
}

export class InvalidSignalError extends Error {
  constructor(indicator:Indicator, signal:any) {
    super(`Invalid signal from ${indicator}: ${signal}`);
  }
}

export class InvalidOrderTypeError extends Error {
  constructor(orderRequest:OrderRequest) {
    super(`Invalid order type: ${orderRequest}`);
  }
}

export class InvalidOrderSideError extends Error {
  constructor(orderRequest:OrderRequest) {
    super(`Invalid order side: ${orderRequest}`);
  }
}

export class FileMissingError extends Error {
  constructor(filename:string, type:string) {
    super(`No ${type} file found when attempting to read ${filename}`);
  }
}

export class BacktestFileMissingError extends FileMissingError {
  constructor(filename:string) {
    super(filename, 'backtest');
  }
}

export class ScenarioFileMissingError extends FileMissingError {
  constructor(filename:string) {
    super(filename, 'scenario');
  }
}

export class InvalidCSVError extends Error {
  constructor(csv:string, type:Function) {
    super(csv + type);
  }
}