"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../models/types");
require('dotenv').config({ path: `./env/${process.env.NODE_ENV}.env` });
exports.config = {
    binanceAPIKey: process.env.BINANCE_API_KEY,
    binanceAPISecret: process.env.BINANCE_API_SECRET,
    state: new types_1.BitfieldState()
};
//# sourceMappingURL=index.js.map