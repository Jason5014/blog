var fs = require('fs');
var formidable = require('formidable');
var tools = require('../utility/tools');
var Blogger = require('../models/bloggers');
var cacheFolder = 'public/images/photo_tmp';    //上传路径
var photoFolder = 'public/images/photo';        //用户头像保存路径

exports.upload = function(req, res) {
        if (!fs.existsSync(cacheFolder))
            fs.mkdirSync(cacheFolder);
        var form = new formidable.IncomingForm(); //创建上传表单
        form.encoding = 'utf-8'; //设置编辑
        form.uploadDir = cacheFolder; //设置上传目录
        form.keepExtensions = true; //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024; //文件大小
        form.type = true;
        var result ;
        try {
            form.parse(req, function (err, fields, files) {
                if (err) result = { result: 0, message: '图片获取失败' };
                var extName = ''; //后缀名
                switch (files.avatar_file.type) {
                    case 'image/pjpeg':
                        extName = 'jpg';
                        break;
                    case 'image/jpeg':
                        extName = 'jpg';
                        break;
                    case 'image/png':
                        extName = 'png';
                        break;
                    case 'image/x-png':
                        extName = 'png';
                        break;
                }
                if (extName.length === 0)
                    result = { result: 0,  msg: '只支持png和jpg格式图片'  };
                 else {
                    var avatarName = '/' + req.session.user.id + '.' + extName;    //用户头像名称
                    var displayUrl = photoFolder + avatarName;  //用户头像路径
                    fs.renameSync(files.avatar_file.path, displayUrl); //将上传的文件保存到用户头像路径下
                    displayUrl = displayUrl.substring(6);    //去除public
                    result = {
                        result: 1,
                        url: displayUrl  + '?t=' + tools.getTimestamp()       //如果不添加时间戳，图片不会重新加载
                    };
                    Blogger.update({_id: req.session.user._id}, {$set: {photo: displayUrl}}).exec(function (req, res) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
                res.json(result);
            });
        }catch (e){
            console.log(e);
        }
};