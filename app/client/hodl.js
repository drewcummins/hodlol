let CryptoJS = require("crypto-js");
let request = require("request-promise-native");

const Response = function() {
  this.statusCode = -1;
  this.success = false;

  this.setHTTPResponse = function(response) {
    //
  }

  this.setHTTPErrorResponse = function(err) {
    this.success = false;
  }
}

const Client = function() {

  this.host = null;
  this.version = null;
  this.creds = null;

  this.name = "HODL";

  this.getUserInfo = async function() {
    return new Response();
  }

  this.getDepositAddress = async function(symbol) {
    return new Response();
  }

  this.withdraw = async function(symbol, amount) {
    return new Response();
  }

  this.getBalance = async function(symbol) {
    return new Response();
  }

  this.getTicker = async function(pair) {
    return new Response();
  }

  this.getOrderBook = async function(pair) {
    return new Response();
  }

  this.getMarkets = async function() {
    return new Response();
  }

  this.getSymbols = async function(market) {
    return new Response();
  }

  this.createBuyOrder = async function(pair, price, amount) {
    return new Response();
  }

  this.createSellOrder = async function(pair, price, amount) {
    return new Response();
  }

  this.cancelBuyOrder = async function(pair, orderID) {
    return new Response();
  }

  this.cancelSellOrder = async function(pair, orderID) {
    return new Response();
  }

  this.getBuyOrderDetails = async function(pair, orderID) {
    return new Response();
  }

  this.getSellOrderDetails = async function(pair, orderID) {
    return new Response();
  }



  this.getQueryParamString = function(params) {
    var query = [];
    for (const param in params) {
      query.push(param + "=" + params[param]);
    }
    return query.sort().join("&");
  }
}

module.exports = {
  Client: Client,
  Response: Response
};
