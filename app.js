var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
var flash = require('connect-flash');
var expressLayouts = require("express-ejs-layouts");
require('dotenv').config();

var usersRouter = require('./routes/users');
const auth = require('./routes/auth');
const indexRouter = require('./routes/index');
const apiRouter = require('./routes/api');
const userInfoRouter = require('./routes/userInfo');
const carsRouter = require('./routes/car');
const routesRouter = require('./routes/route');
const busesRouter = require('./routes/bus');
const ticketRouter = require('./routes/ticket');
const adminUserRouter = require('./routes/adminUser');

var app = express();

var parseSDK = require('./config/parseSDK');

var sessionOptions = {
  key:  'eshop-session-key',
  secret: 'eshop-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: new Date(Date.now() + (24 * 60 * 60 * 1000)),
    maxAge: (24 * 60 * 60 * 1000),
    secure: false // true for https
  }
};

// view engine setup
app.use(expressLayouts);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set("layout", "layouts/layout");

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use('/', indexRouter);
app.use('/api', apiRouter);
app.use('/auth', auth);
app.use('/users', usersRouter);
app.use('/dashboard/info', userInfoRouter);
app.use('/dashboard/cars', carsRouter);
app.use('/dashboard/routes', routesRouter);
app.use('/dashboard/buses', busesRouter);
app.use('/dashboard/tickets', ticketRouter);
app.use('/admin/users', adminUserRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

global.Parse = parseSDK.init();

module.exports = app;
