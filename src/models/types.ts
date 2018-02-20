import { BigNumber } from "bignumber.js"
import { OrderRequest, Order } from "./order";

export function BN(x: Num):BigNumber {
  return new BigNumber(x);
}

export type ID = string;

export type Num = BigNumber | number | string;

export interface Balance {
  free: BigNumber;
  reserved: BigNumber;
}
// (request.market, request.amount, request.price);
export interface API {
  readonly name:string;
  loadMarkets():Promise<any>;
  fetchTicker(pair:string):Promise<any>;
  fetchOHLCV(symbol:string, period:string, since:number|undefined):Promise<any>;
  createLimitBuyOrder(market:string, amount:Num, price:Num):Promise<Order>;
  createLimitSellOrder(market:string, amount:Num, price:Num):Promise<Order>;
  fetchOrders(symbol:string, since:number, limit:number):Promise<any>;
  fetchOrder(orderID:string|number, symbol:string):Promise<any>;
  fetchBalance():Promise<any>;
}

export type BitState = number;

export class BitfieldState {
  private state:number = 0;
  private last:number = 0;
  private completionMask:number=0;

  public init(n:number):number[] {
    return Array.from({length:n}, () => this.add(true));
  }
  
  public add(addToCompletionMask:boolean=false):number {
    const mask:number = 1 << this.last;
    if (addToCompletionMask) this.completionMask |= mask;
    this.last++;
    return mask;
  }

  public createMaskFromSet(bitstates:BitState[]):BitState {
    return bitstates.reduce((mem, state) => mem | state, 0);
  }

  public set(mask:number):void {
    this.state |= mask;
  }

  public kill(mask:number):void {
    this.state &= ~mask;
  }

  public isSet(mask:number):boolean {
    return (this.state & mask) == mask;
  }

  public isComplete():boolean {
    return this.isSet(this.completionMask);
  }
}