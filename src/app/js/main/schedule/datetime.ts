import { Moment } from "moment";

/**
 * DateTime or Date include timezone.
 */
export class DateTime {
    public readonly moment: Moment;
    public readonly hasTime: boolean;

    constructor(moment: Moment, hasTime: boolean = true) {
        this.moment = moment;
        this.hasTime = hasTime;
    }
}
