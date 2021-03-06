/**
 * 获取客户的基本信息
 * 后端不应该相信前端发送的uid信息，应该自己从会话中获取
 */
// ================================================================= 导入
import { Contact, FriendLink, UserInfo, UserCredential, AccountGenerator, OnlineUsers, OnlineUsersReverseIndex } from "../db/user.s";
import { LoginReq, LoginReply, GetFriendLinksReq, GetContactReq, Result, UserInfoSet, MessageFragment, AnnouceFragment, UserArray, GroupArray, FriendLinkArray, GroupHistoryArray, UserHistoryArray, AnnounceHistoryArray, GroupUserLinkArray, UserRegister, GetUserInfoReq, GetGroupInfoReq } from "./basic.s";
import { GroupHistory, GroupMsg} from "../db/message.s";
import { GroupInfo, GroupUserLink } from "../db/group.s";
import { Bucket } from "../../../utils/db";
import { getEnv } from '../../../pi_pt/net/rpc_server';
import { ServerNode } from '../../../pi_pt/rust/mqtt/server';
import { setMqttTopic, mqttPublish, QoS } from "../../../pi_pt/rust/pi_serv/js_net";
import * as CONSTANT from '../constant';
import {Tr} from "../../../pi_pt/rust/pi_db/mgr";
import { write, read } from "../../../pi_pt/db";
import { Logger } from '../../../utils/logger';

const logger = new Logger('BASIC');

// ================================================================= 导出
/**
 * 用户注册
 * @param registerInfo
 */
//#[rpc=rpcServer]
export const registerUser = (registerInfo: UserRegister): UserInfo => {
    logger.debug("user try to register with: ", registerInfo);
    const dbMgr = getEnv().getDbMgr();
    const userInfoBucket = new Bucket("file", CONSTANT.USER_INFO_TABLE, dbMgr);
    const userCredentialBucket = new Bucket("file", CONSTANT.USER_CREDENTIAL_TABLE, dbMgr);
    const accountGeneratorBucket = new Bucket("file", CONSTANT.ACCOUNT_GENERATOR_TABLE, dbMgr);

    let userInfo = new UserInfo();
    let userCredential = new UserCredential();

    userInfo.name = registerInfo.name;
    userInfo.note = "";
    userInfo.tel = "";

    let accountGenerator = new AccountGenerator();
    let nextAccount = accountGeneratorBucket.get("index")[0].nextIndex + 1;
    accountGenerator.nextIndex = nextAccount;
    accountGeneratorBucket.put("index", accountGenerator);

    userInfo.uid = nextAccount;
    userInfo.sex = 1;

    userCredential.uid = userInfo.uid;
    userCredential.passwdHash = registerInfo.passwdHash;

    userInfoBucket.put(userInfo.uid, userInfo);
    logger.debug("sucessfully registered user", userInfo);
    userCredentialBucket.put(userInfo.uid, userCredential);

    // write contact info
    let contact = new Contact();
    contact.uid = userInfo.uid;
    contact.applyGroup = [];
    contact.applyUser = [];
    contact.friends = [];
    contact.group = [];
    contact.temp_chat = [];
    contact.blackList = [];

    const contactBucket = new Bucket("file", CONSTANT.CONTACT_TABLE, dbMgr);
    let c = contactBucket.get(userInfo.uid)[0];
    if (c === undefined) {
        let v = contactBucket.put(userInfo.uid, contact);
        if (v) {
            logger.debug("Create user contact success");
        } else {
            logger.error("Create user contact failed");
        }
    }

    return userInfo;
}

//#[rpc=rpcServer]
export const login = (loginReq: LoginReq): UserInfo => {
    logger.debug("user try to login with uid: ", loginReq.uid);
    const dbMgr = getEnv().getDbMgr();
    const userInfoBucket = new Bucket("file", CONSTANT.USER_INFO_TABLE, dbMgr);
    const userCredentialBucket = new Bucket("file", CONSTANT.USER_CREDENTIAL_TABLE, dbMgr);

    let uid = loginReq.uid;
    let passwdHash = loginReq.passwdHash;
    let expectedPasswdHash = userCredentialBucket.get(uid);

    let userInfo = new UserInfo();

    // user doesn't exist
    if (expectedPasswdHash[0] === undefined) {
        userInfo.uid = -1;
        userInfo.sex = 0;
        logger.debug("user does not exist: ", loginReq.uid);
        return userInfo;
    }

    // FIXME: constant time equality check
    if (passwdHash === expectedPasswdHash[0].passwdHash) {
        userInfo = userInfoBucket.get(loginReq.uid)[0];
        let mqttServer = getEnv().getNativeObject<ServerNode>("mqttServer");
        setMqttTopic(mqttServer, loginReq.uid.toString(), true, true);
        logger.debug("Set user topic: ", loginReq.uid.toString());

        // save session
        let session = getEnv().getSession();
        write(dbMgr, (tr: Tr) => {
            session.set(tr, "uid", loginReq.uid.toString());
            logger.info("set session value of uid: ", loginReq.uid.toString());
        });

        // TODO: debug purpose
        read(dbMgr, (tr: Tr) => {
            let v = session.get(tr, "uid");
            logger.debug("read session value of uid: ", v);
            logger.debug("user login session id: ", session.getId());
        });

        let onlineUsersBucket = new Bucket("memory", CONSTANT.ONLINE_USERS_TABLE, dbMgr);
        let onlineUsersReverseIndexBucket = new Bucket("memory", CONSTANT.ONLINE_USERS_REVERSE_INDEX_TABLE, dbMgr);

        let online = new OnlineUsers();
        online.uid = loginReq.uid;
        online.sessionId = session.getId();
        onlineUsersBucket.put(online.uid, online);

        logger.debug("Add user: ", uid, "to online users bucket with sessionId: ", online.sessionId);

        let onlineReverse = new OnlineUsersReverseIndex();
        onlineReverse.sessionId = session.getId();
        onlineReverse.uid = loginReq.uid;
        onlineUsersReverseIndexBucket.put(onlineReverse.sessionId, onlineReverse);

        logger.debug("Add user: ", uid, "to online users reverse index bucket with sessionId: ", online.sessionId);

    } else {
        logger.debug("wrong password or uid");
        userInfo.uid = -1;
    }

    userInfo.sex = 0;

    return userInfo;
}


//#[rpc=rpcServer]
export const isUserOnline = (uid: number): Result => {
    let dbMgr = getEnv().getDbMgr();

    let res = new Result();
    let bucket = new Bucket("memory", CONSTANT.ONLINE_USERS_TABLE, dbMgr);
    let onlineUser = bucket.get<number, [OnlineUsers]>(uid)[0];
    if (onlineUser !== undefined && onlineUser.sessionId !== -1) {
        logger.debug("User: ", uid, "on line");
        res.r = 1; // on line;
        return res;
    } else {
        logger.debug("User: ", uid, "off line");
        res.r = 0; // off online
        return res;
    }
}

/**
 * 获取用户基本信息
 *
 * @param uid
 */
//#[rpc=rpcServer]
export const getUsersInfo = (getUserInfoReq: GetUserInfoReq): UserArray => {
    const dbMgr = getEnv().getDbMgr();
    const userInfoBucket = new Bucket("file", CONSTANT.USER_INFO_TABLE, dbMgr);

    let uids = getUserInfoReq.uids;
    let values: any = userInfoBucket.get(uids);
    logger.debug("Read userinfo: ", uids, values);

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
    const groupInfoBucket = new Bucket("file", CONSTANT.GROUP_INFO_TABLE, dbMgr);

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
    logger.info("setUserInfo: ", param);
    const dbMgr = getEnv().getDbMgr();
    const userInfoBucket = new Bucket("file", CONSTANT.USER_INFO_TABLE, dbMgr);

    let res = new Result();

    let uid;
    let session = getEnv().getSession();
    logger.debug('setUserInfo for sessionId: ', session.getId());
    read(dbMgr, (tr: Tr) => {
        uid = session.get(tr, "uid");
    });
    logger.info("Read uid from seesion: ", uid);

    if (uid === undefined) {
        logger.info("User doesn't login");
        res.r = 0;
        return res;
    }

    let userInfo = new UserInfo();
    userInfo = userInfoBucket.get<number, UserInfo>(parseInt(uid))[0];
    logger.debug("userInfo before update: ",uid,  userInfo);
    userInfo.name = param.name;
    userInfo.note = param.note;
    userInfo.sex = param.sex;
    userInfo.tel = param.tel;
    userInfo.avator = param.avator;

    logger.debug("UserInfo to be written: ", uid, userInfo);
    let v = userInfoBucket.put(parseInt(uid), userInfo);
    if (!v) {
        logger.error("Can't write userInfo to db: ", uid, userInfo);
    } else {
        logger.debug("Write userInfo to db success: ", uid, userInfo);
    }

    logger.debug("Read userInfo after write: ", uid, userInfoBucket.get(parseInt(uid))[0]);

    res.r = 1;

    return res;
}


/**
 * 获取联系人信息
 * @param uid
 */
//#[rpc=rpcServer]
export const getContact = (getContactReq: GetContactReq): Contact => {
    const dbMgr = getEnv().getDbMgr();
    const contactBucket = new Bucket("file", CONSTANT.CONTACT_TABLE, dbMgr);

    let uid = getContactReq.uid;
    let value = contactBucket.get<number, Contact>(uid);

    return value[0];
}

/**
 * 获取好友别名和历史记录
 * @param uuidArr
 */
//#[rpc=rpcServer]
export const getFriendLinks = (getFriendLinksReq: GetFriendLinksReq): FriendLinkArray => {
    const dbMgr = getEnv().getDbMgr();
    const friendLinkBucket = new Bucket("file", CONSTANT.FRIEND_LINK_TABLE, dbMgr);

    let friendLinkArray = new FriendLinkArray();
    let uuids = getFriendLinksReq.uuid.map(v => v.toString());

    let friend = new FriendLink();
    let friends = friendLinkBucket.get(uuids)[0];
    // no friends found
    if (friends === undefined) {
        friend.alias = "";
        friend.hid = 0;
        friend.uuid = "";
    }
    friendLinkArray.arr = [friend];

    return friendLinkArray;
}


/**
 * 获取群组聊天的历史记录
 * @param hid
 */
//#[rpc=rpcServer]
export const getGroupHistory = (param: MessageFragment): GroupHistoryArray => {
    const dbMgr = getEnv().getDbMgr();
    const groupHistoryBucket = new Bucket("file", CONSTANT.GROUP_HISTORY_TABLE, dbMgr);

    let groupHistoryArray = new GroupHistoryArray();

    // we don't use param.order there, because `iter` is not bidirectional
    let hid = param.hid;
    let from = param.from;
    let size = param.size;

    let keyPrefix = hid + ":";
    let value = groupHistoryBucket.get(keyPrefix + from);

    if (value[0] !== undefined) {
        for (let i = from; i < from + size; i++) {
            let v = groupHistoryBucket.get(keyPrefix + i);
            if (v[0] !== undefined) {
                groupHistoryArray.arr.push(v[0]);
            } else {
                break;
            }
        }
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
    const userHistoryBucket = new Bucket("file", CONSTANT.USER_HISTORY_TABLE, dbMgr);

    let userHistory = new UserHistoryArray();

    // we don't use param.order there, because `iter` is not bidirectional
    let hid = param.hid
    let from = param.from;
    let size = param.size;

    let keyPrefix = hid + ":";
    let value = userHistoryBucket.get(keyPrefix + from);

    if (value[0] !== undefined) {
        for (let i = from; i < from + size; i++) {
            let v = userHistoryBucket.get(keyPrefix + i);
            if (v[0] !== undefined) {
                userHistory.arr.push(v[0]);
            } else {
                break;
            }
        }
    }

    return userHistory;
}

/**
 * 获取公告
 * @param param
 */
//#[rpc=rpcServer]
export const getAnnoucement = (param: AnnouceFragment): AnnounceHistoryArray => {
    const dbMgr = getEnv().getDbMgr();
    const announceHistoryBucket = new Bucket("file", CONSTANT.ANNOUNCE_HISTORY_TABLE, dbMgr);

    let announceHistory = new AnnounceHistoryArray();

    // we don't use param.order there, because `iter` is not bidirectional
    let aid = param.aid
    let from = param.from;
    let size = param.size;

    let keyPrefix = aid + ":";
    let value = announceHistoryBucket.get(keyPrefix + from);

    if (value[0] !== undefined) {
        for (let i = from; i < from + size; i++) {
            let v = announceHistoryBucket.get(keyPrefix + i);
            if (v[0] !== undefined) {
                announceHistory.arr.push(v[0]);
            } else {
                break;
            }
        }
    }

    return announceHistory;
}

// ================================================================= 本地

