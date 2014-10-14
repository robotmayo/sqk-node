var mongoose = require('mongoose');
var SqueekModel = require('./squeek');
var UserSchema = mongoose.Schema({
    username : {type : String, required : true},
    password : {type : String, required : true},
    createdOn : {type : Date, required : true, default : Date.now},
    squeeks : {type : Array, ref: 'SqueekSchema'},
    followers : {type : Array, ref : 'UserSchema'},
    following : {type : Array, ref : 'UserSchema'}
})

UserSchema.methods.getSqueeks = function(username, count, cb){
    return User.findOne({username : username}, function(err, user){
        if(err) cb(err);
        SqueekModel.find({ "_id" : {"$in" : user.squeeks}}).limit(count).sort({'createdOn' : -1}).exec(cb)
    })
}

UserSchema.methods.followUser = function(username, cb){
    return this.find({username : {'$in' : [username, this.local.username]}}, function(err, users){
        if(err) return cb(err);
        var toFollow = username;
        var follower = this.local.username;
        if(toFollow === users[0].username){
            toFollow = users[0]._id;
            follower = users[1]._id;
        }else{
            toFollow = users[1]._id;
            follower = users[0]._id;
        }
        User.update({_id : toFollow}, {$push : {'followers' : follower}}, function(err, user){
            if(err) cb(err);
            User.update({_id : follower}, {$push : {'following' : toFollow}}, cb)
        })
    });
}

var User = mongoose.model('User', UserSchema, 'users');

module.exports = User;