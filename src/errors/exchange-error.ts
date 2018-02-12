import { OrderRequest } from "../models/types";

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