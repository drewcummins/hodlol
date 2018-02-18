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
    { name: 'fake', alias: 'f', type: Boolean, defaultValue: false }
];
const opts = commandLineArgs(optionDefinitions);
(async () => {
    let params = {
        symbol: opts.symbol,
        amount: opts.amount,
        backtest: opts.backtest,
        fakeOrders: opts.fake
    };
    let traderJSON = JSON.parse(fs.readFileSync(opts.trader).toString());
    let trader = new trader_1.Trader(traderJSON, params);
    trader.run();
    // let trader = null;
    // try {
    //   console.log("Loading Trader...")
    //   trader = await Trader.deserialize(opts.trader, params);
    // } catch(err) {
    //   console.log("Error:", err);
    //   process.exit();
    // }
    // console.log("Trader initialized.", JSON.parse(trader.serialize()));
    // await xu.sleep(1000);
    // trader.run(); // start tickers/candles
})();
//# sourceMappingURL=TraderApp.js.map