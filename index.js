var Hapi = require('hapi');
var cookie = require('hapi-auth-cookie');
var path = require('path');
var Handlebars = require('handlebars');
var fs = require('fs');
var routes = require('./routes');
var db = require('./db')


var server = Hapi.createServer(6341, {
    views : {
        engines : {
            hbs : {
                module : Handlebars,
                isCached : false,
                basePath : path.join(__dirname, 'views'),
                partialsPath : path.join(__dirname, 'views/partials')
            }
        }
    }
});

server.pack.register(cookie, function (err) {
    if(err) throw err;
    server.auth.strategy('session', 'cookie', 'try', {
        password : 'squeek',
        cookie : 'session',
        redirectTo : false,
        isSecure : false,
        ttl : 60 * 1000 * 24
    })
    server.ext('onRequest', function(request,next){
        console.log(request.path, request.query)
        next();
    });
    
});

server.route({
    method : 'GET',
    path: '/bower_components/{param*}',
    handler : {
        directory : {
            path : 'bower_components',
            listing : true
        }
    }
})

server.route({
    method : 'GET',
    path : '/following/{username?}',
    config : {
        handler : routes.getFollowing
    }
})

server.route({
    method : 'GET',
    path : '/followers/{username?}',
    config : {
        handler : routes.getFollowers
    }
})

server.route({
    method : 'POST',
    path : '/follow/{username}',
    config : {
        handler : routes.followUser
    }
})

server.route({
    method : 'POST',
    path : '/unfollow/{username}',
    config : {
        handler : routes.unfollowUser
    }
})

server.route({
    method : ['POST', 'GET'],
    path : '/logout',
    config : {
        handler : routes.logout
    }
})

server.route({
    method : 'GET',
    path : '/',
    config : {
        handler : routes.index
    }
})

server.route({
    method : 'GET',
    path : '/login',
    config : {
        handler : routes.login
    }
})

server.route({
    method : 'POST',
    path : '/login',
    config : {
        handler : routes.authenticate
    }
})

server.route({
    method : 'GET',
    path : '/profile',
    config : {
        auth : {mode : 'required'},
        plugins : {
            'hapi-auth-cookie' : {
                redirectTo : '/'
            }
        },
        handler : routes.profile
    }
})

server.route({
    method : 'GET',
    path : '/profile/{user}',
    config : {
        handler : routes.profile
    }
})

server.route({
    method : ['GET', 'POST'],
    path : '/register',
    config : {
        handler : routes.register
    }
})

server.route({
    method : 'POST',
    path : '/squeek',
    config : {
        handler : routes.createSqueek
    }
})

server.route({
    method : 'GET',
    path : '/tag/{tag}',
    config : {
        handler : routes.showTags
    }
})


var defaultContext = {
    isLoggedIn : false
}
var Hoek = require('hoek');
server.ext('onPreResponse', function (request, reply) {
    if (request.response.variety === 'view') {
        defaultContext.isLoggedIn = request.auth.isAuthenticated;
        request.response.source.context = Hoek.applyToDefaults(defaultContext, request.response.source.context);
    }
    reply();
});
server.start(function(){
    console.log("Server Started")
})
