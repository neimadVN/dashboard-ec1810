'use strict';

var passport = require('passport');
const ParseStrategy = require('../config/passport-parse');

let parseSDK = require('../config/parseSDK').init();
let parseStrategy = new ParseStrategy({ parseClient: parseSDK });

passport.use('parse', parseStrategy);

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

module.exports = passport;