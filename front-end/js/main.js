var squeek = require('./squeek');
var selector = require('./selector');
var $ = selector.$;
var $$ = selector.$$;
console.log("ATTACHED", $('#send-squeek-btn'));
$('#send-squeek-btn').addEventListener('click', squeek.sendSqueekEvent);