import { Moment } from "moment";

/**
 * タイムゾーン、日時を表す. 時間は省略可能.
 */
export class DateTime {
    readonly moment: Moment;
    readonly hasTime: boolean;

    constructor(moment: Moment, hasTime: boolean = true) {
        this.moment = moment;
        this.hasTime = hasTime;
    }
}
