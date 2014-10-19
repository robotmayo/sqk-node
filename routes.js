var routes = {};
var User = require('./User');
var Squeek = require('./squeek');
var Hoek = require('hoek');
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

function getTimeline(request, reply){
    var u = new User();
    u.getTimeline(request.auth.credentials.username)
    .then(function(timeline){
        reply.view('auth-index', {timeline : timeline});
    })
    /*u.getTimeline('admin', function(err, timeline){
        reply.view('auth-index', {timeline : timeline});
    })*/
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
    .then(function(squeeks, user){
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
        if(user.password === request.payload.password){
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
        password : request.payload.password
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
    .then(function(squeeks, user){
        reply.view('profile', {user : {username : username}, squeeks : squeeks});
    })
}

routes.logout = function(request, reply){
    request.auth.session.clear();
    reply.redirect('/');
}


module.exports = routes;