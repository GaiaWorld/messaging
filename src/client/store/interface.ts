/**
 * 所有全局数据的接口都定义在这里
 */

// ================================================ 导入



// ================================================ 导出
//性别
export enum SEXY{
    FAMALE = 0,//女性
    MALE = 1//男性
}

//用户信息，第一版所有用户信息都一样
export interface UserInfo{
    id:string;//用户id全局唯一
    name:string;//用户自己设置的用户名
    alias?:string;//其他人为用户设置的别称
    avatar:string;//头像
    sex:SEXY;//性别
    tel:string;//电话        
    note:string;//用户自己的备注信息
}

//群组状态
export enum GROUP_STATE {
    CREATE = 0,//创建
    DISSOLVE = 1,//解散
    DISSOLVING = 2//解散中
}

//消息类型
export enum MSG_TYPE {
    TXT = 1,//文本和图片
    VOICE = 2//语音
}

//消息类型
export interface GroupInfo{
    id:string;//
    name:string;//组名
    avatar:string;//头像
    memberList:UserInfo[];//成员信息
    owner:UserInfo;//群主
    admin:UserInfo[];//管理员
    noticeList:Message[];//群公告列表
    create_time:number;//群创建时间
    state:GROUP_STATE//群状态
}

//联系人列表
export interface ContactList{
    friendList:UserInfo[];//好友列表
    groupList:GroupInfo[];//群组列表
    tempChatList:UserInfo[];//临时聊天列表
}

//消息，包括单聊、群组、群公告
export interface Message{
    fromid?:string;//发信人id
    fromname?:string;//发信人姓名
    avatar?:string;//头像
    content:string;//内容
    serial:number;//编号
    time:number;//时间
}

//频道
export interface Channel{
    id:string;//频道id?
    topic:string;//主题
    messageList:Message[];//消息列表
}

export type ChatList = Channel[];//聊天本质上就是一个频道

//整个应用的唯一数据存储结构
export interface Store {
    currentUserInfo:UserInfo;//当前用户信息
    contacts:ContactList;//联系人列表
    chats:ChatList;//聊天列表
}



// ================================================ 本地


// ================================================ 立即执行

