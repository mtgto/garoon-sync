import {IdValue} from "./schedule";

export default class User implements IdValue {
    readonly id: string;
    readonly displayName: string;
    readonly email: string;
    
    constructor(id: string, displayName: string, email: string) {
        this.id = id;
        this.displayName= displayName;
        this.email = email;
    }
}
