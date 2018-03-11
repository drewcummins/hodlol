/// <reference types="node" />
export declare function sleep(ms: number): Promise<NodeJS.Timer>;
export declare type Compare = (candidate: any) => number;
export interface IState {
    min: number;
    max: number;
    nearest: any;
    nearIdx: number;
    nearDist: number;
}
export declare type State = IState | undefined;
export declare function bnearest(list: Array<any>, value: number, compare: Compare, state?: State): [any, number];
export declare function formatTimestamp(time: number): any;
export declare class Thread {
    private static threads;
    private running;
    private id;
    private cycles;
    constructor();
    sleep(time: number): Promise<void>;
    hasCycled(period: number): boolean;
    kill(): Promise<void>;
    isRunning(): boolean;
    static killAll(): void;
}
