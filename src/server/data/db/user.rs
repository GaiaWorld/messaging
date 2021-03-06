/**
 * 用户信息表
 */

/**
*性别
*/
enum SEXY {
    FAMALE = 0,//女性
    MALE = 1,//男性
}


/**
*用户本人的基本信息
*/
#[primary=uid,db=file,dbMonitor=true,hasmgr=false]
struct UserInfo {
    uid: u32,//用户id,自增,-1代表不存在
    name: String,//用户自己设置的用户名
    avator: String,//头像
    sex: SEXY,//性别
    tel: String,//电话
    note: String,//用户自己的备注信息
}

/**
 * User credential table
 */
#[primary=uid,db=file,dbMonitor=true,hasmgr=false]
struct UserCredential {
    uid: u32,//-1代表不存在
    passwdHash: String
}

/**
 * User account generator
 */
#[primary=index,db=file,dbMonitor=true,hasmgr=false]
struct AccountGenerator {
    index: String,
    nextIndex: u32
}

/**
*好友链接信息
*/
#[primary=uuid,db=file,dbMonitor=true]
struct FriendLink {
    uuid: String,//两个用户的id"-1"代表不存在,"10001:10002",前面代表uid1后面代表uid2
    alias: String,//别名
    hid: usize//历史记录id 53位，直接使用底层接口
}

/**
*联系人信息
*/
#[primary=uid,db=file,dbMonitor=true]
struct Contact {
    uid: u32,//用户id,-1代表不存在
    friends: &[u32],//好友id
    temp_chat: &[u32],//临时用户id
    group: &[u32],//群组id
    applyUser:&[u32],//其他用户申请添加当前用户为好友
    applyGroup:&[u32],//其他群组申请添加当前用户为好友
    blackList: &[u32]
}

#[primary=mtype,db=file,dbMonitor=true]
struct LastReadMessageId {
    mtype: String, // "10001:0" -> 用户 10001个人对个人消息， "10001:1" -> 用户10001群消息
    msgId: String // hIncid
}

#[primary=uid,db=memory]
struct OnlineUsers {
    uid: u32,
    sessionId: u32 // 若用户在线，seessionId > -1
}

#[primary=sessionId,db=memory]
struct OnlineUsersReverseIndex {
    sessionId: u32,
    uid: u32
}

