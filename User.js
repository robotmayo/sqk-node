var mongoose = require('mongoose');
var SqueekModel = require('./squeek');
var Q = require('q');
var _ = require('lodash');
var UserSchema = mongoose.Schema({
    username : {type : String, required : true},
    password : {type : String, required : true},
    createdOn : {type : Date, required : true, default : Date.now},
    squeeks : {type : Array, ref: 'SqueekSchema'},
    followers : {type : Array, ref : 'UserSchema'},
    following : {type : Array, ref : 'UserSchema'}
})

UserSchema.methods.getTimeline = function(username, cb){
    return User.findOne({username : username}, 'following')
    .exec()
    .then(function(user){
        return User.find({_id : {'$in' : user.following}}, 'squeeks').exec()
        .then(function(squeekIds){
            var sids = _.pluck(squeekIds, 'squeeks');
            sids = _.flatten(sids);
            SqueekModel.find({"_id" : {"$in" : sids}})
            .sort({'createdOn' : -1})
            .exec()
            .then(function(squeeks){
                var userIds = _.pluck(squeeks,'userId');
                userIds = _.uniq(userIds, false, function(id){
                    return id.toString();
                });
                return User.find({_id : {"$in" : userIds} })
                .exec()
                .then(function(users){
                    var timeline = squeeks.map(function(msg){
                        var user = users.filter(function(u){
                            if(msg.userId.toString() !== u._id.toString()){
                                return false;
                            }
                            return true;
                        });
                        msg.userInfo = user[0];
                        return msg;
                    })
                    cb(null, timeline)
                })
            })
        })
    })
}

UserSchema.methods.getUserSqueeks = function(username, count, cb){
    return User.findOne({username : username})
    .exec()
    .then(function(user){
        return SqueekModel.find({ "_id" : {"$in" : user.squeeks}})
        .limit(count)
        .sort({'createdOn' : -1})
        .exec()
        .then(function(squeeks){
            return Q(squeeks, user);
        })
    })
    /*return User.findOne({username : username}, function(err, user){
        if(err) cb(err);
        SqueekModel.find({ "_id" : {"$in" : user.squeeks}}).limit(count).sort({'createdOn' : -1}).exec(cb)
    })*/
}

UserSchema.methods.followUser = function(username, cb){
    var self = this;
    console.log(this);
    return User.find({username : {'$in' : [username, this.username]}}, function(err, users){
        if(err) return cb(err);
        var toFollow = username;
        var follower = self.username;
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