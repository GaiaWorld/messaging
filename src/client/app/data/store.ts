/**
 * 数据存储
 */

// ============================================ 导入
import { HandlerMap } from '../../../pi/util/event';
import { depCopy } from "../../../utils/util";
import { GroupInfo, GroupUserLink } from "../../../server/data/db/group.s";
import { UserHistory, GroupHistory, AnnounceHistory, MsgLock } from "../../../server/data/db/message.s";
import { UserInfo, UserCredential, AccountGenerator, FriendLink, Contact } from "../../../server/data/db/user.s";
import { AddressInfo } from "../../../server/data/db/extra.s";

// ============================================ 导出


/**
 * 根据路径获取数据
 */
export const getStore = (path: string, defaultValue = undefined) => {
    let ret = store;
    for (const key of path.split('/')) {
        if (key in ret) {
            ret = ret[key];
        } 
        else if(ret instanceof Map){
            ret = ret.get(key);
        }
        else{
            // 路径中有和store内部不同的键，肯定是bug
            // tslint:disable-next-line:prefer-template
            throw new Error('getStore Failed, path = ' + path);
        }
    }

    return ret || defaultValue;
};

/**
 * 更新store并通知
 */
export const setStore = (path: string, data: any, notified = true) => {
    const path2value = (...args) => {
        let returnValue = <any>store
        for(let i = 0; i < args[0].length; i++){
            returnValue = returnValue[args[0][i]]
        }
        return returnValue
    }
    const keyArr = path.split('/');
    // 原有的最后一个键
    const lastKey = keyArr.pop();

    let parent = store;
    for (const key of keyArr) {
        if (key in parent) {
            parent = parent[key];
        } 
        else if (parent instanceof Map){
            parent = parent.get(key);
        }
        else {
            // 路径中有和store内部不同的键，肯定是bug
            // tslint:disable-next-line:prefer-template
            throw new Error('setStore Failed, path = ' + path);
        }
    }
    if(parent instanceof Map){
        parent.set(lastKey, data);
    }else{
        parent[lastKey] = data;
    }    
    /**
     * 写的不好，只能支持普通json和最后一层为map的情况，不支持map嵌套
     */
    if (notified) {
        handlerMap.notify(path, data);
        path = path.substring(0,path.lastIndexOf('/'));
        while(path.length > 0){
            handlerMap.notify(path, path2value(path.split('/')));
            path = path.substring(0,path.lastIndexOf('/'));
        }        
    }
    
};

/**
 * 注册监听特定的数据
 * @param keyName 
 * @param cb 
 */
export const register = (keyName: string, cb: Function): void => {
    handlerMap.add(keyName, <any>cb);
};

/**
 * 取消注册
 * @param keyName 
 * @param cb 
 */
export const unregister = (keyName: string, cb: Function): void => {
    handlerMap.remove(keyName, <any>cb);
};

/**
 * store初始化
 */
export const initStore = () => {

}

/**
 * Store的声明
 */
export interface Store {
    uid:number,
    groupInfoMap: Map<number, GroupInfo>,//gid
    groupUserLinkMap: Map<string, GroupUserLink>,//guid
    userHistoryMap: Map<string, UserHistory>,//hidinc
    groupHistoryMap: Map<string, GroupHistory>,//hidinc
    announceHistoryMap: Map<string, AnnounceHistory>,//aidinc
    msgLockMap: Map<number, MsgLock>,//LOCK
    userInfoMap: Map<number, UserInfo>,//uid
    userCredentialMap: Map<number, UserCredential>, //todo
    accountGeneratorMap: Map<string, AccountGenerator>,//todo
    friendLinkMap: Map<string, FriendLink>,//uuid
    contactMap: Map<number, Contact>,//uid
    addressInfoMap: Map<number, AddressInfo>//uid
    userChatMap:Map<number, Array<string>>//hid,hidinc,递增存储
    groupChatMap:Map<number, Array<string>>//hid,hidinc
    lastChat:Array<[number,number]>//gid|uid,time,前端自己生产的数组，每条信息都需要更新该表
    //其实time没啥意义，不一定是最近发信息的50条，比如有人离线了，很早就发送了信息，他的信息也会出现在这里
}

// ============================================ 本地

// 本质上是主键
type KeyName = MapName;
export type MapName = "groupInfoMap" | "groupUserLinkMap" | "userHistoryMap" | "groupHistoryMap" | "announceHistoryMap" | "msgLockMap" | "userInfoMap" | "userCredentialMap" | "accountGeneratorMap" | "friendLinkMap" | "contactMap" | "addressInfoMap";

const store = <Store>{
    uid:null,
    groupInfoMap: new Map(),
    groupUserLinkMap: new Map(),
    userHistoryMap: new Map(),
    groupHistoryMap: new Map(),
    announceHistoryMap: new Map(),
    msgLockMap: new Map(),
    userInfoMap: new Map(),
    userCredentialMap: new Map(), 
    accountGeneratorMap: new Map(),
    friendLinkMap: new Map(),
    contactMap: new Map(),
    addressInfoMap: new Map(),
    userChatMap:new Map,
    groupChatMap:new Map,
    lastChat:[]
}
// ============================================ 可执行
const handlerMap: HandlerMap = new HandlerMap();