
//工具函数模块

/**
 * 从err对象中获取错误信息
 */
exports.getErrorMessage = function(err) {
    var messages = [];

    if (err.code) {
        switch (err.code) {
            case 11000:
            case 11001:
                messages.push('已经存在');
                break;
            default:
                messages.push('出了一些错误');
        }
    } else {
        for (var errName in err.errors) {
            if (err.errors[errName].message) messages.push(err.errors[errName].message);
        }
    }

    return messages;
};

//生成一个时间戳ID——14位
exports.getTimestamp = function(){
    return new Date().getTime().toString() + parseInt(Math.random()*10);
};

//获取客户端Ip
exports.getReqRemoteIp = function(req){
    var ip = req.headers['x-forwarded-for'] ||
        req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress || '';
    if(ip.split(',').length>0){
        ip = ip.split(',')[0]
    }
    return ip;
};

//判断两个对象是否相等
exports.isEqual = function(a, b) {
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);
    if (aProps.length !== bProps.length) {
        return false;
    }
    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];
        if (a[propName] !== b[propName]) {
            return false;
        }
    }
    return true;
};

//时间格式化
exports.formatDate = function(date){
    var differ = Date.now() - new Date(date).getTime();
    var SECOND = 1000;
    var MINUTE = 60 * SECOND;
    var HOUR = 60 * MINUTE;
    var DAY = 24 * HOUR;
    if(differ < MINUTE){
        return '刚刚';
    }else if(differ < HOUR){
        return Math.floor(differ / MINUTE) + '分钟前';
    }else if(differ < DAY){
        return Math.floor(differ / HOUR) + '小时前';
    }else{
        return new Date(date).toLocaleDateString();
    }
};

//格式化搜索字符串
exports.formatSearch = function(text){
    var delimiter = /[\s\|\?\*\+\.\,\!\'\"\。\，\！\？\、]/;     //分隔符
    var result = text.split(delimiter);
    result = result.filter(function(value){   // 去空
        return value !== '' || typeof value === 'undefined';
    });
    result = result.map(function(value){
        return new RegExp(value, 'i');
    });
    return result;
};

//处理文章内容
exports.formatContent = function(content){
    return content.substring(0, 200).replace( /[\\\`\*\_\[\]\#\+\-\!\>]/g, "") + ' ……';
};

//删除文件夹
exports.emptyDir = function(fileUrl){
    var fs = require('fs');
    var files = fs.readdirSync(fileUrl);//读取该文件夹
    files.forEach(function(file){
        var stats = fs.statSync(fileUrl+'/'+file);
        if(stats.isDirectory()){
            emptyDir(fileUrl+'/'+file);
        }else{
            fs.unlinkSync(fileUrl+'/'+file);
            console.log("删除文件 "+fileUrl+'/'+file+" 成功");
        }
    });
    fs.rmdirSync(fileUrl);
};

//发送邮件
exports.mailer = function(mail){
    var nodemailer = require('nodemailer'),
        config = require('../config');
    var transporter = nodemailer.createTransport(config.mail);
    transporter.sendMail(mail, function(error, info){
        if(error) return console.log(error);
        console.log('mail sent: ', info.response);
    });
};

//随机生成6位验证码
exports.getCode = function(){
    var index = (Math.floor(Math.random() * 1000000)).toString();
    return '0'.repeat(6-index.length) + index;
};
