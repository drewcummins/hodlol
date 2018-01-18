'use strict';
require('dotenv').config({path: `./env/${process.env.NODE_ENV}.env`});

const config = {
  kucoin_api_key: process.env.KUCOIN_API_KEY,
  kucoin_api_secret: process.env.KUCOIN_API_SECRET,

  binance_api_key: process.env.BINANCE_API_KEY,
  binance_api_secret: process.env.BINANCE_API_SECRET
};

module.exports = config;
