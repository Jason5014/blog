var express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
    config = require('./config');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.join(__dirname, 'public/images/', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    resave: false,  // 是否每次都重新保存会话，建议false
    saveUninitialized: false,   // 是否自动保存未初始化的会话
    name: config.name,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000   // 有效期，单位是毫秒
    },
    store: new MongoStore({     //MongoDB存储Session
        url: config.mongodb
    }),
    secret: config.secret,  // 用来对session id相关的cookie进行签名
    salt: config.salt
}));

//设置路由
app.use('/', require('./routes/home'));
app.use('/user', require('./routes/user'));
app.use('/admin', require('./routes/admin'));

// 404 错误捕获处理
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  res.render('Visitor/info', {title: '404 - 页面找不到', info: 'page-not-found'})
});

// 错误处理
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // 返回错误信息也米娜
  res.status(err.status || 500);
  console.log(err);
  res.render('Visitor/info', {'title': '系统错误', info: 'system-error'});
});

module.exports = app;
