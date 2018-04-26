/**
 * Trade logger is just a static api to an instance of the logger
 * that we can use for now to log/grep just trade activity
 */
export declare class TradeLogger {
    static logTradeEvent(name: string, ...args: any[]): void;
    static convertReadables(input: any[]): string[];
}
