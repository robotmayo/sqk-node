var mongoose = require('mongoose');
var SqueekSchema = mongoose.Schema({
    userId  : {type : mongoose.Schema.Types.ObjectId, required : true, ref : 'UserSchema'},
    message : {type : String, required : true},
    createdOn : {
        type : Date,
        required : true,
        default : Date.now
    }
})

var Squeek = mongoose.model('Squeek', SqueekSchema, 'squeeks');

module.exports = Squeek;