var mongoose = require('mongoose'),
    config = require('../config');

mongoose.Promise = global.Promise;

/**
 * 连接
 */
mongoose.connect(config.mongodb, {useMongoClient: true});

/**
 * 连接成功
 */
mongoose.connection.on('connected',function(){
    console.log('Mongoose connection open to ' + config.mongodb);
});

/**
 * 连接异常
 */
mongoose.connection.on('error',function(err){
    console.log('Mongoose connection error: ' + err);
});

/**
 * 连接断开
 */
mongoose.connection.on('disconnected',function(){
    console.log('Mongoose connected disconnected.');
});

module.exports = mongoose;