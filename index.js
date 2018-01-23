#!/usr/bin/env node

'use strict';
const commandLineArgs = require("command-line-args")
const Trader = require("./app/model/trader");

const optionDefinitions = [
  { name: 'help', alias: 'h', type: Boolean },
  { name: 'symbol', alias: 's', type: String, defaultValue: "BTC" },
  { name: 'amount', alias: 'a', type: Number },
  { name: 'trader', alias: 't', type: String, defaultOption: true}
];

const opts = commandLineArgs(optionDefinitions);

(async () => {
  let fund = {symbol: opts.symbol, amount: opts.amount};
  let trader = await Trader.deserialize(opts.trader, fund);
  console.log(trader.serialize());
})();
