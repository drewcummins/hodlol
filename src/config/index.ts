import { BitfieldState } from "../models/types";

require('dotenv').config({path: `./env/${process.env.NODE_ENV}.env`});

export const config = {
  binanceAPIKey: process.env.BINANCE_API_KEY,
  binanceAPISecret: process.env.BINANCE_API_SECRET,
  state: new BitfieldState()
};