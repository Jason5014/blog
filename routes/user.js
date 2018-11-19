var router = require('express').Router(),
    fs = require('fs'),
    upload = require('../utility/upload'),
    tools = require('../utility/tools'),
    mongoose = require('mongoose'),
    bcrypt = require('bcryptjs'),
    Blog = require('../models/blogs'),
    Blogger = require('../models/bloggers'),
    Comment = require('../models/comments'),
    Category = require('../models/categorys'),
    CustomCategory = require('../models/CustomCategorys'),
    Photo = require('../models/photos'),
    photo = require('../controller/photo'),
    validators = require('../utility/validators'),
    example = require('../utility/BlogExample');

//登录检查中间件
router.use(function(req, res, next){
    //用来存放用户近期的操作：阅读访问，文章点赞
    if(!req.session.actions){
        req.session.actions = {
            reading: [],
            praise: [],
            likes: []
        }
    }
    //验证用户是否登录
    if(req.session.user){
        res.locals.user = null;
        Blogger.findById(req.session.user._id).exec(function(err, doc){
            if(err) console.log(err);
            if(doc) res.locals.user = doc ; // 更新user信息
            next();
        });
    }
    else
        res.render('Visitor/login', {title: '登录'}); //当用户还未登录，跳转到login页面
});

/*
    用户路由总览
    1-1. 请求个人主页
    1-2. 修改头像
    2-1. 请求个人信息编辑页面
    2-2. 获取用户编辑信息
    2-3. 处理个人编辑信息
    3-1. 请求博客管理页面
    3-2. 修改文章评论权限
    3-3. 处理隐藏文章操作
    3-4. 处理显示文章操作
    3-5. 处理文章置顶操作
    3-6. 处理文章取消置顶操作
    3-7. 处理删除文章操作
    3-8. 处理撤销文章删除操作
    3-9. 处理文章销毁操作
    3-10. 获取用户个人分类信息
    3-11. 处理添加个人分类操作
    3-12. 处理修改个人分类操作
    3-13. 处理删除个人分类操作
    4-1. 请求编辑博客页面
    4-2. 获取编辑博客信息
    4-3. 暂存编辑博客信息
    4-4. 上传博客图片
    4-5. 处理编辑博客提交数据
    5. 请求相册页面 *
    6. 处理发表评论操作
    7-1. 处理收藏文章操作
    8-2. 处理取消收藏文章操作
    9-1. 查询当前用户是否关注该博主
    9-2. 处理关注操作
    9-3. 处理取消关注操作
    10. 获取博主关注/粉丝分页数据
 */

//请求个人主页
router.get('/userinfo', function(req, res){
    var blogger = {};
    var Promise = Blogger.findOne({_id: req.session.user._id}, {follows: 0, fans: 0, collections: 0}).exec();
    Promise.then(function(doc){
        blogger = doc;
        if(doc){
            res.render('Blog/userinfo', {title: blogger.nickname, blogger: blogger});
        }else{
            throw new Error();
        }
    }).catch(function(err){
        console.log(err);
        res.redirect('Visitor/info', {title: '博主找不到', info: 'blog-not-found'})
    });
});

//修改头像
router.post('/photo/change', photo.upload);

//请求修改密码页面
router.get('/change/password', function(req, res){
    res.render('Blog/changePassword', {title: '修改密码'});
});

//修改密码
router.post('/change/password', function(req, res){
    var data = req.body;
    var msg = '';
    if(!data.oldPassword || data.oldPassword.length > 12 || data.oldPassword.length < 6){
        msg = '旧密码不为空或旧密码格式不对';
    }else if(!data.newPassword || data.oldPassword.length > 12 || data.oldPassword.length < 6){
        msg = '新密码不为空或新密码格式不对';
    }else if(data.newPassword !== data.password2){
        msg = '确认密码不一致';
    }else if (data.oldPassword === data.newPassword){
        msg = '新旧密码不能相同';
    }else{
        Blogger.findOne({_id: req.session.user._id}).exec(function(err, doc){
            if(err) console.log(err);
            if(doc){
                if(Blogger.authenticate(data.oldPassword, doc.password)){
                    var salt = bcrypt.genSaltSync(10);
                    var newPassword = bcrypt.hashSync(data.newPassword, salt);  //对密码进行加密
                    Blogger.update({_id: req.session.user._id}, {$set: {password: newPassword}}).exec();
                    res.json({success: 1, msg: '修改密码成功'});
                }
                else res.json({success: 0, msg: '旧密码错误'});
            }
            else res.json({success: 0, msg: '用户未找到'});
        });
    }
    if(msg) res.json({success: 0, msg: msg});
});

//请求个人信息编辑页面
router.get('/editinfo', function(req, res){
    res.render('Blog/editinfo', {title: '编辑个人信息'});
});

//获取用户编辑信息
router.get('/blogger/info', function(req, res){
    Blogger.findOne({_id: req.session.user._id}, {nickname: 1, name: 1, birthday: 1, sex: 1, address: 1, position: 1, industry: 1, email: 1, phone: 1, profile: 1})
        .exec(function(err, doc){
            if(err) console.log(err);
            if(doc) res.json({ success: 1, data: doc});
            else res.json({success: 0, msg: '无法获取用户信息'});
        });
});

//处理个人编辑信息
router.post('/editinfo', function(req, res){
    var blogger = req.body;
    if(blogger.phone && !validators.phone(blogger.phone)){
        res.json({
            success: 0,
            msg: '手机号格式不正确'
        });
    }else if(blogger.birthday && !validators.date(blogger.birthday)){
        res.json({
            success: 0,
            msg: '生日格式不正确'
        });
    }else{
        delete blogger._id;
        delete blogger.id;
        Blogger.update({_id: req.session.user._id}, {$set: blogger}).exec(function(err, doc){
            if(err) console.log(err);
            if(doc) res.json({success: 1, msg: '修改成功'});
            else res.json({success: 0, msg: '昵称已被占用'});
        });
    }
});

//请求博客管理页面
router.get('/blogmanager', function(req, res){
    var Promise = Blogger.findById(req.session.user._id, {id: 1, nickname: 1, photo: 1}).exec();
    Promise.then(function(doc){
        res.render('Blog/blogmanager', {title: '博客管理', tab: req.params.id, blogger: doc});
    }).catch(function(err){
        console.log(err);
        res.render('Visitor/info', {title: '系统错误', info: 'system-error'});
    });
});

//获取当前用户的所有个人分类
router.get('/CustomCategory/list', function(req, res){
    CustomCategory.find({blogger: req.session.user._id}, {name: 1})
        .exec(function(err, doc){
            if(err) console.log(err);
            if(doc) res.json({success: 1, data: doc});
            else res.json({success: 0, msg: '暂无分类'});
        });
});

//置顶
router.get('/setTop/blog/:id', function(req, res){
    var id = req.params.id;
    var top = 0;
    if(id){
        var Promise = Blog.find({blogger: req.session.user._id}).sort({top: -1}).limit(1).exec();
        Promise.then(function(doc){
            doc = doc[0];
            if(id !== doc.id){
                top = doc.top + 1;
                return Blog.update({id: id}, {$set: {top: top}}).exec();
            }
            else return  {ok: 1};
        }).then(function(doc){
            if(doc.ok) res.json({success: 1, data: top});
            else res.json({success: 0, msg: '置顶失败'});
        }).catch(function(err){
            console.log(err);
            res.json({success: 0, msg: '置顶失败'});
        });
    }
    else res.json({success: 0, msg: '请求参数有误'});
});

//取消置顶
router.get('/cancelTop/blog/:id', function(req, res){
    var id = req.params.id;
    if(id){
        var Promise = Blog.update({id: id}, {$set: {top: 0}}).exec();
        Promise.then(function(doc){
            if(doc.ok) res.json({success: 1, msg: '取消置顶成功', data: 0});
            else res.json({success: 0, msg: '取消置顶失败'})
        }).catch(function(err){
            if(err) console.log(err);
            res.json({success: 0, msg: "取消置顶失败"})
        })
    }
    else res.json({success: 0, msg: '请求参数有误'});
});

//显示文章
router.get('/show/blog/:id', function(req, res){
    var id = req.params.id;
    if(id){
        Blog.update({id: id}, {$set: {visible: true}}).exec(function(err, doc){
            if(err) console.log(err);
            if(doc.ok) res.json({success: 1, msg: '已经设定文章为所有人可见'});
            else res.json({success: 0, msg: '显示文章失败'});
        })
    }else res.json({success: 0, msg: '请求参数有误'});
});

//隐藏文章
router.get('/hide/blog/:id', function(req, res){
    var id = req.params.id;
    if(id){
        Blog.update({id: id}, {$set: {visible: false}}).exec(function(err, doc){
            if(err) console.log(err);
            if(doc.ok) res.json({success: 1, msg: '已经设定文章为仅自己可见'});
            else res.json({success: 0, msg: '显示文章失败'});
        })
    }else res.json({success: 0, msg: '请求参数有误'});
});

//允许评论
router.get('/reviewable/blog/:id', function(req, res){
    var id = req.params.id;
    if(id){
        Blog.update({id: id}, {$set: {reviewable: true}}).exec(function(err, doc){
            if(err) console.log(err);
            if(doc.ok) res.json({success: 1});
            else res.json({success: 0, msg: '操作失败'});
        })
    }else res.json({success: 0, msg: '请求参数有误'});
});

//禁止评论
router.get('/unreviewable/blog/:id', function(req, res){
    var id = req.params.id;
    if(id){
        Blog.update({id: id}, {$set: {reviewable: false}}).exec(function(err, doc){
            if(err) console.log(err);
            if(doc.ok) res.json({success: 1});
            else res.json({success: 0, msg: '操作失败'});
        })
    }else res.json({success: 0, msg: '请求参数有误'});
});

//删除文章
router.get('/remove/blog/:id', function(req, res){
    var id = req.params.id;
    if(id) Blog.update({id: id}, {$set: {status: 4}}, function(err, doc){
            if(err) console.log(err);
            if(doc.ok) res.json({success: 1, data: '删除成功'});
            else res.json({success: 0, msg: '删除失败'});
        });
    else res.json({success: 0, msg: '请求参数有误'});
});

//还原文章
router.get('/return/blog/:id', function(req, res){
    var id = req.params.id;
    if(id)
        Blog.update({id: id}, {$set: {status: 0}}, function(err, doc){
            if(err) console.log(err);
            if(doc.ok) res.json({success: 1, data: '还原成功'});
            else res.json({success: 0, msg: '还原失败'});
        });
    else res.json({success: 0, msg: '请求参数有误'});
});

//销毁文章
router.get('/destroy/blog/:id', function(req, res){
    var id = req.params.id;
    if(id){
        Blog.remove({id: id}, function(err, doc){
            if(err) console.log(err);
            if(doc.result.ok) res.json({success: 1, data: '销毁成功'});
            else res.json({success: 0, msg: '销毁失败'});
        });
        Comment.remove({blog: id}).exec();
        Photo.remove({blog: id}).exec();
        var fileUrl = 'public/images/upload/'+ req.session.user.id + '/' + id;
        if(fs.existsSync(fileUrl)){
            tools.emptyDir(fileUrl);
        }
    }else res.json({success: 0, msg: '请求参数有误'});
});

//添加个人分类
router.get('/add/customCategory/:name', function(req, res){
    CustomCategory.findOne({blogger: req.session.user._id, name: req.params.name}).exec(function(err, doc){
        if(err) console.log(err);
        if(doc) res.json({success: 0, msg: '标签名已用过'});
        else {
            var customCategory = new CustomCategory({
                name: req.params.name,
                blogger: req.session.user._id
            });
            customCategory.save(function(err, doc){
                if(err) console.log(err);
                if(doc) res.json({success: 1, data: req.params.name});
                else res.json({success: 0, msg: '添加分类失败'});
            });
        }
    });
});

//修改个人分类
router.get('/edit/customCategory/:id', function(req, res){
    CustomCategory.findOne({_id: {$ne: req.params.id}, blogger: req.session.user._id, name: req.query.name}).exec(function(err,doc){
        if(err) console.log(err);
        if(doc) res.json({success: 0, msg: '标签名已用过'});
        else {
            CustomCategory.update({_id: req.params.id}, {$set: {name: req.query.name}}).exec(function(err, doc){
                if(err) console.log(err);
                if(doc) res.json({success: 1, data: req.query.name});
                else res.json({success: 0, msg: '修改分类失败'})
            });
        }
    });
});

//删除个人分类
router.get('/remove/customCategory/:id', function(req, res){
    var Promise = Blog.find({blogger: req.session.user._id, customCategory: req.params.id}).exec();
    Promise.then(function(doc){
        if(doc.length > 0) res.json({success: 0, msg: '该分类下还有文章，无法删除'});
        else
            CustomCategory.remove({_id: req.params.id}).exec(function(err, doc){
                if(err) console.log(err);
                if(doc.result.ok) res.json({success: 1, msg: '删除分类成功'});
                else res.json({success: 0, msg: '删除分类失败'});
            });
    }).catch(function(err){
        console.log(err);
        res.json({success: 0, msg: '系统错误'});
    });

});

//请求编辑博客页面
router.get('/blogging/:id', function(req, res){
    var categorys = [];
    var customCategorys = [];
    var Promise = Category.find({}).exec();
    Promise.then(function(doc){
        categorys = doc;
        return CustomCategory.find({blogger: req.session.user._id}).exec();
    }).then(function(doc){
        customCategorys = doc;
        res.render('Blog/blogging', {title: '写博客', categorys: categorys, customCategorys: customCategorys});
    }).catch(function(err){
        console.log(err);
        res.render('Visitor/info', {title: '系统错误', info: 'system-error'});
    });
});

//获取编辑的文章
router.get('/post/:id', function(req, res){
    var id = req.params.id;
    if(id === 'new'){
        var e = req.session.user['blog'+id] || {
            _id: new mongoose.Types.ObjectId(),
            id: tools.getTimestamp(),
            title: example.title,
            content: example.content,
            blogger: req.session.user._id,
            status: 0,
            visible: true,
            category: "0",
            customCategory: [],
            labels: []
        };
        req.session.user.currentBlog = e;
        res.json({success: 1,data: e});
    }
    else{
        if(req.session.user['blog'+id])
            res.json({success: 1, data: req.session.user['blog'+id]});
        else
            Blog.findOne({blogger: req.session.user._id, id: id})
                .exec(function(err, doc){
                    if(err) console.log(err);
                    if(doc) {
                        req.session.user.currentBlog = doc;
                        res.json({success: 1,data: doc});
                    }
                    else res.json({success: 0,data: '文章不存在'});
                });
    }
});

//暂存博客内容
router.post('/save/blogging/:id', function(req, res){
    var id = req.params.id;
    var blog = req.body;
    if(id && blog && req.session.user){
        req.session.user['blog'+id] = blog;
    }
    res.json({success: 1});
});

//取消编辑
router.get('/cancel/blogging/:id', function(req, res){
    if(req.session.user['blog'+ req.params.id])
    {
        delete req.session.user['blog'+req.params.id];
        res.json({success: 1});
    }
    else res.json({success: 0});
});

//图片上传
router.post('/imageUpload', upload.single('editormd-image-file'), function(req, res){
    var file = req.file,
        photoFolder = 'public/images/upload/'+req.session.user.id,
        oldPath = file.path;
        //创建用户文件夹
        if(!fs.existsSync(photoFolder)){
            fs.mkdirSync(photoFolder);
        }
        //创建博客文件夹
        photoFolder = photoFolder + '/' + req.session.user.currentBlog.id;
        if(!fs.existsSync(photoFolder)){
            fs.mkdirSync(photoFolder);
        }
        //生成新路径
        var newPath = photoFolder + '/' + file.filename;
        fs.renameSync(oldPath, newPath);
    var url = newPath.substring('public'.length);
    new Photo({
        title: req.file.originalname,
        blog: req.session.user.currentBlog._id,
        blogger: req.session.user._id,
        url: url
    }).save(function(err, doc){
        if(err) console.log(err);
        if(doc){
            res.json({ success: 1, message: '上传成功', url: url });
        }else{
            var fs = require('fs');
            fs.unlink(file.path);   //如果上传失败，则删除已经保存的图片
            res.json({ success: 0, message: '上传失败' });
        }
    });
});

//保存博客内容
router.post('/blogging/:id', function(req, res){
    var blog = req.body;
    var id = req.params.id;
    if(blog){
        if(id !== 'new'){
            Blog.findOne({id: {$ne: id}, title: blog.title, blogger: req.session.user._id}).exec(function(err, doc){
                if(err) console.log(err);
                if(doc) res.json({success: 0, msg: '标题您已用过，无法重复使用'});
                else{
                    //修改文章
                    var update = {
                        title: blog.title,
                        content: blog.content,
                        labels: blog.labels,
                        status: blog.status,
                        visible: blog.visible,
                        customCategory: blog.customCategory,
                        category: blog.category
                    };
                    Blog.update({id: id}, {$set: update})
                        .exec(function(err, doc){
                            if(err) console.log(err);
                            if(doc.ok) {
                                delete req.session.user['blog'+doc.id];
                                res.json({success: 1, msg: '修改成功'});
                            }
                            else res.json({success: 0, msg: '修改失败'});
                        });
                }
            });
        }
        else{
            Blog.findOne({title: blog.title}).exec(function(err, doc){
                if(err) console.log(err);
                if(doc) res.json({success: 0, msg: '标题您已用过，无法重复使用'});
                else{
                    blog.collected = [];
                    new Blog(blog).save(function(err, doc){
                        if(err) console.log(err);
                        if(doc) {
                            delete req.session.user['blog'+doc.id];
                            res.json({ success: 1, data: '添加成功' });
                        }
                        else res.json({ success: 0, msg: '失败' });
                    });
                }
            });
        }
    }
    else res.json({ success: 0, msg: '请求参数错误' });
});

//相册
router.get('/album', function(req, res){
    res.render('Blog/album.jade', {title: '个人相册'});
});

//发表评论
router.post('/comment', function(req, res){
    if(req.body.blogger === req.session.user._id)
        res.json({ success: 0, msg: req.body.reply ? '无法回复自己' : '无法评论自己的博客' });
    else {
        var id = new mongoose.Types.ObjectId();
        var comment = new Comment({
            _id: id,
            blog: req.body.blog,
            blogger: req.body.blogger,
            publisher: req.session.user._id,
            reply: req.body.reply,
            content: req.body.reply ? req.body.content.substring(req.body.content.indexOf('[/reply]') + 8) : req.body.content,
            group: req.body.reply ? req.body.group : id     // 当回复别人时，为回复对象的分组，否则自己新建分组
        });
        var Promise = comment.save();
        Promise.then(function (doc) {
            if (doc) {
                //评论计数器加一
                Blog.update({_id: req.body.blog}, {$inc: {comments: 1}}).exec();
                Blogger.update({_id: req.session.user._id}, {$inc: {comments: 1}}).exec();
                res.json({ success: 1, data: doc, msg: '发表评论成功' });
            }
            else res.json({ success: 0, msg: '发表评论失败' });
        }).catch(function(err){
            console.log(err);
            res.json({ success: 0, msg: '发表评论失败' });
        });
    }
});

//收藏文章
router.get('/collect/post/:id', function(req, res){
    var id = req.params.id;
    if(id){
        Blog.update({_id: id}, {$addToSet: {collected: req.session.user._id}}).exec(function(){
            Blogger.update({id: req.session.user.id}, {$addToSet: {collections: id}}).exec(function() {
                res.json({
                    success: 1,
                    msg: '收藏成功'
                });
            });
        });
    }else{
        res.json({
            success: 0,
            msg: '收藏失败'
        });
    }
});

//取消收藏文章
router.get('/collected/post/:id', function(req, res){
    var id = req.params.id;
    if(id) {
        Blog.update({_id: id}, {$pull: {collected: req.session.user._id}}).exec(function(err1){
            Blogger.update({id: req.session.user.id}, {$pull: {collections: id}}).exec(function(err2, doc){
                if(err1 || err2) console.log(err1, err2);
                if(doc.ok) res.json({success: 1,data: '取消收藏成功'});
                else res.json({success: 0, msg: '取消收藏失败' })
            });
        });
    }else{
        res.json({
            success: 0,
            msg: '取消收藏失败'
        })
    }
});

//查询是否关注该用户
router.get('/focused/:id', function(req, res){
    Blogger.findOne( {_id: req.params.id, fans: req.session.user._id}).exec(function(err, doc){
        if(err) console.log(err);
        if(doc) res.json({success: 1});
        else res.json({success: 0});
    })
});

//关注用户
router.get('/focus/:id', function(req, res){
    var id = req.params.id;
    var flag = false;   //用户判断是否将当前用户添加至关注对象的粉丝列表中，以方便回滚
    if(id === req.session.user._id)
        res.json({ success: 0, msg: '无法关注自己' });
    else
        Blogger.findByIdAndUpdate( id, {$addToSet: {fans: req.session.user._id}}).exec()
            .then(function(){
                flag = true;
                return Blogger.findByIdAndUpdate( req.session.user._id,{$addToSet: {follows: id}} ).exec();
            })
            .then(function(){
                res.json({ success: 1, msg: '关注成功' });
            })
            .catch(function(err){
                if(err) console.log(err);
                if(flag){
                    Blogger.findByIdAndUpdate( id, {'$pull': {fans: req.session.user._id}});
                    res.json({ success: 0, msg: '无法关注' });
                }
                else
                    res.json({ success: 0, msg: '关注的用户不存在' });
            });
});

//取消关注
router.get('/cancelFocus/:id', function(req, res){
    var id = req.params.id;
    Blogger.findByIdAndUpdate( id, {'$pull': {fans: req.session.user._id}}).exec(function(){
        Blogger.findByIdAndUpdate( req.session.user._id, {'$pull': {follows: id}}).exec(function(){
            res.json({
                success: 1,
                msg: '取消关注成功'
            });
        });
    });
});

//请求意见反馈表单
router.get('/feedback', function(req, res){
    res.render('Blog/feedback', {title: '意见反馈'});
});

//处理意见反馈表单
router.post('/feedback', function (req, res) {
    var feedback = req.body;
    var Feedback = require('../models/feedbacks');
    new Feedback({
        types: feedback.types,
        suggest: feedback.suggest,
        blogger: req.session.user._id
        }).save(function(err, doc){
            if(err) console.log(err);
            if(doc) {
                console.log(doc);
                res.json({success: 1})
            }else{
                res.json({success: 0});
            }
    });
});

//博主分页查询
router.get('/page/blogger', function(req, res){
    var options = req.query;
    var limit = parseInt(options.size) || 5;
    var skip = parseInt( options.page - 1) * limit || 0;
    var query = {};
    /* 实现一
    if(options.follows)    // 我的关注
        query.fans = req.session.user._id;
    if(options.fans)   // 我的粉丝即为关注我的
        query.follows = req.session.user._id;
    var Promise = Blogger.count(query).exec();
    Promise.then(function(doc){
        count = doc;
        return Blogger.find(query, select).limit(limit).skip(skip).exec();
    }).then(function(doc){
        res.json({success: 1, data: doc, count: count});
    }).catch(function(err){
        console.log(err);
        res.json({success: 0, msg: '系统错误'});
    });
    */
    //实现二
    var population = {select: {id: 1, nickname: 1, photo: 1}};
    var result = [];
    query._id = req.session.user._id;
    if(options.follows)
        population.path = 'follows';
    if(options.fans)
        population.path = 'fans';
    if(options.collections)
        population = {
            path: 'collections',
            select: {title: 1, id: 1, published: 1},
            populate: {
                path: 'blogger',
                select: {id: 1, nickname: 1}
            }
        };
    Blogger.findOne(query).populate(population).exec(function(err, doc){
        if(err) console.log(err);
        if(doc) {
            if(options.follows)
                result = doc.follows;
            if(options.fans)
                result = doc.fans;
            if(options.collections)
                result = doc.collections;
            var count = result.length;
            res.json({success: 1, data: result.splice(skip, skip + limit), count: count});
        }
        else res.json({success: 0, msg: '用户不存在'});
    })
});

//博主评论分页查询
router.get('/page/comment', function(req, res){
    var options = req.query;
    var query = {};
    var population = {};
    var select = {__v: 0};
    var sort = '-published';
    var limit = parseInt(options.size) || 5;
    var skip = parseInt(options.page - 1) * limit || 0;
    var count = 0;
    if(options.blogger){    // 查询评论我的
        query.blogger = req.session.user._id;
        population = { path: 'publisher blog', select: {id: 1, nickname: 1, title: 1}};
    }
    if(options.publisher){   // 查询我评论的
        query.publisher = req.session.user._id;
        population = { path: 'blogger blog', select: {id: 1, nickname: 1, title: 1}};
    }
    var Promise = Comment.count(query).exec();
    Promise.then(function(doc){
        count = doc;
        return  Comment.find(query, select)
            .populate(population)
            .sort(sort).limit(limit).skip(skip).exec();
    }).then(function(doc){
        res.json({success: 1, data: doc, count: count});
    }).catch(function(err){
        console.log(err);
        res.json({success: 0, msg: '系统错误'});
    });
});

//个人分类分页查询
router.get('/page/customCategory', function(req, res){
    var options = req.query;
    var limit = parseInt(options.size) || 5;
    var skip = parseInt(options.page - 1) * limit || 0;
    var query = {
        blogger: req.session.user._id
    };
    var count = 0;
    CustomCategory.find(query).sort('-published').exec(function(err, doc){
        if(err) console.log(err);
        if(doc) {
            count = doc.length;
            res.json({success: 1, data: doc.splice(skip, skip + limit), count: count});
        }
        else res.json({success: 0, msg: '获取分类失败'})
    });
});

module.exports = router;