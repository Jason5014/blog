var mongoose = require('./database'),
    Schema = mongoose.Schema;

var CategorySchema = new Schema({
    name: {
        type: String,
        unique: true
    }
});

var Category = mongoose.model('category', CategorySchema);

module.exports = Category;