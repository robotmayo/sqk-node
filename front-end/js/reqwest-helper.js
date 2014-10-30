var reqwest = require('reqwest');

function get(url, useCredentials){
    return reqwest({
        url : url,
        type : 'json',
        method : 'get',
        withCredentials : useCredentials || false
    });
}

function post(url, data, useCredentials){
    return reqwest({
        url : url,
        data : JSON.stringify(data),
        type : 'json',
        method : 'post',
        contentType: 'application/json',
        withCredentials : useCredentials || false
    });
}

module.exports = {
    get : get,
    post : post,
    reqwest : reqwest
}