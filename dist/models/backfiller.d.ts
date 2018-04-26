import { TraderJSON, TraderParams } from "./trader";
export declare class Backfiller {
    readonly trader: TraderJSON;
    readonly params: TraderParams;
    constructor(trader: TraderJSON, params: TraderParams);
    run(name: string, start: number, end: number): Promise<string>;
}
