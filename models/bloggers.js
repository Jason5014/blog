var mongoose = require('./database'),
    bcrypt = require('bcryptjs'),
    Schema = mongoose.Schema;

var BloggerSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    nickname: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        default: ''
    },
    industry: {
        type: String
    },
    position: {
        type: String
    },
    sex: {
        type: String,
        enum: ['男', '女', '保密'],
        default: '保密'
    },
    birthday: {
        type: Date,
        default: Date.now
    },
    address: {
        type: String
    },
    phone: {
        type: String,
        trim: true
    },
    profile: {
        type: String,
        default: '这个人很懒什么也没留下'
    },
    photo: {
        type: String,
        default: '/images/photo.jpg'
    },
    comments: {
        type: Number,
        default: 0
    },
    code: {         //激活码
        type: String
    },
    outdate: {         //过期日期
        type: Date
    },
    islive: {       //判断是否激活
        type: Boolean
    },

    follows: [{
        type: Schema.Types.ObjectId,
        ref: 'blogger'
    }],
    fans: [{
        type: Schema.Types.ObjectId,
        ref: 'blogger'
    }],
    collections: [{
        type: Schema.Types.ObjectId,
        ref: 'blog'
    }]
});

BloggerSchema.pre('save', function(next){
    this.nickname = 'bc' + this.id;
    //对密码进行加密
    if (this.password && this.password.length >= 6) {
        var salt = bcrypt.genSaltSync(10);
        this.password = bcrypt.hashSync(this.password, salt);
    }
    next();
});

BloggerSchema.statics.authenticate = bcrypt.compareSync;

var Blogger = mongoose.model('blogger', BloggerSchema);

module.exports = Blogger;
