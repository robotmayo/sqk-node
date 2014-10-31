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
    return User.findOne({username : username}, 'following squeeks username')
    .exec()
    .then(function(user){
        var mainUser = user;
        return User.find({_id : {'$in' : user.following}}, 'squeeks').exec()
        .then(function(squeekIds){
            var sids = _.pluck(squeekIds, 'squeeks');
            var usersSqueeks = user.squeeks;
            var derp = usersSqueeks.concat(sids);
            sids = _.flatten(derp);
            return SqueekModel.find({"_id" : {"$in" : sids}})
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
                    var def = Q.defer();
                    var p = def.promise;
                    def.resolve({timeline : timeline, user : mainUser});
                    return p;
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
            return Q({squeeks : squeeks, user : user});
        })
    })
    /*return User.findOne({username : username}, function(err, user){
        if(err) cb(err);
        SqueekModel.find({ "_id" : {"$in" : user.squeeks}}).limit(count).sort({'createdOn' : -1}).exec(cb)
    })*/
}

UserSchema.methods.followUser = function(username, cb){
    var self = this;
    if(username == this.username){
        var def = Q.defer();
        def.resolve('');
        return def.promise;
    }
    return User.find({username : {'$in' : [username, this.username]}})
    .exec()
    .then(function(users){
        if(users.length !== 2) throw new Error("Couldn't find users")
        var userToBeFollowed = users[0].username == username ? users[0] : users[1];
        var userThatDoesTheFollowing = userToBeFollowed == users[0] ? users[1] : users[0];

        return self.addToFollowers(userToBeFollowed._id, userThatDoesTheFollowing._id)
        .then(function(){
            return self.addToFollowing(userThatDoesTheFollowing._id, userToBeFollowed._id)
        });
    });
}

UserSchema.methods.addToFollowers = function(usersId, followerId){
    return User.update({_id : usersId}, {$addToSet : {'followers' : followerId}}).exec();
}

UserSchema.methods.addToFollowing = function(usersId, followingId){
    return User.update({_id : usersId}, {$addToSet : {'following' : followingId}}).exec();
}

UserSchema.methods.removeFromFollowers = function(usersId, followerId){
    return User.update({_id : usersId}, {$pull : {'followers' : followerId}}).exec();
}

UserSchema.methods.removeFromFollowing = function(usersId, followingId){
    return User.update({_id : usersId}, {$pull : {'following' : followingId}}).exec();
}

UserSchema.methods.unfollowUser = function(username, cb){
    if(username == this.username){
        var def = Q.defer();
        def.resolve('');
        return def.promise;
    }
    var self = this;
    return User.find({username : {'$in' : [username, this.username]}})
    .exec()
    .then(function(users){
        var userLosingAFollower = users[0].username == username ? users[0] : users[1];
        var userDoingUnfollowing = userLosingAFollower == users[0] ? users[1] : users[0];
        return self.removeFromFollowers(userLosingAFollower._id, userDoingUnfollowing._id)
        .then(function(){
            return self.removeFromFollowing(userDoingUnfollowing._id, userLosingAFollower._id);
        })
    });
}

UserSchema.methods.getFollowers = function(userId){
    return User.findOne({username : this.username}, 'followers').exec()
    .then(function(user){
        return User.find({_id : {'$in' : user.followers}}, 'username followers')
        .exec()
        .then(function(followers){
            followers.forEach(function(f){
                f.isFollowing = f.followers.some(function(id){
                    return id.toString() == userId;
                })
            })
            var p = Q.defer();
            p.resolve(followers);
            return p.promise;
        })
    })
}

UserSchema.methods.getFollowing = function(){
    return User.findOne({username : this.username}, 'following').exec()
    .then(function(user){
        return User.find({_id : {'$in' : user.following}}, 'username')
        .exec()
        .then(function(users){
            var p = Q.defer();
            users.forEach(function(u){
                u.isFollowing = true;
            })
            p.resolve(users);
            return p.promise;
        })
    })
}

UserSchema.methods.followsUser = function(id){
    return User.findOne({username : this.username})
    .exec()
    .then(function(user){
        var follows = _.find(user.followers, function(follower){
            return follower.toString() == id;
        });
        if(follows) follows = true;
        else follows = false;
        return Q(follows)
    })
}


var User = mongoose.model('User', UserSchema, 'users');

module.exports = User;