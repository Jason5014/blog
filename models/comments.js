var mongoose = require('./database'),
    Schema = mongoose.Schema;

var CommentSchema = new Schema({
    content: {
        type: String
    },
    publisher: {    //发布人
        type: Schema.Types.ObjectId,
        ref: 'blogger'
    },
    blogger: {      //回复对象 - 文章的博主 或 其他评论人
        type: Schema.Types.ObjectId,
        ref: 'blogger'
    },
    blog: {
        type: Schema.Types.ObjectId,
        ref: 'blog'
    },
    reply: {        //确认评论的类型 - 评论文章 或 回复评论
        type: Number,
        default: 0
    },
    published: {
        type: Date,
        default: Date.now
    },
    group: {    //评论分组
        type: Schema.Types.ObjectId,
        ref: 'comment'
    }
});

var Comment = mongoose.model('comment', CommentSchema);

module.exports = Comment;