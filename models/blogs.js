var mongoose = require('./database'),
    tools = require('../utility/tools'),
    Schema = mongoose.Schema;

var BlogSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        default: tools.getTimestamp
    },
    title: {
        type: String,
        required: '标题不为空'
    },
    content: {
        type: String,
        required: true
    },
    blogger: {
        type: Schema.Types.ObjectId,
        ref: 'blogger',
        required: true
    },
    category: {
        type: String,
        required: true
    },
    reading: {      //阅读量
        type: Number,
        default: 0
    },
    likes: {        //踩
        type: Number,
        default: 0
    },
    praise: {       //点赞
        type: Number,
        default: 0
    },
    status: {
        type: Number,
        enum: [0, 1, 2, 3, 4],   // 0 : 待发布， 1 : 已发布， 2 : 待审核， 3 : 被举报， 4 : 已删除
        default: 0
    },
    top: {
        type: Number,    // 置顶顺序, 0为不置顶
        default: 0
    },
    customCategory: [{
        type: Schema.Types.ObjectId,
        ref: 'customCategory'
    }],
    published: {
        type: Date,
        default: Date.now
    },
    album: {
        type: String
    },
    updated: {
        type: Date,
        default: Date.now
    },
    visible: {      // true: 显示， false： 隐藏
        type: Schema.Types.Boolean,
        default: true
    },
    reviewable: {
        type: Schema.Types.Boolean,     // true : 可评论 ， false : 不可评论
        default: true
    },
    labels: [{
        type: String
    }],
    collected: [{
        type: Schema.Types.ObjectId,
        ref: 'blogger'
    }],
    comments: {
        type: Number,
        default: 0
    }
});

BlogSchema.pre('save', function(next){
    this.album = this.title;    //默认相册名称为文章标题
    next();
});

BlogSchema.pre('update', function(next){
    this.updated = Date.now();  //更新更新时间
    next();
});

var Blog = mongoose.model('blog', BlogSchema);

module.exports = Blog;