var mongoose = require('mongoose');
var SqueekModel = require('./squeek');
var UserModel = require('./user');
var _ = require('lodash');
var HashtagSchema = mongoose.Schema({
    tag : {type : String, required : true},
    createdOn : {
        type : Date,
        required : true,
        default : Date.now
    },
    squeeks : {type : Array, required : true}
});

HashtagSchema.methods.getTags = function(msg){
    var tags = [];
    var matches = msg.match(/#\w\w+/g);
    return matches;
}

HashtagSchema.methods.getMessages = function(tag){
    var tagData;
    var userIds;
    var squeekData;
    tag = tag || this.local.tag;
    return HashTag.findOne({tag : tag})
    .exec()
    .then(function(tagDocument){
        tagData = tagDocument;
        return SqueekModel.find({_id : {'$in' : tagDocument.squeeks}})
        .sort({createdOn : -1})
        .limit(100)
        .exec()
    })
    .then(function(squeekDocuments){
        squeekData = squeekDocuments;
        userIds = _.pluck(squeekDocuments,'userId');
        userIds = _.uniq(userIds, false, function(id){
            return id.toString();
        });
        return UserModel.find({_id : {'$in' : userIds}}, 'username')
        .exec();
    })
    .then(function(userDocuments){
        var messages = squeekData.map(function(squeek){
            var user = userDocuments.filter(function(u){
                if(squeek.userId.equals(u._id)){
                    return true;
                }
                return false;
            });
            squeek.userInfo = user[0];
            return squeek;
        });
        return {
            squeeks : messages,
            tag : tag
        }
    })
}

var HashTag = mongoose.model('HashTag', HashtagSchema, 'hashtags');

module.exports = HashTag;