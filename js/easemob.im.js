/**************************************************************************
---                             demo相关代码                            ---
**************************************************************************/
;(function(window, undefined){

    //自定义允许上传的图片格式
    var IMGTYPE = {
        png: true
        , jpg: true
        , gif: true
        , bmp: true
    }

    //自定义允许上传的音频格式
    var AUDIOTYPE = {
        mp3: true
        , amr: true
        , wma : true
        , wav : true
        , avi : true
    }

    /**************************************************************************
    ---                                 avalon                              ---
    **************************************************************************/
    avalon.ready(function() {

        //common
        Easemob.im.utils = { 
            getAttr: function ( dom, attr ) {
                return dom.getAttribute(attr);
            }

            , setAttr: function ( dom, attr, value ) {
                return dom.setAttribute(attr, value);
            }
            
            , face: function ( msg ) {//解析表情
                if ( /\[.*\]/.test(msg) ) {
                    msg = msg.replace(/&amp;/g, '&');
                    msg = msg.replace(/&#39;/g, '\'');
                    msg = msg.replace(/&lt;/g, '\<');

                    avalon.each(send.faces, function ( k, v ) {
                        while( msg.indexOf(v.data) >= 0 ) {
                            msg = msg.replace(v.data
                                , '<img class=\"emim-face-msg\" src=\"img/faces/' 
                                    + v.src 
                                    + '.png\">');
                        }
                    });
                }
                return msg;
            }

            , handleBriefMsg: function ( target, msg ) {//显示即时消息
                var target = document.getElementById(target);

                if ( !target ) {
                    return;
                }

                var list = target.getElementsByTagName('span'),
                    msgDom = list[list.length - 2];

                switch ( msg ) {
                    case 'img':
                        msg = '[图片]';
                        break;
                    case 'audio':
                        msg = '[语音]';
                        break;
                    case 'file':
                        msg = '[文件]';
                        break;
                    default:
                        break;
                }

                msgDom.innerHTML = this.face(msg);
            }

            /*
                处理消息未读数
                @param1: domId; @param2: hide count
            */
            , handleUnreadCount: function ( target, isHide ) {

                var target = document.getElementById(target);

                if ( !target ) {
                    return;
                }

                var list = target.getElementsByTagName('span'),
                    countDom = list[list.length - 1],
                    count = Number(countDom.innerHTML);

                if ( !isHide ) {
                    count += 1;
                    countDom.innerHTML = count;
                    countDom.style.display = '';
                } else {
                    countDom.innerHTML = '';
                    countDom.style.display = 'none';
                }
            }

            , appendMsg: function ( from, to, html, msgType ) {//消息上屏
                var isSelf = from == profileInfo.username,
                    curWrapper = document.getElementById(isSelf ? to : from);

                var div = document.createElement('div');
                div.className = 'emim-clear emim-mt20 emim-tl emim-msg-wrapper ';
                div.className += isSelf ? 'emim-fr' : 'emim-fl';
                div.innerHTML = this.face(html);
                curWrapper.appendChild(div);
                div = null;

                isSelf || chatHeader.to == from || this.handleUnreadCount(this.getAttr(curWrapper, 'id') + 'Contact');
                
                this.handleBriefMsg(this.getAttr(curWrapper, 'id') + 'Contact', msgType);

                curWrapper.scrollTop = curWrapper.scrollHeight + 100;
            }

            , textMessage: function ( msg ) {//文本消息，包括表情，文字
                return '<div class="emim-msg-container emim-textmsg">' + msg + '</div>';
            }    

            , generateFileDom: function ( type, url ) {//
                if ( IMGTYPE[type] ) {//img
                    return "<div class='emim-msg-container emim-imgmsg'><a target='_blank' href='" + url + "'><img src='" + url + "'/></a></div>";
                } else if ( AUDIOTYPE[type] ) {//audio
                    return "<div class='emim-msg-container emim-audiomsg'><img src='" + url + "'/></div>";
                } else {//file
                    return "<div class='emim-msg-container emim-filemsg'><img src='" + url + "'/></div>";
                }
            }

            , fileMessage: function ( fileInput, fileMsg, fileType ) {//文件消息，其中图片和语音对应展示，其他类型显示下载容器

                if ( fileMsg ) {//收消息
                    return this.generateFileDom(fileType, fileMsg);
                } else {
                    var id = this.getAttr(fileInput, 'id');

                    if(Easemob.im.Utils.isCanUploadFileAsync()) {

                        if(fileInput && !fileInput.value) return;

                        var me = this,
                            file = null,
                            type = '',
                            fileDom = '',
                            to = chatHeader.to;

                        file = Easemob.im.Utils.getFileUrl(id);
                        type = file.filetype.toLowerCase();
                        fileDom = me.generateFileDom(type, file.url);
                    }

                    var opt = {
                        type : 'chat',
                        fileInputId : id,
                        filename : file && file.filename || '',
                        to : to,
                        apiUrl: Easemob.im.config.apiURL,
                        ext: {
                            postfix: file && file.filetype || ''
                        },
                        fail : function(error) {
                            //var messageContent = (error.msg || '') + ",发送图片文件失败:" + (filename||flashFilename);
                            //appendMsg(curUserId, to, messageContent);
                        },
                        success : function(data) {
                            if(Easemob.im.Utils.isCanUploadFileAsync) {
                                me.appendMsg(profileInfo.username, to, fileDom, 'img');
                            } else {
                                swfupload.settings.upload_success_handler();
                            }
                        }
                    };
                    if (chatHeader.isGroup) {
                        opt.type = 'groupchat';
                        opt.to = chatHeader.roomId;
                    }
                            
                    conn.send(opt);
                }
            }
        }
        
        /**************************************************************************
        ---                               MODULES                               ---
        **************************************************************************/

        //layer
        var layer = avalon.define({
            $id: 'layer'
            , display: false
            , show: function() {
                loading.display = true;
            }
            , hide: function() {
                loading.display = false;
            }
        });
        
        //loading
        var loading = avalon.define({
            $id: 'loading'
            , display: false
            , show: function() {
                loading.display = true;
                layer.display = true;
            }
            , hide: function() {
                loading.display = false;
                layer.display = false;
            }
        });

        //提示信息
        var emprompt = avalon.define({
            $id: 'prompt'
            , content: ''
            , t: '-60px'
            , ts: 0
            , show: function(html) {
                emprompt.t = '0';
                emprompt.content = html;
                clearTimeout(emprompt.ts);
                emprompt.ts = setTimeout(emprompt.hide, 2000);
            }
            , hide: function() {
                emprompt.t = '-60px';
            }
        });

        //登录
        var signin = avalon.define({
            $id: 'signin'
            , username: ''
            , password: ''
            , content: 'k'
            , port: 'Password'
            , display: true
            , show: function() {
                signin.display = true;
            }
            , hide: function() {
                signin.display = false;
            }
            , check: function() {
                if ( !this.value ) {
                    this.style.borderBottom = '1px solid rgb(255, 42, 0)';
                } else {
                    this.style.borderBottom = '1px solid #eee';
                }
            }
            , transfer: function() {
                switch(signin.content) {
                    case 'j':
                        signin.content = 'k';
                        signin.port = 'Password';
                        break;
                    default:
                        signin.content = 'j';
                        signin.port = 'Token';
                }
            }
            , signin: function(e) {
                var evt = e || window.event;
                if(evt.keyCode != 0 && evt.keyCode != 13) return false;
                if (!signin.username) {
                    emprompt.show('请输入用户名');
                    return;
                } else if (!signin.password) {
                    emprompt.show('请输入密码');
                    return;
                }
                loading.show();
                if (signin.content === 'k') {
                    conn.open({//根据用户名令牌登录系统
                        apiUrl : Easemob.im.config.apiURL,
                        user : signin.username,
                        accessToken : signin.token,
                        appKey : Easemob.im.config.appkey
                    });
                } else {
                    conn.open({//根据用户名密码登录系统
                        apiUrl : Easemob.im.config.apiURL,
                        user : signin.username,
                        pwd : signin.password,
                        appKey : Easemob.im.config.appkey
                    });
                }               
            }
            , showSignup: function() {
                signin.hide();
                signup.show();
            }
        });

        //注册
        var signup = avalon.define({
            $id: 'signup'
            , username: ''
            , password: ''
            , nickname: ''
            , display: false
            , show: function() {
                signup.display = true;
            }
            , hide: function() {
                signup.display = false;
            }
            , signup: function(e) {
                var evt = e || window.event;
                if(evt.keyCode != 13) return false;
                if (!signup.username) {
                    emprompt.show('请输入用户名');
                    return;
                } else if (!signup.password) {
                    emprompt.show('请输入密码');
                    return;
                } else if (!signup.nickname) {
                    emprompt.show('请输入昵称');
                    return;
                }
                loading.show();
                var options = {
                    username : signup.username
                    , password : signup.password
                    , nickname : signup.nickname
                    , appKey : Easemob.im.config.appkey
                    , success : function(result) {
                        loading.hide();
                        emprompt.show("注册成功!");
                        signup.hide();
                        signin.show();
                    }
                    , error : function(e) {
                        loading.hide();
                        emprompt.show(e.error);
                    }
                    , apiUrl : Easemob.im.config.apiURL
                };
                Easemob.im.Utils.registerUser(options);   
            }
            , back: function() {
                signup.hide();
                signin.show();
            }
        });
 
        //contact wrapper
        var emimList = avalon.define({
            $id: 'emimContactWrapper'
        });

        //聊天主窗口
        var chat = avalon.define({
            $id: 'chat'
            , display: false
            , height: 0
            , show: function() {
                chat.display = true;
                var chatDom = document.getElementById('emimWrapper');
                chat.height = chatDom.getBoundingClientRect().height;
            }
            , hide: function() {
                chat.display = false;
            }
        });

        //dialog
        var dialog = avalon.define({
            $id: 'dialog'
            , title: ''
            , content: ''
            , display: false
            , show: function() {
                dialog.display = true;
            }
            , hide: function() {
                dialog.display = false;
            }
            , cacel: function() {
                dialog.hide();
            }
            , ok: function() {
                dialog.hide();
            }
        });


        //profile
        var profileInfo = avalon.define({
            $id: 'profile'
            , username: ''
            , src: 'img/avatar.png'
            , display: false
            , dialog: function(fn) {
                
                switch(fn) {
                    case 'add':

                        break;
                    case 'del':

                        break;
                }
            }
            , logout: function() {
                conn.close();
                chat.hide();
                signin.show();
            }
            , toggle: function() {
                profileInfo.display = !profileInfo.display;
            }
        });
 
       
        //tab
        var contactTab = avalon.define({
            $id: 'contactTab'
            , cur: 'friend'
            , toggle: function(idx) {
                contactTab.cur = idx;
                contactList.show(idx);
            }
        });


        //list wrapper
        var contactList = avalon.define({
            $id: 'contactList'
            , friend: []
            , group: []
            , stranger: []
            , curWrapper: 'friend'
            , cur: ''
            , show: function(tab) {
                contactList.curWrapper = tab;
            }
            , select: function() {
                contactList.cur = Easemob.im.utils.getAttr(this, 'id');
                var roomId = Easemob.im.utils.getAttr(this, 'roomId');

                if(roomId) {
                    chatHeader.isGroup = true;
                    chatHeader.roomId = roomId;
                } else {
                    chatHeader.isGroup = false;
                    chatHeader.roomId = '';
                }

                var cur = this.getElementsByTagName('span')[0].innerHTML;
                chatHeader.to = cur;
                chatWrapper.toggle(cur);

                Easemob.im.utils.handleUnreadCount(contactList.cur, true);
            }
        });

        //chat header
        var chatHeader = avalon.define({
            $id: 'chatHeader'
            , to: ''
            , isGroup: false
            , roomId: ''
        });

        //chat wrapper
        var chatWrapper = avalon.define({
            $id: 'chatWrapper'
            , friend: []
            , group: []
            , stranger: []
            , cur: 0
            , toggle: function(idx) {
                chatWrapper.cur = idx;
            }
        });

        //发送区域
        var send = avalon.define({
            $id: 'send'
            , text: ''
            , realFile: ''
            , file: ''
            , faceShow: false
            , showFace: function() {
                send.faceShow = !send.faceShow;
            }
            , sendText: function(message) {
                var to = chatHeader.to;
                if (!to) {
                    emprompt.show("请先选择联系人");
                    return;
                }
                if (!send.text) {
                    return;
                }
                var options = message;
                // 群组消息和个人消息的判断分支
                chatHeader.isGroup && (options.type = 'groupchat');
                conn.send(options);
                //当前登录人发送的信息在聊天窗口中原样显示
                Easemob.im.utils.appendMsg(profileInfo.username, to, Easemob.im.utils.textMessage(send.text.replace(/\n/g, '<br>')), send.text);
                send.text = '';   
            }
            , sendFile: function() {
                if(!chatHeader.to) {
                    emprompt.show("请先选择联系人");
                    return;
                }
                send.realFile = send.realFile ? send.realFile : this.parentNode.parentNode.getElementsByTagName('input')[0];
                send.realFile.click();
            }
            , faceSelect: function(e) {
                var ev = window.event || e,
                    target = ev.target || ev.srcElement;

                target.nodeName == 'IMG' && (send.text += Easemob.im.utils.getAttr(target, 'data'));
            }
            , realSendFile: function() {
                Easemob.im.utils.fileMessage(this);
            }
        });


        //avalon main
        avalon.scan();

        /**************************************************************************
        ---                              SDK INVOKE                             ---
        **************************************************************************/
        
        var conn = new Easemob.im.Connection({
            https : Easemob.im.config.https,
            url: Easemob.im.config.xmppURL
        });

        //监听回调
        conn.listen({
            onOpened : function() {//当连接成功时的回调方法
                handleOpen(conn);
            },
            onClosed : function() {//当连接关闭时的回调方法
                handleClosed();
            },
            onTextMessage : function(message) {//收到文本消息时的回调方法
                Easemob.im.utils.appendMsg(message.from, message.to, Easemob.im.utils.textMessage(message.data.replace(/\n/g, '<br>')), message.data);
            },
            onEmotionMessage : function(message) {//收到表情消息时的回调方法
                var str = '';
                avalon.each(message.data, function(k, v) {
                    str += v.type == 'emotion' ? '<img class="emim-face-msg" src="' + v.data + '">' : v.data;
                });
                Easemob.im.utils.appendMsg(message.from, message.to, Easemob.im.utils.textMessage(str.replace(/\n/g, '<br>')), str);
                str = null;
            },
            onPictureMessage : function(message) {//收到图片消息时的回调方法
                Easemob.im.utils.appendMsg(message.from, message.to, Easemob.im.utils.fileMessage(null, message.url, message.ext.postfix || message.filename.slice(message.filename.lastIndexOf('.') + 1)), 'img');
            },
            onAudioMessage : function(message) {//收到音频消息的回调方法
                handleAudioMessage(message);
            },
            onLocationMessage : function(message) {//收到位置消息的回调方法
                handleLocationMessage(message);
            },
            onFileMessage : function(message) {//收到文件消息的回调方法
                handleFileMessage(message);
            },
            onVideoMessage : function(message) {//收到视频消息的回调方法
                handleVideoMessage(message);
            },
            onPresence : function(message) {//收到联系人订阅请求的回调方法
                handlePresence(message);
            },
            onRoster : function(message) {//收到联系人信息的回调方法
                handleRoster(message);
            },
            onInviteMessage : function(message) {//收到群组邀请时的回调方法
                handleInviteMessage(message);
            },
            onError : function(message) {//异常时的回调方法
                handleError(message);
            }
        });
        
        /*
            处理连接时函数,主要是登录成功后对页面元素做处理
        */
        var handleOpen = function(conn) {
            
            profileInfo.username = conn.context.userId;//从连接中获取到当前的登录人注册帐号名

            //获取当前登录人的联系人列表
            conn.getRoster({
                success : function(roster) {
                    loading.hide();
                    signin.hide();
                    chat.show();

                    var curroster;
                    contactList.friend = [];
                    contactList.group = [];
                    contactList.stranger = [];

                    chatWrapper.friend = [];
                    for ( var i in roster) {
                        var ros = roster[i];
                        //both为双方互为好友，要显示的联系人,from我是对方的单向好友
                        if (ros.subscription == 'both' || ros.subscription == 'from') {
                            ros.src = ros.src ? ros.src : 'img/avatar.png';
                            contactList.friend.push(ros);
                            chatWrapper.friend.push(ros);
                        } else if (ros.subscription == 'to') {
                            toRoster.push(ros);//to表明了联系人是我的单向好友
                        }
                    }

                    /*
                        获取当前登录人的群组列表
                    */
                    conn.listRooms({
                        success : function(rooms) {
                            avalon.each(rooms, function(k, v) {
                                contactList.group.push(v);
                            });
                            conn.setPresence();//设置用户上线状态，必须调用
                        },
                        error : function(e) {}
                    });
                }
            });
        };


        /*
            异常情况下的处理方法
        */
        var handleError = function(e) {
            if (!chatHeader.to) {
                loading.hide();
                signin.show();
                emprompt.show(e.msg + ",请重新登录");
            } else {
                if (e.type == EASEMOB_IM_CONNCTION_SERVER_CLOSE_ERROR) {
                    if (e.msg == "" || e.msg == 'unknown' ) {
                        emprompt.show("服务器断开连接,可能是因为在别处登录");
                    } else {
                        emprompt.show("服务器断开连接");
                    }
                } else if (e.type === EASEMOB_IM_CONNCTION_SERVER_ERROR) {
                    if (e.msg.toLowerCase().indexOf("user removed") != -1) {
                        emprompt.show("用户已经在管理后台删除");
                    }
                } else {
                    emprompt.show(e.msg);
                }
            }
        };



    });


    /*
        upload by flash
        param1: input file ID
    */
    var uploadShim = function(fileInputId) {
        if(!Easemob.im.Utils.isCanUploadFile) {
            return;
        }
        var pageTitle = document.title;
        var uploadBtn = $('#' + fileInputId);
        if(typeof SWFUpload === 'undefined' || uploadBtn.length < 1) return;

        return new SWFUpload({ 
            file_post_name: 'file'
            , flash_url: "js/swfupload/swfupload.swf"
            , button_placeholder_id: fileInputId
            , button_width: uploadBtn.width() || 120
            , button_height: uploadBtn.height() || 30
            , button_cursor: SWFUpload.CURSOR.HAND
            , button_window_mode: SWFUpload.WINDOW_MODE.TRANSPARENT
            , file_size_limit: 10485760
            , file_upload_limit: 0
            , file_queued_handler: function(file) {
                if(this.getStats().files_queued > 1) {
                    this.cancelUpload();
                }
                if(!EasemobWidget.PICTYPE[file.type.slice(1).toLowerCase()]) {
                    im.errorPrompt('不支持此文件类型' + file.type);
                    this.cancelUpload();
                } else if(10485760 < file.size) {
                    im.errorPrompt('文件大小超过限制！请上传大小不超过10M的文件');
                    this.cancelUpload();
                } else {
                    im.sendImgMsg();
                }
            }
            , file_dialog_start_handler: function() {}
            , upload_error_handler: function(file, code, msg){
                if(code != SWFUpload.UPLOAD_ERROR.FILE_CANCELLED && code != SWFUpload.UPLOAD_ERROR.UPLOAD_LIMIT_EXCEEDED && code != SWFUpload.UPLOAD_ERROR.FILE_VALIDATION_FAILED) {
                    im.errorPrompt('图片发送失败');
                }
            }
            , upload_complete_handler: function(){}
            , upload_success_handler: function(file, response){
                if(!file || !response) return;
                try{
                    var res = Easemob.im.Utils.parseUploadResponse(response);
                    
                    res = $.parseJSON(res);
                    res.filename = file.name;
                    if(file && !file.url && res.entities && res.entities.length > 0) {
                        file.url = res.uri + '/' + res.entities[0].uuid;
                    }
                    var temp = $("\
                        <div class='easemobWidget-right'>\
                            <div class='easemobWidget-msg-wrapper'>\
                                <i class='easemobWidget-right-corner'></i>\
                                <div class='easemobWidget-msg-status hide'><span>发送失败</span><i></i></div>\
                                <div class='easemobWidget-msg-container'>\
                                    <a href='"+file.url+"' target='_blank'><img src='"+file.url+"'/></a>\
                                </div>\
                            </div>\
                        </div>\
                    ");
                    im.chatWrapper.append(temp);
                    im.chatWrapper.find('img:last').on('load', im.scrollBottom);
                    this.uploadOptions.onFileUploadComplete(res);
                } catch (e) {
                    im.errorPrompt('上传图片发生错误');
                }
            }
        });
    }

    /*
        提供上传接口
    */
    var flashUpload = function(url, options){
        swfupload.setUploadURL(url);
        swfupload.startUpload();
        swfupload.uploadOptions = options;
    }

}(window, undefined));



/*
    表情包集成

    Easemob.im.EMOTIONPACKAGE = {
        path: 'static/img/faces/',
        map: {
            '[):]': 'ee_1.png',
            '[:D]': 'ee_2.png'
            ...
        }
    }
*/
Easemob.im.EMOTIONS = {
    path: 'img/faces/'
    , map: {
        '[):]': 'ee_1.png',
        '[:D]': 'ee_2.png',
        '[;)]': 'ee_3.png',
        '[:-o]': 'ee_4.png',
        '[:p]': 'ee_5.png',
        '[(H)]': 'ee_6.png',
        '[:@]': 'ee_7.png',
        '[:s]': 'ee_8.png',
        '[:$]': 'ee_9.png',
        '[:(]': 'ee_10.png',
        '[:\'(]': 'ee_11.png',
        '[:|]': 'ee_12.png',
        '[(a)]': 'ee_13.png',
        '[8o|]': 'ee_14.png',
        '[8-|]': 'ee_15.png',
        '[+o(]': 'ee_16.png',
        '[<o)]': 'ee_17.png',
        '[|-)]': 'ee_18.png',
        '[*-)]': 'ee_19.png',
        '[:-#]': 'ee_20.png',
        '[:-*]': 'ee_21.png',
        '[^o)]': 'ee_22.png',
        '[8-)]': 'ee_23.png',
        '[(|)]': 'ee_24.png',
        '[(u)]': 'ee_25.png',
        '[(S)]': 'ee_26.png',
        '[(*)]': 'ee_27.png',
        '[(#)]': 'ee_28.png',
        '[(R)]': 'ee_29.png',
        '[({)]': 'ee_30.png',
        '[(})]': 'ee_31.png',
        '[(k)]': 'ee_32.png',
        '[(F)]': 'ee_33.png',
        '[(W)]': 'ee_34.png',
        '[(D)]': 'ee_35.png'
    }
};
