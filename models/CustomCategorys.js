var mongoose = require('./database'),
    Schema = mongoose.Schema;

var CustomCategorySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    published: {
        type: Date,
        default: Date.now
    },
    blogger: {
        type: Schema.Types.ObjectId,
        ref: 'blogger'
    }
});

var CustomCategory = mongoose.model('customCategory', CustomCategorySchema);

module.exports = CustomCategory;