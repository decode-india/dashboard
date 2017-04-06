import "isomorphic-fetch";

import { Query } from "../models/query";
import { Source } from "../models/source";
import { User } from "../models/user";
import { remoteservice } from "./remote-service";

export namespace source {

    const SOURCE_URL: string = "https://source-api.bespoken.tools/v1/";
    const NAME_GENERATING_URL: string = SOURCE_URL + "sourceId";
    const LINK_URL: string = SOURCE_URL + "linkSource";

    export interface SourceName {
        id: string;
        secretKey: string;
    }

    export interface LinkResult {
        user: {
            userId: string;
        };
        source: Source;
    }

    /**
     * A function that will generate a unique source name.
     * @param id
     *      An id to check against.  If not provided, a random name will be supplied.
     */
    export function generateSourceId(id?: string): Promise<SourceName> {
        const query: Query = new Query();
        if (id) {
            query.add({ parameter: "id", value: id });
        }

        const finalURL = NAME_GENERATING_URL + "?" + query.query();

        return fetch(finalURL)
            .then(function (result: any) {
                return result.json();
            }).then(function (result: SourceName) {
                return result;
            });
    }

    /**
     * This service will link the source to the given user.  It will transfer ownership to this user if the
     * source is not already owned by a user.
     *
     * @param sourceName The name and ID of the source.
     */
    export function linkSource(sourceName: SourceName, user: User): Promise<LinkResult> {
        const query: Query = new Query();
        query.add({ parameter: "source", value: sourceName });
        query.add({ parameter: "user", value: { userId: user.userId } });

        console.info("linking");
        console.log(query.json());
        return fetch(LINK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: query.json()
        }).then(function (result: any) {
            console.log(result);
            if (result.status === 200) {
                return result.json();
            } else {
                return Promise.reject(new Error(result.statusText));
            }
        }).catch(function (err: Error) {
            console.error(err);
            throw err;
        });
    }

    export function createSource(source: Source, auth: remoteservice.auth.Auth = remoteservice.defaultService().auth(), db: remoteservice.database.Database = remoteservice.defaultService().database()): Promise<Source> {
        let user = auth.currentUser;
        let ref = db.ref();
        let sourcesPath = ref.child("sources");
        // Create a new mutable source from the source passed in
        const mutableSource: any = { ...{}, ...source };
        return generateSourceId(source.id)
            .then(function (idResult: SourceName) {
                mutableSource.id = idResult.id;
                mutableSource.secretKey = idResult.secretKey;
                mutableSource.members[user.uid] = "owner";
                return mutableSource;
            }).then(function (source: Source) {
                return sourcesPath.child(source.id).set(source)
                    .then(function () {
                        // Save the source to the user's list of sources
                        return ref.child("users").child(user.uid).child("sources").child(source.id).set("owner");
                    });
            }).then(function () {
                // And finally provide it back to the callback
                return mutableSource;
            });
    }

    export function deleteSource(source: Source, auth: remoteservice.auth.Auth = remoteservice.defaultService().auth(), db: remoteservice.database.Database = remoteservice.defaultService().database()): Promise<Source> {
        const user = auth.currentUser;
        const ref = db.ref();
        const key = source.id;

        // tslint:disable:no-null-keyword
        return ref.child("users").child(user.uid).child("sources").child(key).set(null).then(function () {
            return removeMembers(user.uid, source);
        });
        // tslint:enable:no-null-keyword
    }

    export function getSources(auth: remoteservice.auth.Auth = remoteservice.defaultService().auth(), db: remoteservice.database.Database = remoteservice.defaultService().database()): Promise<any> {
        let user = auth.currentUser;
        let ref = db.ref();
        return ref.child("/users/" + user.uid + "/sources").once("value");
    }

    export function getSourcesObj(auth: remoteservice.auth.Auth = remoteservice.defaultService().auth(), db: remoteservice.database.Database = remoteservice.defaultService().database()): Promise<Source[]> {
        let user = auth.currentUser;
        let ref = db.ref();

        return ref.child("/users/" + user.uid + "/sources").once("value")
            .then(function (retVal) {
                return (retVal.val()) ? Object.keys(retVal.val()) : [];
            }).then(function (keys: string[]) {
                let getPromises: Promise<Source>[] = [];
                for (let key of keys) {
                    getPromises.push(getSourceObj(key, db));
                }
                return Promise.all(getPromises);
            });
    }

    export function getSource(key: string, db: remoteservice.database.Database = remoteservice.defaultService().database()): Promise<any> {
        let ref = db.ref();
        return ref.child("/sources/" + key).once("value");
    }

    export function getSourceObj(key: string, db: remoteservice.database.Database = remoteservice.defaultService().database()): Promise<Source> {
        return getSource(key, db)
            .then(function (data) {
                let source: Source = new Source(data.val());
                return source;
            });
    }
}

export default source;

function removeMembers(memeberId: string, source: Source): Promise<Source> {
    return new Promise(function (resolve, reject) {
        const mutableSource: any = { ...{}, ...source };
        mutableSource.members[memeberId] = undefined;
        resolve(mutableSource);
    });
}