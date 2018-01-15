'use strict';
require('dotenv').config({path: `./env/${process.env.NODE_ENV}.env`});

const config = {
  kucoin_api_host: process.env.KUCOIN_API_HOST,
  kucoin_api_key: process.env.KUCOIN_API_KEY,
  kucoin_api_secret: process.env.KUCOIN_API_SECRET,
  kucoin_api_version: process.env.KUCOIN_API_VERSION
};

module.exports = config;
