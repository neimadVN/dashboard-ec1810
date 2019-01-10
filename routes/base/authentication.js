'use strict';

const _ = require('underscore');

module.exports = {
    // Simple route middleware to ensure user is authenticated.
    ensureAuthenticated: function (req, res, next) {
        if (req.isAuthenticated()) {
            next();
        } else {
            res.redirect('/auth/login');
        }
    },

    ensureUnauthenticated: function (req, res, next) {
        if (!_.isUndefined(req.body.username)) {
            console.log(req.body.username);
        }

        if (req.isAuthenticated()) {

            if (req.user.role === 'NHAXE') {
                res.redirect('/dashboard');
            } else {
                res.redirect('/admin');
            }
        } else {
            next();
        }
    }
};