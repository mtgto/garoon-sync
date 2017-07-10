import {Map, Set} from "immutable";
import User from "./user";
import {Store} from "./store";

/**
 * User data structure for nedb.
 */
interface StoredUser {
    readonly _id: string;
    readonly payload: User;
}

/**
 * Persistent store for user.
 */
export class UserStore extends Store<string, User, StoredUser> {
    /**
     * @param datastorePath If datastorePath is undefined, create in memory database (for unit test).
     */
    constructor(datastorePath?: string) {
        super(datastorePath);
    }

    getByIds = async (ids: Set<string>, deserializer: (storedUser: StoredUser) => User = this.deserializer): Promise<Map<string, User>> => {
        return Promise.resolve(Map<string, User>());
    }

    serializer = (user: User): StoredUser => {
        return { _id: user.id, payload: user } as StoredUser;
    }

    deserializer = (obj: StoredUser): User => {
        return new User(obj._id, obj.payload.displayName, obj.payload.email);
    }
}
