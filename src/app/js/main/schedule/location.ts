import { IdValue } from "./id_value";

export class Location implements IdValue {
    public readonly id: string;
    public readonly displayName: string;

    constructor(id: string, displayName: string) {
        this.id = id;
        this.displayName = displayName;
    }
}
