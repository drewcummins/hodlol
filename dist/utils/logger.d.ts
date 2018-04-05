/**
 * Private API - testing only
 * Logger uses the debug library https://github.com/visionmedia/debug
 * to make a logger that can be toggled by the DEBUG env variable
 * but has a smart default labeling of the current module/file
 * that required the logger.
 *
 * Don't use this in code, as it has an open constructor allowing
 * for spy/mock injection. Use LoggerApi instead.
 */
export declare class Logger {
    private infoDebugApi;
    private errorDebugApi;
    constructor(debugFactory: Function, parent?: string, label?: string);
    /**
     * Uses the requiring module as debug output
     * line label
     */
    private defaultLogLineLabel(parent);
    /**
     * Converts a file path like /a/b/c/d/e.js to a line we
     * can use as a log prefix: /a/b/c/d/e
     * @param {string} input
     * @returns {string}
     */
    private pathToPrettyLogline(input);
    /**
     * Emits a log line
     * @param args
     */
    info(...args: any[]): void;
    /**
     * Emits a log line prefixed with [error]
     * which can be globally listened for using
     * the env var Debug=[error] across all
     * logging modules
     * @param args
     */
    error(...args: any[]): void;
    /**
     * Emits a log line prefixed with [error]
     * which can be globally listened for using
     * the env var Debug=[error] across all
     * logging modules and will THROW an error
     * using the message from param 1 to the api
     * @param args
     */
    fatal(...args: any[]): void;
}
/**
 * PUBLIC Api
 * This class is basically Logger but hides
 * the injectable debug api. Logger is exposed
 * for easier testing
 */
export declare class LoggerApi extends Logger {
    constructor(lineLabel?: string);
}
