var router = require('express').Router(),
    vCode = require('svg-captcha'),
    marked = require('marked'),
    mongoose = require('mongoose'),
    bcrypt = require('bcryptjs'),
    config = require('../config'),
    Category = require('../models/categorys'),
    CustomCategory = require('../models/CustomCategorys'),
    Comment = require('../models/comments'),
    Blog = require('../models/blogs'),
    Blogger = require('../models/bloggers'),
    tools = require('../utility/tools'),
    validators = require('../utility/validators');

// 初始化user中间件
router.use(function(req, res, next){
    if(!req.session.actions){
        req.session.actions = {
            reading: [],
            praise: [],
            likes: []
        }
    }
    if(req.session.user){
        res.locals.user = null;
        Blogger.findById(req.session.user._id).exec(function(err, doc){
            if(err) console.log(err);
            if(doc) res.locals.user = doc ; // 更新user信息
            next();
        });
    }else{
        next();
    }

});

/*
    公共路由总览
    1. 请求主页页面
    2. 请求文章页面
    3-1. 请求博主页面
    3-2. 请求博主信息页面
    4. 请求排行榜页面
    5-1. 请求登录页面
    5-2. 处理登录信息
    6-1. 请求注册页面
    6-2. 获取验证码
    6-3. 处理注册信息
    7. 请求搜索页面
    8-1. 请求用户反馈页面   *
    8-2. 处理用户反馈信息   *
    9. 请求文章分页数据
    10. 请求评论分页数据
    11-1. 处理点赞操作
    11-2. 处理取消点赞操作
    12. 请求用户信息
    13. 请求分类信息
    14. 处理用户退出操作
 */

//请求主页
router.get('/', function(req, res, next){
    var categorys = [];
    var blogs = [];
    var Promise = Category.find({}, {name: 1, _id: 0}).exec();
    Promise.then(function(doc){
            categorys = doc;
            var query = {};
            categorys[0] ? query.category = categorys[0] : false;
            return Blog.find({status: 1}, {_id: 0, comments: 0, reviewable: 0, customCategory: 0, top: 0})
                .populate({path: 'blogger', select: {id: 1, nickname: 1, photo: 1}})
                .sort({reading: -1}).limit(5).exec();
        })
        .then(function(doc){
            blogs = doc;
            for(var i in blogs){
                blogs[i].content = blogs[i].content.substring(0, 100);
            }
            res.render('Visitor/home', {title: '主页', categorys: categorys, blogs: blogs});
        })
        .catch(function(err){
            console.log(err);
            res.render('Visitor/home', {title: '主页', categorys: categorys, blogs: blogs});
        });
});

//请求文章
router.get('/post/:id', function(req, res){
    var id = req.params.id;
    if(id){
        var blog = {};
        var blogs = [];
        var newBlogs = [];
        var action = {
            ip: tools.getReqRemoteIp(req),
            blog: id
        };
        var praised =false;
        var collected = false;
        if(req.session.actions.praise.length !== 0 && req.session.actions.praise.findIndex((value)=>{
            return tools.isEqual(value, action);
        }) !== -1){
            praised = true;
        }
        if(req.session.actions.reading.length === 0 || req.session.actions.reading.findIndex((value)=>{
                return tools.isEqual(value, action);
            }) === -1){
            req.session.actions.reading.push(action);   //添加一条阅读记录
            Blog.update({id: id}, {$inc: {reading: 1}}).exec();
        }
        var Promise = Blog.findOne({id: id}).populate({path: 'blogger'}).exec();
        Promise.then(function(doc){
            if(!doc)
                throw new Error('找不到文章');
            else {
                blog = doc;
                if (req.session.user && blog.collected.length > 0 && blog.collected.indexOf(req.session.user._id) !== -1)
                    collected = true;
                var rendererMD = new marked.Renderer();
                marked.setOptions({
                    renderer: rendererMD,
                    gfm: true,
                    tables: true,
                    breaks: false,
                    pedantic: false,
                    sanitize: false,
                    smartLists: true,
                    smartypants: false,
                    highlight: function (code) {
                        var lines = code.split('\n');
                        var newCode = lines.map(function (line) {
                            return '<li>' + line.replace(/</g, '&lt') + '</li>';
                        });
                        code = newCode.join('\n');
                        code = '<ol>' + code + '</ol>';
                        return code;
                    }
                });
                blog.content = marked(blog.content);

                return Blog.find({status: 1}, {id: 1, title: 1, reading: 1})
                    .sort({reading: -1}).limit(5).exec();
            }
        }).then(function(doc){
            blogs = doc;
            return Blog.find({blogger: blog.blogger._id, status: 1, visible: true}, {id: 1, title: 1, published: 1})
                .sort({published: -1}).exec();
        }).then(function(doc){
            newBlogs = doc;
            res.render('Visitor/post', {title: blog.title, blog: blog, blogs: blogs, newBlogs: newBlogs, praised: praised, collected: collected});
        }).catch(function(err){
            console.log(err);
            res.render('Visitor/info', {title: '文章未找到', infoType: 'post-not-found'})
        });
    }else{
        res.render('Visitor/info', {title: '请求参数有误'})
    }
});

//请求博主
router.get('/blog/:id', function(req, res){
    var blogger = {};   //博主
    var blogs = [];     //博主的热门文章
    var customCategorys = [];   //个人分类
    var archives = [];  //文章存档
    var Promise = Blogger.findOne({id: req.params.id}, {password: 0}).exec();
    Promise.then(function (doc) {
            if (doc) {
                blogger = doc;
                return Blog.find({blogger: blogger._id, status: 1, visible: true, reading: {$gt: 0}}, {id: 1, title: 1, reading: 1})
                    .sort({reading: -1}).limit(5).exec();
            } else {
                res.render('Visitor/info', {title: '博主不存在', infoType: 'blog-not-found'});
            }
        }).then(function (doc) {
            blogs = doc;
            /*按月份分组
            db.blogs.aggregate([
                {$group: { _id:{ $dateToString: { format: '%Y年%m月', date: '$published'} }, count: {$sum: 1}} },
                {$project: {published: '$_id', count: 1}},
                {$sort: {count: -1}}，
                {limit: 6}     // 近六个月
            ]);
            结果示例:
                {
                    "_id" : "2018-02",
                    "count" : 5.0,
                    "published" : "2018-02"
                }
             */
            /*按个人分类查询
            //先查询用户的所有个人分类 customCategorys
            db.blogs.aggregate([
                {$match: { blogger: ObjectId("5a8053177a5da71e2c43ea6c"), customCategory: {$in: [...]}}},
                {$group:{ _id: {'$customCategory', count: {$sum: 1}}},
                {$sort: {count: -1}}
             ])
             结果示例：
             {
                "_id" : [ ObjectId("5a814f3ab813091470d74a72") ] }, // 最终结果为数组
                "count" : 1.0,
            }
             */
            // 文章存档查询
            return Blog.aggregate([
                {$match: {blogger: blogger._id, status: 1, visible: true}},
                {$group: { _id:{ $dateToString: { format: '%Y-%m', date: '$published'} }, count: {$sum: 1}} },
                {$project: {published: '$_id', count: 1}},
                {$sort: {count: -1}},
                {$limit: 6}     // 近六个月
            ]).exec();
        }).then(function (doc) {
            archives = doc;
            // 个人分类查询 - 只显示非空分类
            return Blog.aggregate([
                    {$match: {blogger: blogger._id, status: 1, visible: true}},
                    {$unwind: '$customCategory'},
                    {$group: {_id: '$customCategory', number: {$sum: 1}}},
                    {$sort: {number: -1}}
                ]).exec();
        }).then(function(doc){
            return CustomCategory.populate(doc, {path: '_id', select: {name : 1}});
        }).then(function(doc){
            customCategorys = doc;
            /* 结果示例
            {
                _id: { _id: 5a897f74cb84e233d8ad2c14, name: 'HTML' },
                number: 1
            }
             */
            res.render('Visitor/blog', { title: '博主', blogger: blogger, blogs: blogs, customCategorys: customCategorys, archives: archives });
        }).catch(function (err) {
            console.log(err);
            res.render('Visitor/info', {title: '系统错误'});
        });
});

//请求博主信息页面
router.get('/bloginfo/:id', function(req, res){
    var id = req.params.id;
    var blogger = {};
    if(id){
        Blogger.findOne({id: id})
            .populate({path: 'fans follows', select: {id: 1, photo: 1, nickname: 1}}).exec(function(err, doc){
            if(err) console.log(err);
            if(doc){
                blogger = doc;
                res.render('Visitor/bloginfo', {title: blogger.nickname + ' - 个人信息', blogger: blogger});
            }
            else
                res.render('Visitor/info', {title: '系统错误', info: 'system-error'});
        })
    }
    else res.render('Visitor/info', {title: '博主找不到', info: 'blog-not-found'});
});

//请求排行榜
router.get('/ranking', function(req, res){
    var fans = [],
        review = [],
        reading = [],
        praise = [],
        collect = [],
        blog = [];
    var Promise = Blogger.aggregate([
        {$unwind: '$fans'},
        {$group: {_id: {id: '$id',nickname: '$nickname'}, count: {$sum: 1}}},
        {$project: {id: '$_id.id', nickname: '$_id.nickname', count: '$count'}},
        {$sort: {count: -1}},
        {$limit: 10}
    ]).exec();
    Promise.then(function(doc){
        fans = doc;
        return Blogger.find({comments: {$gt: 0}}, {id: 1, nickname: 1, comments: 1}).sort({comments: -1}).limit(10).exec();
    }).then(function(doc){
        review = doc;
        return Blog.find({reading: {$gt: 0}, status: 1, visible: true}, {id: 1, title: 1, reading: 1}).sort({reading: -1}).limit(10).exec();
    }).then(function(doc){
        reading = doc;
        return Blog.find({praise: {$gt: 0}, status: 1, visible: true}, {id: 1, title: 1, praise: 1}).sort({praise: -1}).limit(10).exec();
    }).then(function(doc){
        praise = doc;
        return Blog.aggregate([
            {$match: {status: 1, visible: true}},
            {$group: {_id: '$blogger', count: {$sum: 1}}},
            {$sort: {count: -1}},
            {$limit: 10}
        ]).exec();
    }).then(function(doc) {
        return Blogger.populate(doc, {path: '_id', select: {nickname: 1, id: 1}});
    }).then(function(doc){
        blog = doc;
        return Blog.aggregate([
            {$match: {status: 1, visible: true}},
            {$unwind: '$collected'},
            {$group: {_id: {id: '$id', 'title': '$title'}, count: {$sum: 1}}},
            {$project: {id: '$_id.id', title: '$_id.title', count: '$count'}},
            {$sort: {count: -1}},
            {$limit: 10}
        ]).exec();
    }).then(function(doc){
        collect = doc;
        res.render('Visitor/ranking', {title: '排行榜', fans: fans, review: review, reading: reading, praise: praise, blog: blog, collect: collect});
    }).catch(function(err){
        console.log(err);
        res.render('Visitor/info', {title: '系统错误'});
    });
    // blogger： blog, fans, comments
    /*fans排序实现
    db.bloggers.aggregate([
        {$unwind: '$fans'},
        {$group: {
            _id: '$id',
            count: {$sum: 1}
            }},
         {$sort: {count: -1}},
         {$limit: 10}
    ])
    结果示例：
    {
        "_id" : "15184094782454",
        "count" : 2.0
    }
     */
    /*comments排序实现
    db.comments.aggregate([
        {$group: {
                _id: '$publisher',
                count: {$sum: 1}
            }},
        {$sort: {count: -1}},
        {$limit: 10}
    ])
    结果示例：
    {
        "_id" : ObjectId("5a8053177a5da71e2c43ea6c"),
        "count" : 9.0
    }
     */
    // blog: reading, collected, praise, comments
    /*reading排序实现
    db.blogs.find({}).sort({reading: -1}).limit(10)
     */
    /*praise排序实现
    db.blogs.find({}).sort({praise: -1}).limit(10)
     */
    /*comments排序实现
    db.blogs.find({}).sort({comments: -1}).limit(10)
     */
    /*collect排序实现
     */
});

//请求登录页
router.get('/login', function(req, res){
    res.render('Visitor/login', {title: '登录'});
});

//处理登录表单
router.post('/login', function(req, res){
    var user = req.body,
        msg = '';
    if(!user.email)
        msg = '邮箱不为空';
    else if(!validators.email(user.email))
        msg = '邮箱格式错误';
    else if(!user.password || user.password.length > 12 || user.password.length < 6)
        msg = '密码不为空或长度错误';
    else{
        Blogger.findOne({email: user.email.toLowerCase()})
            .exec(function(err, doc){
                if(err) console.log(err);
                if(!doc) res.json({status: 0, msg: '用户不存在'});
                else{
                    if(doc.islive){
                        if(Blogger.authenticate(user.password, doc.password)){
                            req.session.user = doc;
                            res.json({ status: 1, msg: '登录成功', data: doc._id });
                        }
                        else res.json({ status: 0, msg: '密码错误' }) ;
                    }
                    else
                        res.json({ status: 0, msg: '用户还未激活，请前往邮箱激活！'});

                }
            });
    }
    if(msg) res.json({status: 0, msg: msg});
});

//请求注册页
router.get('/register', function(req, res){
    res.render('Visitor/register', {title: '注册'});
});

//获取验证码
router.get('/getValidateCode', function(req, res){
    var svgCaptcha = vCode.create({ fontSize: 50, width: 115, height: 34 , background: '#cc9966', color: true});
    req.session.captcha = svgCaptcha.text.toLowerCase();
    res.type('svg');
    res.status(200).send(svgCaptcha.data);
});

//处理注册表单
router.post('/register', function(req, res) {
    var user = req.body;
    var msg = '';
    if(!user.validateCode || req.session.captcha !== user.validateCode.toLowerCase()){
        msg = '验证码错误';
    }else if(!user.email || !validators.email(user.email)){
        msg = '手机号格式不正确';
    }else if(!user.password || user.password.length < 6 || user.password.length > 12){
        msg = '密码长度为6~12个字符之间';
    }else if(user.password !== user.password2){
        msg = '密码不一致';
    }else{
        var blogger = new Blogger({
            id: tools.getTimestamp(),
            password: user.password,
            email: user.email.toLowerCase(),
            code: tools.getTimestamp(),
            islive: false,
            outdate: new Date(Date.now() + 24 * 60 * 60)       //过期时间为24小时
        });
        blogger.save(function(err, doc){
            if(err){
                console.log(err);
                res.json({ status: 0, msg: '该邮箱已注册', error: tools.getErrorMessage(err) });
            }
            else {
                //发送验证邮箱
                var mail = {
                    from: '博客 <15870608093@163.com>',
                    subject: '激活账号',
                    to: user.email,
                    html: '<h2>欢迎使用博客</h2><p>请点击激活： <a href="http://'+config.host+':'+config.port+'/checkCode?id='+doc.id+'&code='+doc.code+'">激活</a></p>'
                };
                tools.mailer(mail);
                res.json({ status: 1, msg: '注册成功，请前往邮箱验证！' });
            }
        });
    }
    if(msg) res.json({ status: 0, msg: msg });
});

//邮箱验证激活
router.get('/checkCode', function(req, res){
    var id = req.query.id;
    var code = req.query.code;
    Blogger.findOne({id: id}, function(err, doc){
        if(doc.islive) {
            res.render('Visitor/login', {title: '登录', msg: '邮箱已验证，请登录！'});
        }
        else if(doc.code === code && (doc.outdate > Date.now())> 0){
            Blogger.update({id: id}, {islive: true}, function(err){
                if(err)
                    res.render('Visitor/login', {title: '登录', error: '激活失败！'});
                else
                    res.render('Visitor/info', {title: '消息', info: 'checkout-success'});
            });
        }
        else
            res.render('Visitor/login', {title: '登录', error: '激活失败！'});
    });
});

//获取搜索页面
router.get('/search', function(req, res){
    var id = req.query.id;
    var blogs = [];
    var blogger = {};
    var newBlogs = [];
    if(id){
          var Promise = Blog.find({status: 1, visible: true}, {title: 1, id: 1, reading: 1})
              .sort({reading: -1}).limit(5).exec();
          Promise.then(function(doc){
              blogs = doc;
              return Blogger.findOne({_id: req.query.id}).exec();
          }).then(function(doc){
              if(doc){
                  blogger = doc;
                  return Blog.find({blogger: doc._id, status: 1, visible: true}, {title: 1, id: 1, reading: 1})
                      .sort({reading: -1}).limit(3).exec();
              }
              else
                  throw new Error('博主无法找到');
          }).then(function(doc){
              newBlogs = doc;
              res.render('Visitor/search', {title: req.query.q + ' - 搜索', blogs: blogs, blogger: blogger, newBlogs: newBlogs})
          }).catch(function(err){
              console.log(err);
              res.render('Visitor/search', {title: req.query.q + ' - 搜索', blogs: blogs});
          });
    }
    else
    //获取热文推荐
    Blog.find({status: 1, visible: true}, {title: 1, id: 1, reading: 1})
        .sort({reading: -1}).limit(5).exec(function(err, doc){
            if(err) console.log(err);
            blogs = doc;
            res.render('Visitor/search', {title: req.query.q + ' - 搜索', blogs: blogs});
        });
});

//搜索分页查询
router.get('/page/search', function(req, res){
    var options = req.query;
    var search = tools.formatSearch(options.q);
    var limit = parseInt(options.size) || 5;
    var skip = parseInt(options.page -1) * limit || 0;
    var query = {status: 1, visible: true, title: {$in: search}};
    var count = 0;
    var blogs = [];
    if(options.blogger) query.blogger = options.blogger;
    Blog.find(query).exec(function(err, doc){
        if(err) console.log(err);
        if(doc) {
            count = doc.length;
            blogs = doc.slice(skip, skip + limit);
            blogs.forEach(function(blog){
                blog.content = tools.formatContent(blog.content);
            });
            res.json({success: 1, data: blogs, count: count});
        }else
            res.json({success: 0, msg: '搜索失败'});
    });
});

//请求反馈消息
router.get('/info/:block', function(req, res){

    /*
    Info消息反馈页面——反馈信息类型:
        1. 注册成功		register-success
        2. 文章发布成功	post-publish-success
        3. 文章保存成功 post-save-success
        4. 文章修改成功	post-edit-success
        5. 文章未找到	post-not-found
        6. 博主找不到	blog-not-found
        7. 404页面找不到	page-not-found
        8. 请求参数有误	request-error
        9. 系统错误	system-error
        10. 意见反馈成功 feedback-success
        11. 举报成功 suggest-success
        12. 其他消息	default
     */

    var email = req.query.email;    //注册成功的邮箱
    var id = req.query.id;      //发布/编辑成功的博客ID

    res.render('Visitor/info', {title: '消息', info: req.params.block, id: id, fixed: true, email: email});
});

//请求文章分页数据
router.get('/page/blog', function(req, res){
    var options = req.query;
    var query = {
        visible: true,
        status: 1
    };
    var select = {__v: 0, labels: 0, customCategory: 0, content: 0};
    var population =  {path: 'blogger', select: {id: 1, photo: 1, nickname: 1}};
    var sort = options.sort ? options.sort + " -published" : '-published';
    var limit = parseInt(options.size) || 10;
    var skip = (parseInt(options.page) - 1) * limit || 0;
    var blogs = [];
    var count = 0;
    if(options.visible){
        delete query.visible;
    }
    if(options.status){
        options.status = parseInt(options.status);
        if(options.status < 0)
            query.status = {$ne: 4};
        else
            query.status = options.status;
    }
    if (options.blogger) {      // 查询某个博主的文章
        query.blogger = options.blogger;
        select.blogger = 0;
        population = false;
    }
    if (options.category) {     // 查询某个分类下的文章
        query.category = options.category;
    }
    if (options.customCategory) {   //查询博主的某个个人分类下的文章
        query.customCategory = options.customCategory;
        population = false;
    }
    if (options.published){
        //2013-10
        var start = new Date(options.published);
        //2013-11
        var nextMonth = parseInt(options.published.substring(5)) + 1;
        var end = new Date(options.published.replace(/\d\d$/, nextMonth));
        query.published = {$gte: start, $lt: end};
    }
    if (options.content){
        delete select.content;
    }
    if (req.session.user && options.collected){     //查询用户收藏的文章，仅限当前用户
        query.collected = req.session.user;
    }
    var Promise = Blog.count(query).exec();
    Promise.then(function (doc) {
        count = doc;
        if(population)
            return Blog.find(query, select).populate(population)
                .sort(sort).skip(skip).limit(limit).exec();
        else
            return Blog.find(query, select)
                .sort(sort).skip(skip).limit(limit).exec();
    }).then(function(doc){
        blogs = doc;
        if(options.content){
            blogs.forEach(function(blog){
                blog.content = tools.formatContent(blog.content);
            });
        }
        res.json({success: 1, data: blogs,count: count});
    }).catch(function (err) {
        console.error(err);
        res.json({success: 0, msg: '系统错误'});
    });
});

//请求评论分页数据
router.get('/page/comment', function(req, res){
    var options = req.query;
    var limit = parseInt(options.size) || 5;
    var skip = parseInt(options.page - 1) * limit || 0;
    var count = 0;
    var Promise = Comment.count({blog: options.blog, reply: 0}).exec();
    Promise.then(function(doc){
        count = doc;
        return Comment.aggregate([
            {$match: {blog: mongoose.Types.ObjectId(options.blog)}},    //只接受ObjectID，无法自动转换为ObjectId
            {$sort: {published: 1}},
            {$group: {_id: '$group', group: {$push: '$_id'}, count: {$sum: 1}}},
            {$skip: skip},
            {$limit: limit},
        ]).exec();
    }).then(function(doc){
        return Comment.populate(doc, {path: 'group', options: {populate: {path: 'publisher blogger', select: {id: 1, nickname: 1, photo: 1}}}});
    }).then(function(doc){
        res.json({success: 1, data: doc, count: count})
    }).catch(function(err){
        console.log(err);
        res.json({success: 0, msg: '系统错误'});
    })

});

//点赞
router.get('/praise/post/:id', function (req, res) {
    var action = {
        ip: tools.getReqRemoteIp(req),
        blog: req.params.id
    };
    if(req.session.actions.praise.length > 0 && req.session.actions.praise.findIndex((value)=>{
            return tools.isEqual(value, action);
        }) !== -1)
        res.json({
            success: 0,
            msg: '禁止重复操作'
        });
    else{
        req.session.actions.praise.push(action);
        Blog.update({id: req.params.id}, {$inc: {praise: 1}}).exec();
        res.json({
            success: 1
        });
    }
});

//取消点赞
router.get('/praised/post/:id', function(req, res){
    var action = {
        ip: tools.getReqRemoteIp(req),
        blog: req.params.id
    };
    var index = req.session.actions.praise.findIndex((value)=>{
        return tools.isEqual(value, action);
    });
    if(index !== -1){
        req.session.actions.praise.splice(index, 1);
        Blog.update({id: req.params.id}, {$inc: {praise: -1}}).exec();
    }
    res.json({
        success: 1
    })

});

//通过id获取用户
router.get('/blogger/:id', function(req, res){
    var id = req.params.id;
    if(id)
        Blogger.findOne({id: id}, {_id: 1})
            .exec(function(err, doc){
                if(err)  console.log(err);
                if(doc) res.json({success: 1,data: doc._id});
                else res.json({success: 0,msg: '无此用户'});
            });
    else res.json({success: 0,msg: '请求的Id错误'});
});

//获取博客分类列表
router.get('/category/list', function(req, res){
    var category = require('../models/categorys');
    category.find({}).exec(function(err, doc){
            if(err) console.log(err);
            if(doc) res.json({success: 1, data: doc});
            else res.json({success: 0, msg: '获取列表失败'});
        });
});

//用户退出
router.get('/quit', function(req, res){
    req.session.user = null;
    req.session.blogs = null;
    res.render('Visitor/login', {title: '登录'});
});

//请求系统说明页面
router.get('/system', function(req, res){
    res.render('Visitor/system', {title: '系统说明'});
});

//请求忘记密码页面
router.get('/forgotpassword', function(req, res){
    res.render('Visitor/forgotpassword', {title: '忘记密码'});
});

//发送邮箱验证码
router.get('/sendVCode', function(req, res){
    var email = req.query.email;
     if(!email){
        res.json({success: 0, msg: '邮箱不为空'});
    }else if(!validators.email(email)){
        res.json({success: 0, msg: '邮箱格式错误'});
    }else{
        Blogger.findOne({email: email}).exec(function(err, doc){
            if(err) console.log(err);
            if(doc){
                if(doc.islive){
                    var code = tools.getCode();     //生成验证码
                    var mail = {
                        from: '博客 - 验证码 <15870608093@163.com>',
                        to: email,
                        subject: '账号安全中心 - 验证码',
                        html: '<h4>【 账号安全中心 】</h4><p>感谢使用博客邮箱验证功能， 您的验证码为：'+code+'</p>'
                    };
                    tools.mailer(mail);
                    req.session.emailCode = code;
                    res.json({success: 1, msg: '验证码发送成功'});
                }
                else res.json({success: 0, msg: '邮箱未验证，请前往验证'});
            }
            else res.json({success: 0, msg: '邮箱未注册'});
        });
    }
});

//邮箱验证码验证
router.post('/emailValidate', function(req, res){
    var emailData = req.body;
    if(!emailData.vCode || req.session.captcha !== emailData.vCode.toLowerCase()){
        res.json({success: 0, msg: '验证码错误'});
    }else if(!emailData.email){
        res.json({success: 0, msg: '邮箱不为空'});
    }else if(!validators.email(emailData.email)){
        res.json({success: 0, msg: '邮箱格式错误'});
    }else if(req.session.emailCode !== emailData.emailVCode){
        res.json({success: 0, msg: '邮箱验证码错误'});
    }else{
        req.session.emailValidate = true;
        res.json({success: 1, msg: '邮箱验证成功'});
    }
});

//修改新密码
router.post('/password/change', function(req, res){
    var passwordData = req.body;
    var email = req.query.email;
    if(!passwordData.vCode || req.session.captcha !== passwordData.vCode.toLowerCase()){
        res.json({success: 0, msg: '验证码错误'});
    }else if(!passwordData.password){
        res.json({success: 0, msg: '密码不为空'});
    }else if(passwordData.password.length > 12 || passwordData.password.length < 6){
        res.json({success: 0, msg: '密码长度错误'});
    }else if(passwordData.password !== passwordData.password2){
        res.json({success: 0, msg: '密码不一致'});
    }else{
        Blogger.findOne({email: email}).exec(function(err, doc){
            if(err) console.log(err);
            if(doc){
                var salt = bcrypt.genSaltSync(10);
                var newPassword = bcrypt.hashSync(passwordData.password, salt);  //对密码进行加密
                Blogger.update({_id: doc._id}, {$set: {password: newPassword}}).exec();
                res.json({success: 1, msg: '修改密码成功'});
            }
            else res.json({success: 0, msg: '邮箱未注册'});
        });
    }
});

module.exports = router;