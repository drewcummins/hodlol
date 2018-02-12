"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const portfolio_1 = require("./models/portfolio");
const bignumber_js_1 = require("bignumber.js");
let portfolio = new portfolio_1.Portfolio();
portfolio.addFree("lol", 3);
let balance = portfolio.balance("lol");
console.log(balance);
balance.free = new bignumber_js_1.BigNumber(5);
//# sourceMappingURL=TraderApp.js.map