let CryptoJS = require("crypto-js");
let request = require("request-promise-native");

const Response = function() {
  this.statusCode = -1;
  this.success = false;

  this.setHTTPResponse = (response) => {
    //
  }

  this.setHTTPErrorResponse = (err) => {
    this.success = false;
  }
}

const Client = function() {

  this.host = null;
  this.version = null;
  this.creds = null;

  this.exchange = "HODL";

  this.getUserInfo = async () => {
    return new Response();
  }

  this.getDepositAddress = async (symbol) => {
    return new Response();
  }

  this.withdraw = async (symbol, amount, targetAddress) => {
    return new Response();
  }

  this.getBalance = async (symbol) => {
    return new Response();
  }

  this.getTicker = async (pair) => {
    return new Response();
  }

  this.getOrderBook = async (pair) => {
    return new Response();
  }

  this.getMarkets = async () => {
    return new Response();
  }

  this.getSymbols = async (market) => {
    return new Response();
  }

  this.createBuyOrder = async (pair, price, amount) => {
    return new Response();
  }

  this.createSellOrder = async (pair, price, amount) => {
    return new Response();
  }

  this.cancelBuyOrder = async (pair, orderID) => {
    return new Response();
  }

  this.cancelSellOrder = async (pair, orderID) => {
    return new Response();
  }

  this.getBuyOrderDetails = async (pair, orderID) => {
    return new Response();
  }

  this.getSellOrderDetails = async (pair, orderID) => {
    return new Response();
  }



  this.getQueryParamString = (params) => {
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
