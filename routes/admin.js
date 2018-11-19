var router = require('express').Router();
var admin = require('../config').admin;
var mongoose = require('mongoose');
var basicAuth = require('basic-auth');
var Blogger = require('../models/bloggers');
var Blog = require('../models/blogs');
var Comments = require('../models/comments');
var Feedback = require('../models/feedbacks');
var Category = require('../models/categorys');

var auth = function(req, res, next) {
    var user = basicAuth(req);
    console.log(user);
    if (!user || user.name !== admin.username || user.pass !== admin.password) {
        // res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.status(401).json();
    }
    next();
};

router.get('/', function(req, res){
    res.render('Admin/index', {title: '博客 - 管理后台'})
});

router.get('/auth/info', auth, function(req, res){
    res.json({ username: 'admin', userid: 1 });
});

router.get('/dashboard', function(req, res){
    var bloggers = 0;
    var posts = 0;
    var Promise = Blogger.count().exec();
    Promise.then(function(doc){
        bloggers = doc;
        return Blog.count().exec();
    }).then(function(doc){
        posts = doc;
        res.json({success: 1, bloggers: bloggers, posts: posts});
    }).catch(function(err){
        console.log(err);
        res.json({success: 0, msg: '系统错误'});
    })
});

router.get('/blogger/', function(req, res){
    var search = req.query.search || '';
    var page = parseInt(req.query.page||1) - 1;
    var query = {nickname: new RegExp(search, 'i')};
    var select = {id: 1, nickname: 1, islive: 1, email: 1};
    var Promise = Blogger.count(query).exec();
    var count = 0;
    var size = 8;
    Promise.then(function(doc){
        count = doc;
        return Blogger.find(query, select)
            .skip(page*size).limit(size).exec();
    }).then(function(doc){
        res.json({success: 1, total_count: count, results: doc, page_count: Math.ceil(count/size)});
    }).catch(function(err){
        console.log(err);
        res.json({success: 0});
    });
});

router.get('/detail/blogger/:id', function(req, res){
    var id = req.params.id;
    if(id){
        Blogger.findOne({id: id}, {password: 0, code: 0, outdate: 0, __v: 0})
            .populate({path: 'follows fans collections', select: {id: 1, title: 1, nickname: 1, photo: 1}}).exec(function(err, doc){
                if(err) console.log(err);
                if(doc) res.json({success: 1, blogger: doc});
                else res.json({success: 0});
        });
    }
    else res.json({success: 0});
});

router.get('/post/', function(req, res){
    var search = req.query.search || '';
    var page = parseInt(req.query.page||1) - 1;
    var query = {title: new RegExp(search, 'i')};
    var select = {id: 1, title: 1, status: 1, blogger: 1};
    var count = 0;
    var size = 8;
    var Promise = Blog.count(query).exec();
    Promise.then(function(doc){
        count = doc;
        return Blog.find(query, select)
            .skip(page*size).limit(size)
            .populate({path: 'blogger', select: {id: 1, nickname: 1}}).exec();
    }).then(function(doc){
        res.json({success: 1, total_count: count, results: doc, page_count: Math.ceil(count/size)});
    }).catch(function(err){
        console.log(err);
        res.json({success: 0});
    });
});

router.get('/detail/post/:id', function(req, res){
    var id = req.params.id;
    if(id){
        Blog.findOne({id: id}, {__v: 0, content: 0})
            .populate({path: 'blogger collected customCategory', select: {id: 1, nickname: 1, photo: 1, name: 1}}).exec(function(err, doc){
            if(err) console.log(err);
            if(doc) res.json({success: 1, post: doc});
            else res.json({success: 0});
        });
    }
    else res.json({success: 0});
});

router.get('/comments/post/:id', function(req, res){
    var id = req.params.id;
    if(id){
        var Promise = Comments.aggregate([
            {$match: {blog: mongoose.Types.ObjectId(id)}},
            {$group: {_id: '$group', group: {$push: '$_id'}, count: {$sum: 1}}}
        ]).exec();
        Promise.then(function(doc){
            return Comments.populate(doc, {path: 'group', options: {populate: {path: 'publisher blogger', select: {id: 1, nickname: 1, photo: 1}}}});
        }).then(function(doc){
            res.json({success: 1, comments: doc});
        }).catch(function(err){
            console.log(err);
            res.json({success: 0, msg: '系统错误'})
        });
    }else{
        res.json({success: 0, msg: '参数错误'})
    }
});

router.get('/suggest/', function(req, res){
    var search = req.query.search || '';
    var page = parseInt(req.query.page||1) - 1;
    var query = {suggest: new RegExp(search, 'i')};
    var count = 0;
    var size = 8;
    var Promise = Feedback.count(query).exec();
    Promise.then(function(doc){
        count = doc;
        return Feedback.find(query)
            .skip(page*size).limit(size)
            .populate({path: 'blogger', select: {id: 1, nickname: 1}}).exec();
    }).then(function(doc){
        res.json({success: 1, total_count: count, results: doc, page_count: Math.ceil(count/size)});
    }).catch(function(err){
        console.log(err);
        res.json({success: 0});
    });
});

router.get('/handle/suggest/:id', function(req, res){
    var id = req.params.id;
    if(id){
        Feedback.update({_id: id}, {status: {$set: true}}).exec(function(err, doc){
            if(err) console.log(err);
            if(doc) res.json({success: 1});
            else res.json({success: 0, msg: '系统错误'})
        })
    }
    else res.json({success: 0, msg: '参数错误'});
});

router.get('/detail/suggest/:id', function(req, res){
    var id = req.params.id;
    if(id){
        Feedback.findOne({_id: id})
            .populate({path: 'blogger', select: {id: 1, nickname: 1, photo: 1}})
            .exec(function(err, doc){
            if(err) console.log(err);
            if(doc){
                res.json({success: 1, suggest: doc});
            }else{
                res.json({success: 0, msg: '无法找到该条建议'});
            }
        })
    }else{
        res.json({success: 0, msg: '请求参数错误'});
    }
});

router.get('/category/', function(req, res){
    var search = req.query.search || '';
    var page = parseInt(req.query.page||1) - 1;
    var query = {name: new RegExp(search, 'i')};
    var count = 0;
    var size = 8;
    var Promise = Category.count(query).exec();
    Promise.then(function(doc){
        count = doc;
        return Category.find(query)
            .skip(page*size).limit(size).exec();
    }).then(function(doc){
        res.json({success: 1, total_count: count, results: doc, page_count: Math.ceil(count/size)});
    }).catch(function(err){
        console.log(err);
        res.json({success: 0});
    });
});

router.get('/add/category/:name', function(req, res){
    var name = req.params.name;
    if(name){
        new Category({
            name: name
        }).save(function(err, doc){
            if(err) console.log(err)
            if(doc) res.json({success: 1})
            else res.json({success: 0, msg: '名称重复'});
        })
    }
    else res.json({success: 0, msg: '名称不为空'})

});

module.exports = router;