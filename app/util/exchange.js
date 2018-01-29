'use strict';
const ccxt = require('ccxt');
const config = require('../../config');
const dateFormat = require('dateformat');

module.exports.sleep = (ms) => new Promise (resolve => setTimeout (resolve, ms));

module.exports.getExchange = (name) => {
  switch (name) {
    case "binance":
      return new ccxt.binance({
        apiKey: config.binance_api_key,
        secret: config.binance_api_secret
      });
    case "kucoin":
      return new ccxt.kucoin({
        apiKey: config.kucoin_api_key,
        secret: config.kucoin_api_secret
      });
    default:
      throw new Error("Must specify exchange")
  }
}

module.exports.DATE_ID = dateFormat(new Date(), "mmmm-d-yyyy-h:MM:ss-TT");
console.log(module.exports.DATE_ID);
