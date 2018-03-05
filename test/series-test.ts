import { Series, OHLCVSerializer, OrderSerializer } from '../src/models/series';
import { Num, BN, OHLCV, OHLCVTick, Scenario } from '../src/models/types';
import { sleep, Thread } from '../src/utils';
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

  before(() => {
    removeSeriesFile(filepath);
    Scenario.createWithName("lol", 0, 0);
  });
  
  after(() => {
    Thread.killAll();
    removeSeriesFile(filepath);
    Scenario.kill();
  });

  let candles = new Series(filepath, new OHLCVSerializer());
  it('should have expected init candle values', () => {
    expect(candles.filepath).to.equal(filepath);
    expect(candles.length()).to.equal(0);
    expect(candles.last()).to.be.undefined;
    expect(candles.getAt(-3)).to.be.undefined;
  });

  const timestamp:number = +new Date();

  let [tick0, tick1] = [
    new OHLCV(Object.assign([timestamp, 5, 10, 2, 7, 100], {timestamp:timestamp}) as OHLCVTick),
    new OHLCV(Object.assign([timestamp + 5, 7, 11, 4, 8, 200], {timestamp:timestamp + 5}) as OHLCVTick)
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

  let reader = new Series(filepath, new OHLCVSerializer());

  it('should read the series file', () => {
    reader.read();
    // for reasons to do with the uselessness of the most recent candlestick data
    // the series file is always one behind the in-memory series
    expect(reader.length()).to.equal(1);
    expect(reader.last()).to.eql(tick0);
  });

  it('should find closest ticks for given timestamps', () => {
    let [tick2, tick3] = [
      new OHLCV(Object.assign([timestamp + 8, tick1.close, 10, 2, 7, 100], {timestamp:timestamp + 8}) as OHLCVTick),
      new OHLCV(Object.assign([timestamp + 10, 7, 11, 4, 8, 200], {timestamp:timestamp + 10}) as OHLCVTick)
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