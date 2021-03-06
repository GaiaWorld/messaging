<div w-class="recent-history-wrap" style="position:absolute;width:100%;height:100%;top:0px;left:0px;background-color:gray;">
    <div w-class="top-main-wrap">
        <client-app-widget-topBar-topBar>{title:"",moreImg:"more-dot-white.png",background:"none"}</client-app-widget-topBar-topBar>
        <client-app-widget-homeInfo-homeInfo>{avatorPath:"github.png",name:"用户名",isUser:true,isContactor:false,userId:{{it.rid}} }</client-app-widget-homeInfo-homeInfo>
    </div>
    <div w-class="detail-info-wrap">
        <div w-class="detail-info">
            <div w-class="adress-wrap">
                <img w-class="adressIcon" src="../../res/images/adress-book.png" />
                <div w-class="adress-text-wrap">
                    <span w-class="mainText">xxxxxxxxxxxxxxxxxxxx</span>
                    <span w-class="flag">地址</span>
                </div>
            </div>
            <div w-class="phone-wrap">
                <img w-class="phoneIcon" src="../../res/images/phone.png" />
                <div w-class="phone-text-wrap">
                    <span w-class="mainText">xxxxxxxxxxxxxxxxxxxx</span>
                    <span w-class="flag">电话</span>
                </div>
            </div>
        </div>
        <div w-class="other-wrap">
            <img w-class="moreChooseIcon" src="../../res/images/more-choose.png" />
            <ul w-class="ul-wrap">
                <li w-class="liItem firstLi">搜索聊天记录</li>
                <li style="display:flex;justify-content:space-between;align-items: center;" w-class="liItem">
                    <span>聊天置顶</span>
                    <client-app-widget-switch-switch>{types:false,activeColor:"linear-gradient(to right,#318DE6,#38CFE7)",inactiveColor:"#dddddd"}</client-app-widget-switch-switch>
                </li>
                <li style="display:flex;justify-content:space-between;align-items: center;" w-class="liItem">
                    <span>消息免打扰</span>
                    <client-app-widget-switch-switch>{types:true,activeColor:"linear-gradient(to right,#318DE6,#38CFE7)",inactiveColor:"#dddddd"}</client-app-widget-switch-switch>
                </li>
                <li w-class="liItem lastLi" on-tap="openApplyInfo">加好友</li>
            </ul>
        </div>
    </div>
    <div>这是陌生人详细信息页面</div>
    <div>陌生人的的id是{{it.rid}}</div>
    <div on-tap="openApplyInfo">点我进入输入验证信息界面</div>
</div>