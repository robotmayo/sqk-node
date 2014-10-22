var routes = {};
var User = require('./User');
var Squeek = require('./squeek');
var Hoek = require('hoek');
var bcrypt = require('bcrypt');

routes.index = function(request, reply){
    if(!request.auth.isAuthenticated){
        reply.view('index')
    }else{
        return getTimeline(request, reply);
    }
}

routes.getFollowers = function(request, reply){
    var username = request.params.username;
    if(!username){
        username = request.auth.credentials.username;
    }
    var user = new User({username : username})
    user.getFollowers(request.auth.credentials._id)
    .then(function(followers){
        console.log(followers)
        reply.view('follow-list', {list : followers})
    })
    .then(null, function(err){
        reply("ERR")
        console.log(err)
    })
}

routes.getFollowing = function(request, reply){
    var username = request.params.username;
    if(!username){
        username = request.auth.credentials.username;
    }
    var user = new User({username : username})
    user.getFollowing()
    .then(function(following){
        reply.view('follow-list', {list : following})
    })
    .then(null, function(err){
        reply("ERR")
        console.log(err)
    })
}

routes.followUser = function(request, reply){
    var u = new User({username : request.auth.credentials.username});
    u.followUser(request.params.username)
    .then(function(user){
         reply.redirect('/profile/'+request.params.username);
    })
}

routes.unfollowUser = function(request, reply){
    var u = new User({username : request.auth.credentials.username});
    u.unfollowUser(request.params.username)
    .then(function(user){
         reply.redirect('/profile/'+request.params.username);
    })
}

function getTimeline(request, reply){
    var u = new User();
    u.getTimeline(request.auth.credentials.username)
    .then(function(data){
        reply.view('auth-index', {timeline : data.timeline, user : data.user});
    })
}

routes.createSqueek = function(request, reply){
    if(!request.auth.isAuthenticated) reply('/');
    User.findOne({username : request.auth.credentials.username}, function(err, user){
        if(err) return reply.redirect('/');
        var squeek = new Squeek({
            userId : user._id,
            message : request.payload.squeek
        })
        squeek.save(function(err, s){
            if(err) return reply('/');
            User.update({_id : user._id}, {$push : {'squeeks' : s._id}}, function(err, user){
                reply.redirect('/')
            })
        })
    })
}

function authIndex(request, reply){
    var u = new User();
    u.getUserSqueeks(request.auth.credentials.username, 10)
    .then(function(data){
        reply("DERP");
        console.log(arguments)
        // /reply.view('auth-index', {user : request.auth.credentials, squeeks : squeeks});
    })
}

routes.login = function(request, reply){
    reply.view('login', {isLoggedIn : request.auth.isAuthenticated})
}

routes.authenticate = function(request, reply){
    User.findOne({username : request.payload.username}, function(err, user){
        if(err) return reply.redirect('/login');
        if(bcrypt.compareSync(request.payload.password, user.password)){
            request.auth.session.clear();
            request.auth.session.set(user);
            return reply.redirect('/');
        }else{
            return reply.redirect('/login');
        }
    })
}

routes.register = function(request, reply){
    if(request.method == 'get') return reply.view('register');
    if(!request.payload.username && !request.payload.password){
        return reply.redirect('/register')
    }
    var account = new User({
        username : request.payload.username,
        password : bcrypt.hashSync(request.payload.password, bcrypt.genSaltSync(), null)
    });
    account.save(function(err, user){
        if(err) console.error(err);
        request.auth.session.clear();
        request.auth.session.set(user);
        return reply.redirect('/');
    })
}

routes.profile = function(request, reply){
    var username = request.params.user || request.auth.credentials.username;
    var u = new User();
    u.getUserSqueeks(username, 10)
    .then(function(data){
        var u = new User({username : data.user.username});
        u.followsUser(request.auth.credentials._id)
        .then(function(follows){
            console.log(follows);
            reply.view('profile', {user : data.user, squeeks : data.squeeks, followsUser : follows});
        })
        .then(null, function(err){
            reply("SOMETHIGN WEHNT WRONG")
        })
    })
    .then(null, function(err){
        reply("wtf")
    })
}

routes.test = function(request, reply){
    var u = new User({username : "robotmayo"});
    u.followsUser(request.auth.credentials._id)
    .then(function(follows){
        reply("DERP");
        console.log(follows)
    })
}

routes.logout = function(request, reply){
    request.auth.session.clear();
    reply.redirect('/');
}


module.exports = routes;