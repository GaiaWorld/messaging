<div w-class="message-record-wrap">
    <div w-class="avator-wrap">
        <img w-class="avator" src="../../res/images/{{it.avatorPath}}" />
    </div>
    <div w-class="user-info-wrap">
        <div w-class="info-wrap">
            {{if it.isGroupMessage}}
            <img w-class="resIcon" src="../../res/images/group-icon.png" />
            {{end}}
            <span w-class="userName">{{it.name}}</span>
            {{if it.isNotDisturb}}
            <img w-class="notDisturbIcon" src="../../res/images/not-disturb.png" />
            {{end}}
        </div>
        <span w-class="recordInfo">{{it.recordInfo}}</span>
    </div>
    <div w-class="right-wrap">
        <span w-class="recordTime">{{it.recordTime}}</span>
        {{if it.unReadCount}}
        <span w-class="unread" style="background:{{it.isNotDisturb ? '#ccc' : '#F7931A'}}">{{it.unReadCount}}</span>
        {{end}}
    </div>
</div>
            