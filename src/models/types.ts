import { BigNumber } from "bignumber.js"
import { OrderRequest } from "./order";

export function BN(x: Num):BigNumber {
  return new BigNumber(x);
}

export type ID = string;

export type Num = number | BigNumber;

export interface Balance {
  free: BigNumber;
  reserved: BigNumber;
}

export interface API {
  readonly name:string;
  loadMarkets():Promise<any>;
  fetchTicker(pair:string):Promise<any>;
  fetchOHLCV(symbol:string, period:string, since:number|undefined):Promise<any>;
  createLimitBuyOrder(request:OrderRequest):Promise<any>;
  createLimitSellOrder(request:OrderRequest):Promise<any>;
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
    return Array.from({length:n}, () => this.add());
  }
  
  public add(setOn:boolean=false, addToCompletionMask:boolean=true):number {
    const mask:number = 1 << this.last;
    if (setOn) this.set(mask);
    if (addToCompletionMask) this.completionMask |= mask;
    this.last++;
    return mask;
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
    return (this.state & this.completionMask) == this.completionMask;
  }
}