import { Strategy, StrategyJSON, TraderStrategyInterface } from ".";
import { Portfolio } from "../portfolio";

export class HODL extends Strategy {
  protected getTitle():string {
    return "HODL";
  }
}