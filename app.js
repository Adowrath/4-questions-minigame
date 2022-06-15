/* jshint esversion: 6, node: true */
'use strict';

/* istanbul ignore if */
if(require.main === module) { throw "You should not start this! Use 'node ./bin/www'!"; }

var express = require('express');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var compression = require('compression');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

var admin = require('./routes/admin');
var login = require('./routes/login');
var game = require('./routes/game');

app.use(compression());

// Session Handling

app.use(session({
	secret: 'thisIsASecret',
	resave: false,
	saveUninitialized: false,
	cookie: {
		maxAge: 1000 * 60 * 30 // 30 Minuten
	},
	store: new MongoStore({
		url: 'mongodb://admin:asdf@localhost:27017/million?authSource=admin'
	}),
	rolling: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(cookieParser());
/* istanbul ignore next */
if(app.get('env') === 'development' && process.env.NODE_TESTING !== 'testing') {
	app.use(logger('dev'));
}
app.use(express.static(path.join(__dirname, 'public')));
/* istanbul ignore if */
if(app.get('env') === 'production' && process.env.NODE_TESTING !== 'testing') {
	app.use(logger('dev'));
}
app.use('/login', login);
app.use('/admin', admin);
app.use('/', game);

// catch 404 and forward to error handler
app.use(function(req, res, next) {

	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
/* istanbul ignore if */
if(app.get('env') === 'development') {
	app.use(function(err, req, res, next) {

		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err,
			errCode: err.status || 500
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || /* istanbul ignore next */ 500);
	res.render('error', {
		message: err.message,
		error: {},
		errCode: err.status || /* istanbul ignore next */  500
	});
});


module.exports = app;
