/**
 * 获取客户的基本信息
 * 后端不应该相信前端发送的uid信息，应该自己从会话中获取
 */
// ================================================================= 导入
import { Contact, Uuid, FriendLink, UserInfo, UserCredential, AccountGenerator } from "../db/user.s";
import { LoginReq, LoginReply, GetFriendLinksReq, GetContactReq, Result, UserInfoSet, MessageFragment, AnnouceFragment, UserArray, GroupArray, FriendLinkArray, GroupHistoryArray, UserHistoryArray, AnnounceHistoryArray, GroupUserLinkArray, UserRegister, GetUserInfoReq, GetGroupInfoReq } from "./basic.s";
import { GroupHistory, GroupMsg, HIncId, AIncId } from "../db/message.s";
import { Guid, GroupInfo, GroupUserLink } from "../db/group.s";

import { Bucket } from "../../../utils/db";
import { getEnv } from '../../../pi_pt/net/rpc_server';
import { ServerNode } from '../../../pi_pt/rust/mqtt/server';
import { ab2hex } from '../../../pi/util/util';
import { BonBuffer } from '../../../pi/util/bon';
import { setMqttTopic } from '../../../pi_pt/rust/pi_serv/js_net';
import { WARE_NAME } from "../constant";

import { setMqttTopic, mqttPublish, QoS } from "../../../pi_pt/rust/pi_serv/js_net";
import { ServerNode } from "../../../pi_pt/rust/mqtt/server";

// ================================================================= 导出
/**
 * 用户注册
 * @param registerInfo
 */
//#[rpc=rpcServer]
export const registerUser = (registerInfo: UserRegister): UserInfo => {
    const dbMgr = getEnv().getDbMgr();
    const userInfoBucket = new Bucket("file", "server/data/db/user.UserInfo", dbMgr);
    const userCredentialBucket = new Bucket("file", "server/data/db/user.UserCredential", dbMgr);
    const accountGeneratorBucket = new Bucket("file", "server/data/db/user.AccountGenerator", dbMgr);

    let userInfo = new UserInfo();
    let userCredential = new UserCredential();

    userInfo.name = registerInfo.name;
    userInfo.note = "Talk is cheap, show me the code!";
    userInfo.tel = "13912113456";

    let accountGenerator = new AccountGenerator();
    let nextAccount = accountGeneratorBucket.get("index")[0].nextIndex + 1;
    accountGenerator.nextIndex = nextAccount;
    accountGeneratorBucket.put("index", accountGenerator);

    // FBI warning: if the struct has a field with integer type, you must explicit specify it, wtf
    userInfo.uid = nextAccount;
    userInfo.sex = 1;

    userCredential.uid = userInfo.uid;
    userCredential.passwdHash = registerInfo.passwdHash;

    userInfoBucket.put(userInfo.uid, userInfo);
    // TODO: check potential error
    userCredentialBucket.put(userInfo.uid, userCredential);


    return userInfo;
}

//#[rpc=rpcServer]
export const login = (loginReq: LoginReq): LoginReply => {
    const dbMgr = getEnv().getDbMgr();
    const userCredentialBucket = new Bucket("file", "server/data/db/user.UserCredential", dbMgr);

    let uid = loginReq.uid;
    let passwdHash = loginReq.passwdHash;
    let expectedPasswdHash = userCredentialBucket.get(uid);

    let loginReply = new LoginReply();

    if (expectedPasswdHash[0] === undefined) {
        loginReply.status = 0;
        return loginReply;
    }

    // FIXME: constant time equality check
    if (passwdHash === expectedPasswdHash[0].passwdHash) {
        loginReply.status = 1;
        let mqttServer = getEnv().getNativeObject<ServerNode>("mqttServer");
        let uid = loginReq.uid;
        setMqttTopic(mqttServer, uid.toString(), true, true);
    } else {
        loginReply.status = 0;
    }

    return loginReply;
}


/**
 * 获取用户基本信息
 *
 * @param uid
 */
//#[rpc=rpcServer]
export const getUsersInfo = (getUserInfoReq: GetUserInfoReq): UserArray => {
    const dbMgr = getEnv().getDbMgr();
    const userInfoBucket = new Bucket("file", "server/data/db/user.UserInfo", dbMgr);

    let uids = getUserInfoReq.uids;
    let values: any = userInfoBucket.get(uids);

    //FIXME: check if `values` have undefined element, or will crash
    let res = new UserArray();
    res.arr = values;

    return res;
}

/**
 * 获取群组基本信息
 * @param uid
 */
//#[rpc=rpcServer]
export const getGroupsInfo = (getGroupInfoReq: GetGroupInfoReq): GroupArray => {
    const dbMgr = getEnv().getDbMgr();
    const groupInfoBucket = new Bucket("file", "server/data/db/user.GroupInfo", dbMgr);

    let gids = getGroupInfoReq.gids;
    let values: any = groupInfoBucket.get(gids);

    let res = new GroupArray();
    res.arr = values;

    return res;
}

/**
 * 设置用户基本信息
 * @param param
 */
//#[rpc=rpcServer]
export const setUserInfo = (param: UserInfoSet): Result => {

    return
}


/**
 * 获取联系人信息
 * @param uid
 */
//#[rpc=rpcServer]
export const getContact = (getContactReq: GetContactReq): Contact => {
    const dbMgr = getEnv().getDbMgr();
    const contactBucket = new Bucket("file", "server/data/db/user.Contact", dbMgr);

    let uid = getContactReq.uid;
    let value = contactBucket.get<number, Contact>(uid);

    return value;
}

/**
 * 获取好友别名和历史记录
 * @param uuidArr
 */
//#[rpc=rpcServer]
export const getFriendLinks = (getFriendLinksReq: GetFriendLinksReq): FriendLinkArray => {
    const dbMgr = getEnv().getDbMgr();
    const friendLinkBucket = new Bucket("file", "server/data/db/user.FriendLink", dbMgr);

    let uuids = getFriendLinksReq.uuid;
    let values: FriendLinkArray = friendLinkBucket.get(uuids);

    return values;
}

/**
 * 获取好友别名和历史记录id
 * @param uuidArr
 */
//#[rpc=rpcServer]
export const getGroupUserLinks = (uuidArr: Guid): GroupUserLinkArray => {
    const dbMgr = getEnv().getDbMgr();
    const groupInfoBucket = new Bucket("file", "server/data/db/group.GroupInfo", dbMgr);

    let groupInfo = groupInfoBucket.get<Guid, GroupInfo>(uuidArr);
    let groupUserLink = new GroupUserLink();
    // TODO: fill more fields

    return;
}

/**
 * 获取群组聊天的历史记录
 * @param hid
 */
//#[rpc=rpcServer]
export const getGroupHistory = (param: MessageFragment): GroupHistoryArray => {
    const dbMgr = getEnv().getDbMgr();
    const groupHistoryBucket = new Bucket("file", "server/data/db/message.GroupHistory", dbMgr);

    let hincId = new HIncId();
    let groupHistoryArray = new GroupHistoryArray();

    for (let i = 0; i < param.size; i++) {
        hincId.hid = param.hid;
        hincId.index = param.from + i;
        // FIXME: i don't know if the master key works
        let msg = groupHistoryBucket.get(hincId)[0].msg;
        groupHistoryArray.arr.push(msg);
    }

    return groupHistoryArray;
}


/**
 * 获取单聊的历史记录
 * @param hid
 */
//#[rpc=rpcServer]
export const getUserHistory = (param: MessageFragment): UserHistoryArray => {
    const dbMgr = getEnv().getDbMgr();
    const userHistoryBucket = new Bucket("file", "server/data/db/message.UserHistory", dbMgr);

    let hincId = new HIncId();
    let userHistory = new UserHistoryArray();

    for (let i = 0; i < param.size; i++) {
        hincId.hid = param.hid;
        hincId.index = param.from + i;
        // FIXME: i don't know if the master key works
        let msg = userHistoryBucket.get(hincId)[0].msg;
        userHistory.arr.push(msg);
    }

    return
}

/**
 * 获取公告
 * @param param
 */
//#[rpc=rpcServer]
export const getAnnoucement = (param: AnnouceFragment): AnnounceHistoryArray => {
    const dbMgr = getEnv().getDbMgr();
    const announceHistoryBucket = new Bucket("file", "server/data/db/message.AnnounceHistory", dbMgr);

    let aincId = new AIncId();
    let announceHistory = new AnnounceHistoryArray();

    for (let i = 0; i < param.size; i++) {
        aincId.aid = param.aid;
        aincId.index = param.from + i;
        let announce = announceHistoryBucket.get(aincId)[0].announce;
        announceHistory.arr.push(announce);
    }

    return announceHistory;
}

// ================================================================= 本地

const setDBMonitorAccordingUid = (uid:number)=>{
    const mqttServer: ServerNode = getEnv().getNativeObject('mqttServer');
    const key = ab2hex(new BonBuffer().write(uid).getBuffer());
    setMqttTopic(mqttServer, `${WARE_NAME}.${RoleBase._$info.name}.${key}`, true, true);
}

