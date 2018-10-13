/**
 * wrappers for db operations (CRUD)
 */

import { read, write, query, alter, modify, iterDb } from "../pi_pt/db";
import { Tr } from "../pi_pt/rust/pi_db/mgr";
import { TabMeta } from "../pi/struct/sinfo";
import { Mgr } from "../pi_pt/rust/pi_db/mgr";

type DbType = "memory" | "file";

const createBucket = (dbType: DbType, bucketName: string, bucketMetaInfo: TabMeta, dbMgr: Mgr): Bucket => {
    try {
        write(dbMgr, (tr: Tr) => {
            alter(tr, dbType, bucketName, bucketMetaInfo);
        });

    } catch(e) {
        console.log("create bucket failed with error: ", e);
        throw new Error("Create bucket failed");
    }

    return new Bucket(dbType, bucketName, bucketMetaInfo, dbMgr);
}

export const createPersistBucket = (bucketName: string, bucketMetaInfo: TabMeta, dbMgr: Mgr): Bucket => {
    return createBucket("file", bucketName, bucketMetaInfo, dbMgr);
}

export const createMemoryBucket = (bucketName: string, bucketMetaInfo: TabMeta, dbMgr: Mgr): Bucket => {
    return createBucket("memory", bucketName, bucketMetaInfo, dbMgr);
}

class Bucket {

    private bucketName: string;
    private dbType: DbType;
    private dbManager: any;
    private tabMeta: TabMeta;

    constructor(dbType: DbType, bucketName: string, bucketMetaInfo: TabMeta, dbMgr: Mgr) {
        this.bucketName = bucketName;
        this.dbType = dbType;
        this.tabMeta = bucketMetaInfo;
        this.dbManager = dbMgr;
    }

    get<K, V>(key: K, timeout: number = 1000): V {
        let value: any;

        try {
            read(this.dbManager, (tr: Tr) => {
                value = query(tr, [{ware: this.dbType, tab: this.bucketName, key: key}], timeout, false);
            });
        } catch(e) {
            console.log("read key from bucket failed with error: ", e);
        }

        return value[0].value ? value[0].value : undefined;
    }

    put<K, V>(key: K, value: V, timeout: number = 1000): boolean {
        try {
            write(this.dbManager, (tr: Tr) => {
                modify(tr, [{ware: this.dbType, tab: this.bucketName, key: key, value: value}], timeout, false);
            });

            return true;
        } catch(e) {
            console.log("failed to write key with error: ", e);
        }

        return false;
    }

    update<K, V>(key: K, value: V, timeout: number = 1000): boolean {
        if(this.get<K, V>(key) === undefined) {
            return false;
        }

        return this.put<K, V>(key, value, timeout);
    }

    delete<K>(key: K, timeout: number = 1000): boolean {
        if(this.get<K, any>(key) === undefined) {
            return false;
        }
        try {
            write(this.dbManager, (tr: Tr) => {
                modify(tr, [{ware: this.dbType, tab: this.bucketName, key: key}], timeout, false);
            });

            return true;
        } catch(e) {
            console.log("failed to delete key with error: ", e);
        }

        return false;
    }
}