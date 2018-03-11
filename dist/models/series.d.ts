import { OHLCV, TTicker, Order, Element } from "./types";
export declare class Serializer<T extends Element> {
    protected properties(tick: T): any[];
    /**
     * Converts a JSON tick response to CSV for recording.
     *
     * @param tick tick data to serialize to CSV format
     *
     * @returns CSV string
     */
    toCSV(tick: T): string;
    /**
     * Converts a CSV string to Tick hash
     *
     * @param csv CSV string to convert to Tick
     *
     * @returns Tick
     */
    fromCSV(csv: string): T;
}
export declare class TickerSerializer extends Serializer<TTicker> {
    protected properties(tick: TTicker): any[];
    /**
     * Converts a CSV string to TickerTick
     *
     * @param csv CSV string to convert to Tick
     *
     * @returns TickerTick
     */
    fromCSV(csv: string): TTicker;
}
export declare class OHLCVSerializer extends Serializer<OHLCV> {
    protected properties(tick: OHLCV): any[];
    /**
     * Converts a CSV string to OHLCVTick
     *
     * @param csv CSV string to convert to Tick
     *
     * @returns OHLCVTick
     */
    fromCSV(csv: string): OHLCV;
}
export declare class OrderSerializer extends Serializer<Order> {
    protected properties(tick: Order): any[];
    /**
     * Converts a CSV string to OHLCVTick
     *
     * @param csv CSV string to convert to Tick
     *
     * @returns OHLCVTick
     */
    fromCSV(csv: string): Order;
}
export declare class Series<T extends Element> {
    readonly filepath: string;
    readonly serializer: Serializer<T>;
    private map;
    private list;
    private lastWrite;
    constructor(filepath: string, serializer: Serializer<T>);
    /**
     * Gets the current length of the series
    */
    length(): number;
    /**
     * Grabs the last tick
     *
     * @returns the last tick
    */
    last(): T;
    /**
     * Gets the tick at the given index
     *
     * If the index is less than zero, it will offset the index from the end of the series
     *
     * e.g. series.getAt(-1) returns the penultimate tick
     *
     * @param idx index to get tick at
     */
    getAt(idx: number): T;
    /**
     * Appends a tick to the series
     *
     * @param tick tick to add to series
     * @param lock whether to ignore autowrite regardless
     */
    append(tick: T, lock?: boolean): void;
    /**
     * Appends a tick in CSV format to the series
     *
     * @param tick tick to add to series
     * @param lock whether to ignore autowrite regardless
     */
    appendFromCSV(csv: string, lock?: boolean): void;
    /**
     * Transforms a list of Tick objects into an ordered list of given values.
     * This is useful for passing to indicator functions.
     *
     * e.g. Assume series.list = [{x:1, y:2}, {x:3, y:5}].
     * then: series.transpose(['x', 'y']) returns [[1,3],[2,5]]
     *
     * @param props properties to transpose
     * @param tail how much of the tail to grab. Defaults to entire list
     *
     * @returns the requested values
     */
    transpose(props: string[], tail?: number): Number[][];
    /**
     * Finds the closest tick to the given timestamp
     *
     * @param timestamp Timestamp to find closest tick to
     *
     * @returns tuple of closest tick and that tick's index in the list
     */
    nearest(timestamp: number): [T, number];
    /**
     * Writes the series to disk by appending to file
    */
    write(): void;
    /**
     * Reads series from file--this only applies to mocking
    */
    read(): void;
}
