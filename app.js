var dotenv = require('dotenv');
dotenv.load();

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

var session = require("express-session");
var sstore = require('sessionstore');
sessionStore = sstore.createSessionStore();

app.use(session(
  {
    secret:"Q25X6I3",
    resave:false,
    saveUninitialized:false, 
    store: sessionStore 
    /*cookie: {
      httpOnly: true,
      maxAge: 1*60*60
    } */
  }) 
);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});
app.options("/*", function(req, res, next){
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.send(200);
});
var authCheckSession = function(req, res, next) {
  console.log("authCheckSession");
  if (req.headers && req.headers.authorization) {
    var token = req.headers.authorization.replace('Bearer ', '');
    sessionStore.get(token, function(err, data) {
        if (data && data.username) {
            next();
        } else {
          res.json({'errorType': 'AUTH', 'error': 'Error de autenticación.'});
        }
    });
  } else {
    res.json({'errorType': 'AUTH', 'error': 'Error de autenticación.'});
  }
}
var authClearSession = function(req, res, next) {
  if (req.headers && req.headers.authorization) {
    var token = req.headers.authorization.replace('Bearer ', '');
    sessionStore.destroy(token, function(err, data) {
        res.json({'success': '1'});
    });
  } else {
    res.json({'errorType': 'AUTH', 'error': 'Token Inválido.'});
  }
}
var index = routes(authCheckSession, authClearSession);
app.use('/', index);

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
