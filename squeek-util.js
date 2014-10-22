function findHashTags(msg){
    var tags = [];
    var matches = msg.match(/#\w\w+/g);
    return matches;
}