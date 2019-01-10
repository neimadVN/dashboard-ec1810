var express = require('express');
var router = express.Router();
const baseAuth = require('./base/authentication');

/* GET Login page. */
router.get('/', baseAuth.ensureUnauthenticated, function(req, res) {
  res.redirect('/auth/login');
});

/* GET home page. */
router.get('/dashboard', baseAuth.ensureAuthenticated, function(req, res, next) {
  if (req.user.role === 'NHAXE') {
    res.render('index', { title: 'EC1810 Business', user: req.user });
  }
  else {
    res.redirect('/admin');
  }
});

router.get('/admin', baseAuth.ensureAuthenticated, function(req, res, next) {
  if (req.user.role === 'ADMIN') {
    res.render('index', { title: 'EC1810 Business', user: req.user });
  }
  else {
    res.redirect('/dashboard');
  }
});

module.exports = router;
