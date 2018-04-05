"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
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
class Logger {
    constructor(debugFactory, parent, label) {
        if (parent === undefined && label === undefined) {
            throw new Error("fatal: Logger needs a parent path of label override as a debug category");
        }
        const lineLabel = label === undefined ?
            this.defaultLogLineLabel(parent) : label;
        this.errorDebugApi = debugFactory(`${lineLabel}:ERROR`);
        this.infoDebugApi = debugFactory(lineLabel);
    }
    /**
     * Uses the requiring module as debug output
     * line label
     */
    defaultLogLineLabel(parent) {
        return this.pathToPrettyLogline(parent);
    }
    /**
     * Converts a file path like /a/b/c/d/e.js to a line we
     * can use as a log prefix: /a/b/c/d/e
     * @param {string} input
     * @returns {string}
     */
    pathToPrettyLogline(input) {
        const tokens = path.parse(input);
        return path.join(tokens.dir, tokens.name);
    }
    /**
     * Emits a log line
     * @param args
     */
    info(...args) {
        this.infoDebugApi(...args);
    }
    /**
     * Emits a log line prefixed with [error]
     * which can be globally listened for using
     * the env var Debug=[error] across all
     * logging modules
     * @param args
     */
    error(...args) {
        this.errorDebugApi(...args);
    }
    /**
     * Emits a log line prefixed with [error]
     * which can be globally listened for using
     * the env var Debug=[error] across all
     * logging modules and will THROW an error
     * using the message from param 1 to the api
     * @param args
     */
    fatal(...args) {
        this.errorDebugApi(...args);
        throw new Error(args[0]);
    }
}
exports.Logger = Logger;
/**
 * PUBLIC Api
 * This class is basically Logger but hides
 * the injectable debug api. Logger is exposed
 * for easier testing
 */
class LoggerApi extends Logger {
    constructor(lineLabel) {
        const trimmedPath = module.parent.filename
            .replace(process.cwd(), "")
            .replace("/dist/", "");
        super(require("debug"), trimmedPath, lineLabel);
    }
}
exports.LoggerApi = LoggerApi;
//# sourceMappingURL=logger.js.map