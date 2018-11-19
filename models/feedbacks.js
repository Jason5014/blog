var mongoose = require('./database'),
    Schema = mongoose.Schema;

var FeedbackSchema = new Schema({
    types: [{
        type: String
    }],
    suggest: {
        type: String
    },
    blogger: {
        type: Schema.Types.ObjectId,
        ref: 'blogger'
    },
    published: {
        type: Date,
        default: Date.now
    },
    status: {
        type: Boolean,
        default: false
    }
});

var Feedback = mongoose.model('feedback', FeedbackSchema);

module.exports = Feedback;