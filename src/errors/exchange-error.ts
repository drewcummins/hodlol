import { OrderRequest } from "../models/order";

export class InvalidMarketSymbolError extends Error {
  constructor(symbol:string) {
    super(`Invalid market symbol provided: ${symbol}`);
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