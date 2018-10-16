/**
 * 用户信息表
 */

/**
*性别
*/
enum SEXY{
    FAMALE = 0,//女性
    MALE = 1//男性
}


/**
*用户本人的基本信息
*/
#[primary=uid,db=file,dbMonitor=true]
struct User {
    uid: u32,//用户id,自增
    name:String,//用户自己设置的用户名
    avator:String,//头像
    sex:SEXY,//性别
    tel: String,//电话
    note: String//用户自己的备注信息
}

struct Uuid {
    uid1:u32,//当前用户id
    uid2:u32//对方id
}
/**
*好友链接信息
*/
#[primary=uuid,db=file,dbMonitor=true]
struct FriendLink {
    uuid:Uuid,//两个用户的id进行hash
    alias:String,//别名    
    hid:usize//历史记录id 53位，直接使用底层接口
}

/**
*联系人信息
*/
#[primary=uid,db=file,dbMonitor=true]
struct Contact {
    uid:u32,//用户id
    friends:&[u32],//好友id
    temp_chat:&[u32],//临时用户id
    group:&[u32]//群组id
}

