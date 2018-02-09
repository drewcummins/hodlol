'use strict';

const fs = require('fs');
const su = require('../../util/search');

class Serializer {
  constructor(props) {
    this.props = props;
  }

  out(tick) {
    return this.props.map((prop) => tick[prop]).join(",");
  }

  in(xs) {
    let x = {};
    xs.split(",").forEach((value, i) => {
      x[this.props[i]] = Number(value);
    });
    return x;
  }

  key(tick) {
    return tick["timestamp"];
  }
}

class TickerSerializer extends Serializer {
  constructor() {
    super(["timestamp", "high", "low", "bid", "bidVolume", "ask","askVolume", "vwap", "open", "close", "last", "change","baseVolume", "quoteVolume"]);
  }
}

class CandleSerializer extends Serializer {
  constructor() {
    super(["timestamp", "open", "high", "low", "close", "volume"]);
  }

  outCCXT(tick) {
    return [this.out(tick).split(",")];
  }
}

class OrderSerializer extends Serializer {
  constructor() {
    super(["id", "timestamp", "status", "symbol", "type", "side","price", "amount", "filled", "remaining"]);
  }

  key(tick) {
    return `${tick["timestamp"]}${tick["status"]}`;
  }
}



class Series {
  constructor(filepath, serializer, autoWrite=false) {
    this.filepath = filepath;
    this.serializer = serializer;
    this.autoWrite = autoWrite;
    this.data = {};
    this.series = [];
    this.lastWrite = 0;
  }

  range(timestampA, timestampB) {
    let [_, adx] = this.nearest(timestampA);
    let [_, bdx] = this.nearest(timestampB);
    if (adx != bdx) {
      return this.series.slice(adx, bdx);
    }
    return [adx];
  }

  nearest(timestamp) {
    return su.bnearest(this.series, timestamp, (x) => timestamp - x.timestamp);
  }

  append(x, lock=false) {
    let key = this.serializer.key(x);
    if (!this.data[key]) {
      // this does a clone of the object when we append it
      // which is necessary so that order filler can simply update orders
      this.data[key] = { ... x };
      this.series.push(x);
      if (this.autoWrite && !lock) this.write();
    }
  }

  write() {
    let str = "";
    let n = this.length() - 1;
    for (var i = this.lastWrite; i < n; i++) {
      str += this.serializer.out(this.series[i]) + "\n";
    }
    if (str.length > 0) {
      fs.appendFile(this.filepath, str, (err) => {
        if (err) throw err;
        this.lastWrite = n;
      });
    }
  }

  read() {
    console.log("Reading", this.filepath.split("/").pop());
    let file = fs.readFileSync(this.filepath, "utf8");
    file.split("\n").forEach((line) => {
      if (line.length > 0) {
        this.append(this.serializer.in(line));
      }
    });
  }

  transpose(props, a=0) {
    let transpose = {};
    let series = this.series;
    if (series.length > a) series = series.slice(-a);
    series.forEach((x) => {
      props.forEach((prop) => {
        if (!transpose[prop]) transpose[prop] = [];
        transpose[prop].push(x[prop]);
      });
    });
    return Object.values(transpose);
  }

  length() {
    return this.series.length;
  }

  last() {
    return this.series[this.series.length-1];
  }

  getAt(idx) {
    if (idx < 0) {
      idx = this.length() + idx;
    }
    return this.series[idx];
  }

  static FromTicker(ticker) {
    return new Series(ticker.filepath(), new TickerSerializer(), ticker.record);
  }

  static FromCandle(ticker) {
    return new Series(ticker.filepath(), new CandleSerializer(), ticker.record);
  }

  static FromOrder(ticker) {
    return new Series(ticker.filepath(), new OrderSerializer(), ticker.record);
  }
}

module.exports = Series;
