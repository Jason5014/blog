var mongoose = require('./database'),
    Schema = mongoose.Schema;

var PhotoSchema = new Schema({
    title: {
        type: String
    },
    blog: {
        type: Schema.Types.ObjectId,
        ref: 'blog'
    },
    blogger: {
        type: Schema.Types.ObjectId,
        ref: 'blogger'
    },
    url: {
        type: String,
        required: true
    },
    likes: {
        type: Number,
        default: 0
    },
    published: {
        type: Date,
        default: Date.now
    }
});

var Photo = mongoose.model('photo', PhotoSchema);

module.exports = Photo;