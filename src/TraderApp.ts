import { Portfolio } from "./models/portfolio"
import { BigNumber } from "bignumber.js"

let portfolio = new Portfolio();
portfolio.addFree("lol", 3)
let balance = portfolio.balance("lol");
console.log(balance);
balance.free = new BigNumber(5);