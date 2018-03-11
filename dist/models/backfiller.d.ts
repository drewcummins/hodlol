import { TraderJSON } from "./trader";
export declare class Backfiller {
    readonly trader: TraderJSON;
    constructor(trader: TraderJSON);
    run(name: string, start: number, end: number): Promise<string>;
}
