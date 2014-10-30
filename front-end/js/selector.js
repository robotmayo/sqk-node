var $ = function(sel, element){
    if(element){
        return element.querySelector(sel);
    }
    return document.querySelector(sel);
}

var $$ = function(sel, element){
    if(element){
        return element.querySelectorAll(sel);
    }
    return document.querySelectorAll(sel);
}

module.exports.$ = $;
module.exports.$$ = $$;