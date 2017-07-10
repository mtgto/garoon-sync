import Datastore = require("nedb");
import log from "./log";

/**
 * Persistent store for data model.
 */
export abstract class Store<Id, Entity extends { id: Id }, Serialized extends { _id: Id }> {
    protected readonly datastore: Datastore;

    abstract serializer: (entity: Entity) => Serialized;
    
    abstract deserializer: (obj: Serialized) => Entity;

    /**
     * @param datastorePath If datastorePath is undefined, create in memory database (for unit test).
     */
    constructor(datastorePath?: string) {
        if (datastorePath) {
            this.datastore = new Datastore({filename: datastorePath, autoload: true});
        } else {
            this.datastore = new Datastore({inMemoryOnly: true, autoload: true});
        }
    }

    readonly get = async (id: Id, deserializer: (obj: Serialized) => Entity = this.deserializer): Promise<Entity | undefined> => {
        return new Promise<Entity | undefined>((resolve, reject) => {
            this.datastore.findOne<Serialized>({_id: id}, (err: Error, obj: Serialized | null) => {
                if (err) {
                    const message = `Failed to find the entity with id ${id}`;
                    log.warn(message, err);
                    reject(new Error(message));
                } else {
                    if (obj) {
                        resolve(deserializer(obj));
                    } else {
                        // DO NOT USE null.
                        // See https://github.com/Microsoft/TypeScript/wiki/Coding-guidelines#null-and-undefined
                        resolve(undefined);
                    }
                }
            });
        });
    }

    readonly set = async (entity: Entity, serializer: (entity: Entity) => Serialized = this.serializer): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            this.datastore.update({_id: entity.id}, serializer(entity), {upsert: true}, (err: Error, numberOfUpdates: number, upsert: boolean) => {
                if (err) {
                    const message = `Failed to update the entity ${entity}`;
                    log.warn(message, err);
                    reject(new Error(message));
                } else {
                    resolve();
                }
            });
        });
    }
}
