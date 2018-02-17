import { Series, CandleSerializer, OrderSerializer } from '../src/models/series';
import { Num, BN } from '../src/models/types';
import { sleep } from '../src/utils';
import { expect } from 'chai';
import 'mocha';
import * as fs from "fs";

function removeSeriesFile(filepath) {
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}

describe('Series tests', async () => {
  const filepath = "./rofl.csv";

  before(removeSeriesFile.bind(null, filepath));
  after(removeSeriesFile.bind(null, filepath));

  let candles = new Series(filepath, new CandleSerializer());
  it('should have expected init candle values', () => {
    expect(candles.filepath).to.equal(filepath);
    expect(candles.autowrite).to.equal(false);
    expect(candles.length()).to.equal(0);
    expect(candles.last()).to.be.undefined;
    expect(candles.getAt(-3)).to.be.undefined;
  });

  let [tick0, tick1] = [
    {"timestamp": +new Date(), "open": 5, "high": 10, "low": 2, "close": 7, "volume": 100},
    {"timestamp": +new Date() + 5, "open": 7, "high": 11, "low": 4, "close": 8, "volume": 200}
  ];

  it('should add tick to candles', () => {
    candles.append(tick0);
    candles.append(tick1);
    expect(candles.length()).to.equal(2);
    expect(candles.last()).to.equal(tick1);
    expect(candles.getAt(0)).to.equal(tick0);
    expect(candles.getAt(-1)).to.equal(tick1);
  });

  it('should get expected transpose', () => {
    let transpose:Number[][] = candles.transpose(["open", "high", "volume"]);
    expect(transpose).to.exist;
    expect(transpose.length).to.equal(3); // 3 properties
    expect(transpose[0].length).to.equal(2); // 2 ticks
    expect(transpose[1].length).to.equal(2); // 2 ticks
    expect(transpose[2].length).to.equal(2); // 2 ticks
    expect(transpose[0][0]).to.equal(tick0.open);
    expect(transpose[0][1]).to.equal(tick1.open);
    expect(transpose[1][0]).to.equal(tick0.high);
    expect(transpose[1][1]).to.equal(tick1.high);
    expect(transpose[2][0]).to.equal(tick0.volume);
    expect(transpose[2][1]).to.equal(tick1.volume);
  })

  it('should write series to file', async () => {
    candles.write();
    await sleep(10); // write happens asynchronously, so take a beat
    expect(fs.existsSync(filepath)).to.be.true;
  })

  let reader = new Series(filepath, new CandleSerializer());

  it('should read the series file', () => {
    reader.read();
    // for reasons to do with the uselessness of the most recent candlestick data
    // the series file is always one behind the in-memory series
    expect(reader.length()).to.equal(1);
    expect(reader.last()).to.eql(tick0);
  });

  it('should find closest ticks for given timestamps', () => {
    let [tick2, tick3] = [
      {"timestamp": tick1.timestamp+3, "open": tick1.close, "high": 10, "low": 2, "close": 10, "volume": 100},
      {"timestamp": tick1.timestamp+5, "open": 10, "high": 11, "low": 4, "close": 8, "volume": 200}
    ];
    candles.append(tick2);
    candles.append(tick3);
    let [nearest,idx] = candles.nearest(tick1.timestamp);
    expect(nearest).to.equal(tick1);
    expect(idx).to.equal(1);
    [nearest,idx] = candles.nearest(tick1.timestamp+1);
    expect(nearest).to.equal(tick1);
    expect(idx).to.equal(1);
    [nearest,idx] = candles.nearest(tick1.timestamp+2);
    expect(nearest).to.equal(tick2);
    expect(idx).to.equal(2);
    [nearest,idx] = candles.nearest(tick0.timestamp-100);
    expect(nearest).to.equal(tick0);
    expect(idx).to.equal(0);
    [nearest,idx] = candles.nearest(tick3.timestamp+100);
    expect(nearest).to.equal(tick3);
    expect(idx).to.equal(3);
  });
});