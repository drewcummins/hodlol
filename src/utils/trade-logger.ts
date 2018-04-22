const human = require("debug")("trade-activity-human");

/**
 * Trade logger is just a static api to an instance of the logger
 * that we can use for now to log/grep just trade activity
 */
export class TradeLogger {
    public static logTradeEvent(name:string, ...args:any[]){
        //log serialization can be expensive, so only do it when enabled
        if (human.enabled){
            const readables = TradeLogger.convertReadables(args);
            human(name, ...readables);
        }
    }
    public static convertReadables(input:any[]){
        return input.map((arg) => {
            if (arg && typeof arg.readable === "function"){
                return JSON.stringify(arg.readable(), null, "\t");
            }
            else if (typeof arg !== "string"){
                return JSON.stringify(arg, null, "\t");
            }
            else {
                return arg;
            }
        });
    }
}
