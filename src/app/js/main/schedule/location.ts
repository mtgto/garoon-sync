import { IdValue } from "./id_value";

export class Location implements IdValue {
    readonly id: string;
    readonly displayName: string;

    constructor(id: string, displayName: string) {
        this.id = id;
        this.displayName = displayName;
    }
}
