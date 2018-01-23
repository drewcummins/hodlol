'use strict';
const ccxt = require('ccxt');
const config = require('./config');
const model = require('./app/model');
const Trader = require("./app/model/trader")
const JumpThreshold = require('./app/model/signal/jump-threshold');
// const Strategy = require('./app/model/strategy');
const BuyDipSellPeak = require('./app/model/strategy/buy-dip-sell-peak');


(async () => {
  let binance = new ccxt.binance({
    apiKey: config.binance_api_key,
    secret: config.binance_api_secret,
    enableRateLimit: true
  });

  let bdsp = new BuyDipSellPeak({threshold:0.0005});
  let trader = await Trader.FromAPI(binance, "BTC", 0.01, [bdsp]);
  trader.spoolTickers(['ETH/BTC', 'LTC/BTC', 'XMR/BTC']);
  trader.execute(10);

})();
