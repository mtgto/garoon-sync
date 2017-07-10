import test from "ava";
import User from "../../../app/js/main/user";
import {UserStore} from "../../../app/js/main/user-store";

test("user store can store and load users", async t => {
    const store = new UserStore();
    const userId = "123";
    let user = new User(userId, "Foobar", "foobar@example.com");
    // Before store, there is no user in store.
    t.falsy(await store.get(userId));
    // Store
    await store.set(user);
    t.deepEqual(await store.get(userId), user);
    // Change name
    user = new User(userId, "HogeFuga", "hogefuga@example.com");
    await store.set(user);
    t.deepEqual(await store.get(userId), user);
});
