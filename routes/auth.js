//'use strict';

const express = require('express');
const router = express.Router();
const passportParse = require('../models/Auth.js');
const baseAuth = require('./base/authentication.js');

// route middleware that will happen on every request
router.use(function (req, res, next) {
  // continue doing what we were doing and go to the route
  next();
});

/* GET Login page. */
router.get('/login', baseAuth.ensureUnauthenticated, function (req, res) {
  res.render('auth/login', {
    layout: 'auth/login',
    message: ""
  });
});

router.post('/login',
  baseAuth.ensureUnauthenticated,
  function (req, res, next) {
    passportParse.authenticate('parse', function (error, user, info) {
      if (error) {
        res.render('auth/login', {
          layout: 'auth/login',
          message: error
        });
      } else if (!user) {
        res.render('auth/login', {
          layout: 'auth/login',
          message: "ID hoặc mật khẩu của bạn không đúng"
        });
      } else {
        req.logIn(user, function (err) {
          if (err) {
            return res.render('auth/login', {
              layout: 'auth/login',
              message: info.message
            });
          } else {
            const role = user.toJSON()["role"];
            console.log("\n\nUSER ROLE: ", role);
            if (role === "NHAXE") {
              return res.redirect('/dashboard');
            }
            else if (role === 'ADMIN') {
              return res.redirect('/admin');
            } else {
              req.logout();
              req.session.destroy();

              if (req.query.access == 0) {
                res.render('auth/login', {
                  layout: 'auth/login',
                  message: "Bạn không thể truy cập vào hệ thống này."
                });
              }

              res.render('auth/login', {
                layout: 'auth/login',
                message: "Bạn không thể truy cập vào hệ thống này."
              });
            }
          }
        });
      }
    })(req, res, next);
  }
);

router.get('/logout', function (req, res) {
  req.logout();
  req.session.destroy();

  if (req.query.access == 0) {
    res.redirect('/auth/login');
  }

  res.redirect('/');
});

module.exports = router;