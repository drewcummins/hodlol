# hodlol
Algo trading platform for cryptocurrencies


### Getting Setup
1. Clone the repo.
1. [Verify the commit you've checked out](#full-paranoia-verification) (optional).
1. Run `npm install`.
1. Setup your binance API key/secret by duplicating `env/dev.example.env` to `env/dev.env` and filling in appropriately.
1. Run `npm run test-dev`. If all the tests pass, you should be good!
1. If you'd like to test order creation against Binance (an extra 2 or 3 tests), set `TEST_LIVE=1` on your environment and rerun the tests.
1. [Run a trader](#running-a-trader)


### Conceptual Model
The whole of hodlol is modeled around the idea of a _trader_. A trader implements any number of _strategies_ on a given exchange. A trader is described by a `.trader` JSON file:

```javascript
{
  "name": "dummy",
  "exchange": "binance",
  "strategies": [
    {
      "fileName": "hodl",
      "className": "HODL",
      "weight": 1
    }
  ],
  "tickers": [
    "ETH/BTC", "BTC/USDT"
  ]
}
```

This trader implements a hold strategy on Binance. The `tickers` indicate which markets to follow. Hodlol pulls all the data you want to track in the background and gives you the most recent data as it becomes available.

Now this is obviously a pretty uninteresting trader. Let's look at a slightly more involved trader (`dummy-lite.trader` in the `traders` directory):

```javascript
{
  "name": "dummy",
  "exchange": "binance",
  "strategies": [
    {
      "fileName": "index",
      "className": "Strategy",
      "title": "Jumpy",
      "weight": 1,
      "indicators": [
        { 
          "fileName": "threshold", 
          "className": "Threshold", 
          "threshold": 0.001 
        }
      ]
    },
    {
      "fileName": "hodl",
      "className": "HODL",
      "weight": 1
    }
  ],
  "tickers": [
    "ETH/BTC", "BTC/USDT"
  ]
}

```

The only thing that changes between this and the hodl strategy is the name and inclusion of an additional strategy. Let's look at it:

```javascript
{
  "fileName": "index",
  "className": "Strategy",
  "title": "Jumpy",
  "weight": 1,
  "indicators": [
    { 
      "fileName": "threshold", 
      "className": "Threshold", 
      "threshold": 0.001 
    }
  ]
}
```
So the first 2 lines are the file and class name properties. These are hopefully self-explanatory as the whole idea is to make writing new strategies quick and easy. The `fileName` tells where in the strategy directory the file is located. The `className` indicates the name of the `Strategy` or `Strategy` subclass.

After that, we give it a title which is just for display purposes.

The next field is `weight`. You can think of this parameter as describing parts in a strategy cocktail--in this case each strategy will get to handle _half_ the total funds allocated to the trader since there are 2 of them, each staking one part.

Whenever a new tick gets pulled in, or an order status changes, each strategy will automatically have its `tick` method called. By default, a strategy will then call `tick` on all its indicators. Indicators emit buy/pass/sell signals according to the current price data. If a strategy chooses to react to a buy or sell signal, it requests that the trader places an order. The default trader will do this provided sufficient funds exist.

Indicators can be added to the vanilla strategy class via its `indicators` field. In our example, we add one indicator strategy, which looks for a change between the previous and current price data. If it exceeds some threshold down, it issues a buy signal. Likewise, if it exceeds some threshold up, it issues a sell signal. Here's what that looks like in practice:

```typescript
public async evaluate(ticker:OHLCVTicker):Promise<Signal> {
    // we need at least 2 data points to look at whether we jumped or not
    if (ticker.length() > 1) {
      let prev:OHLCV = ticker.getAt(-2);
      let curr:OHLCV = ticker.getAt(-1);
      let phi:number = curr.close/prev.close;
      if (phi - 1 > this.threshold) {
        return Signal.SELL;
      } else if (1 - phi > this.threshold) {
        return Signal.BUY;
      }
    }
    return Signal.PASS;
  }
```

`OHLCV` stands for "open-high-low-close-volume", also known as candlesticks. We're looking at the close price of the past 2 time periods.

#### Quick Review
Indicators emit buy or sell _signals_. Strategies react to those signals by suggesting a trader buy or sell accordingly. Traders have the final say and respond to those strategies.

### Running A Trader
To run a trader, you simply point to your `.trader` file and indicate which and how much funds to give it access to. For instance, if you have half a Bitcoin you'd like to trade with, you'd run:

    npm run dev -- my.trader --symbol BTC --amount 0.5

### Backtesting
Running a trader and placing live trades should be _absolute last_ thing you do. Hodlol is all about backtesting.

#### Running A Backtest
Running a backtest is done exactly like running a regular trader, but adding the backtest flag:

    npm run dev -- my.trader --symbol BTC --amount 0.5 -b

This will ask you to put in the date range you'd like to grab data for. The `Backfiller` will then go and download the necessary OHLCV data to run the backtest, save a scenario file for future use, and run your trader against this data, mocking all orders and balances.

To test against this with a different trader, simply point the backtest flag at the newly generates scenario file:

    npm run dev -- another.trader --symbol BTC --amount 0.5 -b scenarios/my.scenario

### Full Paranoia Verification
Since hodlol accesses sensitive shit like your _money_, it's fair to be cautious around the sanctity of the code. If there end up being more contributors, you should make sure the commit you're checking out is verified by me/someone you trust. Github puts a little "verified" flag on all such commits; you can also verify a commit locally with `git verify-commit <commit>`.

However, if you want to go full paranoid nutter, you should find my public key on a keyserver like https://pgp.mit.edu and verify that the commit you checked out is, in fact, authentic. You do this by finding `HEAD` in your `.git` directory and splitting out the signature and commit into separate files, then running `gpg --verify commit.sig commit` once you've added my public key to your keyring. This should be about as secure as you can be, assuming you trust me.

### Future Work
* Add in and generalize order books, trades and vanilla ticker into the exchange feed
* Add real mocking in for tests
* Add in fees (this is tricky with CCXT)
* Test more exchanges
* Write some basic strategies
* Portfolio renormalization (this is tricky)
