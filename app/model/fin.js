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

    let quote = this.assets[asset.pair.quote];
    if (!quote) {
      quote = this.assets[asset.pair.quote] = {};
    }

    let base = quote[asset.pair.base];
    if (!base) {
      base = quote[asset.pair.base] = {};
    }

    base[asset.id] = asset;
  }

  this.removeAsset = (asset) => {
    let quote = this.assets[asset.pair.quote];
    if (quote) {
      let base = quote[asset.pair.base];
      if (base && base[asset.id]) {
        base[asset.id].portfolioID = null;
        delete base[asset.id];
        return true;
      }
    }
    return false;
  }

  this.assetList = () => {
    let all = [];
    for (var quote in this.assets) {
      if (this.assets.hasOwnProperty(quote)) {
        let q = this.assets[quote];
        for (var base in q) {
          if (q.hasOwnProperty(base)) {
            let b = q[base];
            for (var assetID in b) {
              if (b.hasOwnProperty(assetID)) {
                all.push(b[assetID]);
              }
            }
          }
        }
      }
    }
    return all;
  }

  this.assetHash = () => {
    let all = {};
    for (var quote in this.assets) {
      if (this.assets.hasOwnProperty(quote)) {
        if (!all[quote]) {
          all[quote] = [];
        }
        let q = this.assets[quote];
        for (var base in q) {
          if (q.hasOwnProperty(base)) {
            let b = q[base];
            for (var assetID in b) {
              if (b.hasOwnProperty(assetID)) {
                all[quote].push(b[assetID]);
              }
            }
          }
        }
      }
    }
    return all;
  }

  this.reduce = (lambda, init=0) => {
    const all = this.assetHash();
    let out = {};
    for (var quote in all) {
      if (all.hasOwnProperty(quote)) {
        out[quote] = all[quote].reduce(lambda, init);
      }
    }
    return out;
  }

  this.initialValue = () => {
    return this.reduce((mem, asset) => mem + asset.initialValue());
  }

  this.currentValue = () => {
    return this.reduce((mem, asset) => mem + asset.currentValue());
  }
}


module.exports = {
  Price: Price,
  Pair: Pair,
  Asset: Asset,
  Portfolio: Portfolio
}
