var routes = {};
var User = require('./User');
var Squeek = require('./squeek');
var Hoek = require('hoek');
routes.index = function(request, reply){
    if(!request.auth.isAuthenticated){
        reply.view('index')
    }else{
        return authIndex(request, reply);
    }
}

routes.followUser = function(request, reply){
    var u = new User({username : request.auth.credentials.username});
    u.followUser(request.params.username, function(err, user){
        reply.redirect('/profile/'+request.params.username);
    })
}

routes.createSqueek = function(request, reply){
    if(!request.auth.isAuthenticated) reply('/');
    User.findOne({username : request.auth.credentials.username}, function(err, user){
        console.log("FUCKING USER", user, request.auth.credentials)
        if(err) return reply.redirect('/');
        var squeek = new Squeek({
            userId : user._id,
            message : request.payload.squeek
        })
        console.log("THE USER SQUEEK", user)
        squeek.save(function(err, s){
            if(err) return reply('/');
            console.log("SAVING SQUEEK")
            User.update({_id : user._id}, {$push : {'squeeks' : s._id}}, function(err, user){
                reply.redirect('/')
                console.log("U:DATED USER")
            })
        })
    })
}

function authIndex(request, reply){
    var u = new User();
    u.getSqueeks(request.auth.credentials.username, 10, function(err, squeeks){
        if(err) reply('ERROR');
        reply.view('auth-index', {user : request.auth.credentials, squeeks : squeeks});
    })
}

routes.login = function(request, reply){
    reply.view('login', {isLoggedIn : request.auth.isAuthenticated})
}

routes.authenticate = function(request, reply){
    User.findOne({username : request.payload.username}, function(err, user){
        if(err) return reply.redirect('/login');
        console.log(user.password, request.payload.password)
        if(user.password === request.payload.password){
            request.auth.session.clear();
            console.log("THE FUCKING USER LOGS IN ", user)
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
        console.log("SAVING USER");
        request.auth.session.clear();
        request.auth.session.set(user);
        return reply.redirect('/');
    })
}

routes.profile = function(request, reply){
    var username = request.params.user || request.auth.credentials.username;
    var u = new User();
    u.getSqueeks(username, 10, function(err, squeeks){
        if(err) reply.view('/');
        reply.view('profile', {user : {username : username}, squeeks : squeeks});
    })
}

routes.logout = function(request, reply){
    request.auth.session.clear();
    reply.redirect('/');
}


module.exports = routes;