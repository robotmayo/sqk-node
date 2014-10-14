var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/squeek-test');
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("Connected!")
})

module.exports = db;