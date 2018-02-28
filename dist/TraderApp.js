"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trader_1 = require("./models/trader");
const commandLineArgs = require("command-line-args");
// const Trader = require("./app/model/trader");
const rs = require('readline-sync');
const chrono = require('chrono-node');
const fs = require("fs");
const optionDefinitions = [
    { name: 'help', alias: 'h', type: Boolean },
    { name: 'symbol', alias: 's', type: String, defaultValue: "BTC" },
    { name: 'amount', alias: 'a', type: Number },
    { name: 'trader', alias: 't', type: String, defaultOption: true },
    { name: 'backtest', alias: 'b', type: String },
    { name: 'mock', alias: 'm', type: Boolean, defaultValue: false }
];
const opts = commandLineArgs(optionDefinitions);
// don't require explicit mock
if (!opts.mock && opts.backtest)
    opts.mock = true;
(async () => {
    let traderJSON = JSON.parse(fs.readFileSync(opts.trader).toString());
    new trader_1.Trader(traderJSON, opts).run();
})();
//# sourceMappingURL=TraderApp.js.map