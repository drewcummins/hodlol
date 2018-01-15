'use strict'

const uuid = require('uuid/v4');



function Price(price, timestamp) {
  this.x = price;
  this.t = timestamp;
}



function Pair(base, quote) {
  this.base = base;
  this.quote = quote;
  this.prices = [];
  this.symbol = () => {
    return `${this.base}-${this.quote}`;
  }
  this.push = (price) => {
    this.prices.push(price);
  }
  this.currentPrice = () => {
    return this.prices[this.prices.length - 1];
  }
}



function Asset(pair, price, amount, timestamp) {
  this.id = uuid();
  this.pair = pair;
  this.symbol = pair.symbol();
  this.paid = new Price(price, timestamp);
  this.amount = amount;
  this.portfolioID = null; // just to be explicit
  this.initialValue = () => {
    return this.paid.x * this.amount;
  }
  this.currentValue = () => {
    const current = this.pair.currentPrice();
    return current.x * this.amount;
  }
  this.currentDelta = () => {
    const current = this.pair.currentPrice();
    return current.x - this.paid.x;
  }
  this.currentGrowth = () => {
    const current = this.pair.currentPrice();
    return current.x/this.paid.x;
  }
  this.valueAtPrice = (price) => {
    return price.x * this.amount;
  }
  this.deltaAtPrice = (price) => {
    return price.x - this.paid.x;
  }
  this.growthAtPrice = (price) => {
    return price.x/this.paid.x;
  }
  this.duration = () => {
    return + new Date() - this.paid.t;
  }
}



function Portfolio() {
  this.id = uuid();
  this.assets = {};

  this.addAsset = (asset) => {
    if (asset.portfolioID != null) {
      throw new Error("Asset already belongs to portfolio", portfolio.id);
    }
    asset.portfolioID = this.id;
    if (!this.assets[asset.symbol]) {
      this.assets[asset.symbol] = {};
    }
    this.assets[asset.symbol][asset.id] = asset;
  }

  this.removeAsset = (asset) => {
    if (this.assets[asset.symbol]) {
      if (this.assets[asset.symbol][asset.id]) {
        this.assets[asset.symbol][asset.id].portfolioID = null;
        delete this.assets[asset.symbol][asset.id];
        return true;
      }
    }
    return false;
  }

  this.assetList = () => {
    let all = [];
    for (var symbol in this.assets) {
      if (this.assets.hasOwnProperty(symbol)) {
        let a = this.assets[symbol];
        for (var assetID in a) {
          if (a.hasOwnProperty(assetID)) {
            all.push(a[assetID]);
          }
        }
      }
    }
    return all;
  }

  this.reduce = (func) => {
    const all = this.assetList();
    return all.reduce((mem, asset) => mem + asset[func]());
  }

  this.initialValue = () => {
    const all = this.assetList();
    return all.reduce((mem, asset) => mem + asset.initialValue());
  }

  this.currentValue = () => {
    const all = this.assetList();
    return all.reduce((mem, asset) => mem + asset.currentValue());
  }
}


module.exports = {
  Price: Price,
  Pair: Pair,
  Asset: Asset,
  Portfolio: Portfolio
}
