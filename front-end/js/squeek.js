var reqwestHelper = require('./reqwest-helper.js');
var post = reqwestHelper.post;
var selector = require('./selector');
var $ = selector.$;
var $$ = selector.$$;

var squeekText = $('#squeek-textarea');

function sendSqueek(data){
    return post('/api/sendSqueek', data, true)
    .then(function(res){
        console.log("RES", res)
        if(res.error) throw new Error(res);
        console.log("Added succesfully!", res);
    })
    .then(null, function(err){
        console.log(err, "ERROR");
    })
}

function sendSqueekEvent(evt){
    var data = {};
    if(squeekText.value == ''){
        console.warn("EMPTY SHIT HERE")
    }else{
        console.log(data);
        data.squeek = squeekText.value;
        sendSqueek(data);
    }
    evt.preventDefault();
    return false;
}

module.exports.sendSqueekEvent = sendSqueekEvent;
module.exports.sendSqueek = sendSqueek;