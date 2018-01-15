let CryptoJS = require("crypto-js");
let request = require("request-promise-native");
let HODL = require('./hodl');
const config = require('../../config');

let Response = function() {
  HODL.Response.call(this);

  this.setHTTPResponse = function(response) {
    try {
      this.statusCode = response.statusCode;
      this.body = JSON.parse(response.body);
      this.success = this.statusCode == 200 && this.body.success;
      this.data = this.body.data;
    } catch(err) {
      this.error = err;
      this.success = false;
    }
  }

  this.setHTTPErrorResponse = function(err) {
    this.success = false;
    this.statusCode = err.statusCode;
    this.body = JSON.parse(err.body);
  }
}
Response.prototype = Object.create(HODL.Response);

let Client = function() {
  HODL.Client.call(this);

  const GET = "GET";
  const POST = "POST";
  const BUY = "BUY";
  const SELL = "SELL";

  this.host = config.kucoin_api_host;
  this.creds = {key:config.kucoin_api_key, secret:config.kucoin_api_secret};
  this.version = config.kucoin_api_version;
  this.name = "Kucoin";

  this.getUserInfo = async function() {
    return this.request(GET, "user/info", {});
  }

  this.getDepositAddress = async function(symbol) {
    return this.request(GET, "account/" + symbol + "/wallet/address", {});
  }

  this.getBalance = async function(symbol) {
    return this.request(GET, "account/" + symbol + "/balance", {});
  }

  this.getTicker = async function(pair) {
    return this.request(GET, "open/tick", {symbol: pair}, false);
  }

  this.getOrderBook = async function(pair) {
    return this.request(GET, "open/orders", {symbol: pair}, false);
  }

  this.getMarkets = async function() {
    return this.request(GET, "open/markets", {}, false);
  }

  this.getSymbols = async function(market, callback, errorCallback) {
    return this.request(GET, "open/symbols", {}, false);
  }

  this.addFavoriteSymbol = async function(pair) {
    return this.request(POST, "market/symbol/fav", {symbol: pair, fav: 1});
  }

  this.deleteFavoriteSymbol = async function(pair) {
    return this.request(POST, "market/symbol/fav", {symbol: pair, fav: 0});
  }

  this.createBuyOrder = async function(pair, price, amount) {
    var req = {symbol:pair, price:price, amount:amount, type:BUY};
    return this.request(POST, "order", req);
  }

  this.createSellOrder = async function(pair, price, amount) {
    var req = {symbol:pair, price:price, amount:amount, type:SELL};
    return this.request(POST, "order", req);
  }

  this.cancelBuyOrder = async function(pair, orderID) {
    return this.request(POST, "cancel-order", {symbol:pair, orderOid:orderID, type:BUY});
  }

  this.cancelSellOrder = async function(pair, orderID) {
    return this.request(POST, "cancel-order", {symbol:pair, orderOid:orderID, type:SELL});
  }

  this.getBuyOrderDetails = async function(pair, orderID) {
    return this.request(GET, "order/detail", {symbol: pair, orderOid: orderID, type:BUY});
  }

  this.getSellOrderDetails = async function(pair, orderID) {
    return this.request(GET, "order/detail", {symbol: pair, orderOid: orderID, type:SELL});
  }



  this.sign = function(endpoint, timestamp, params) {
    var raw = "/" + this.version + "/" + endpoint + "/" + timestamp + "/" + params;
    var utf8 = CryptoJS.enc.Utf8.parse(raw);
    var b64 = CryptoJS.enc.Base64.stringify(utf8);
    var secret = CryptoJS.enc.Utf8.parse(this.creds.secret);
    return CryptoJS.HmacSHA256(b64, secret).toString(CryptoJS.enc.Hex);
  }

  this.request = async function(method, endpoint, params, requireSignature=true) {
    const query = this.getQueryParamString(params);

    var options = {
      url: this.host + "/" + this.version + "/" + endpoint,
      method: method,
      resolveWithFullResponse: true
    };

    if (requireSignature) {
      const timestamp = + new Date();
      const signature = this.sign(endpoint, timestamp, query);
      options.headers = {
        'Accept': 'application/json',
        'KC-API-KEY': this.creds.key,
        'KC-API-NONCE': timestamp,
        'KC-API-SIGNATURE': signature
      };
    }

    if (query.length > 0) {
      options.url += "?" + query;
    }

    response = new Response();
    try {
      let res = await request(options);
      response.setHTTPResponse(res);
    } catch(err) {
      if (err && err.response) {
        // only set http error if we get a response
        // otherwise we're down and default to statusCode of -1
        // and success false
        response.setHTTPErrorResponse(err.response);
      }
    }
    return response;
  }
}
Client.prototype = Object.create(HODL.Client);

module.exports = new Client();
