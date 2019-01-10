'use strict';

var parse = require('parse/node');
const config = require('./constants/config');

module.exports = {
    init: function () {        
        parse.initialize(config.parse.appId, config.parse.javascriptKey, config.parse.masterKey);
        parse.serverURL = config.parse.serverURL;

        return parse;
    }
};