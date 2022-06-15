/* jshint esversion: 6, node: true */
'use strict';

var express = require('express');
var router = express.Router();

function render(req, res, next, user, loginFailed) {
	res.render('login', {
		pretty: true,
		user,
		loginFailed,
		title: 'Login'
	});
}

function login(username, password, callback) {
	if(username === 'admin' && password === 'asdf') {
		callback(true);
	} else {
		callback(false);
	}
}

router.route('/').get((req, res, next) => {
	
	render(req, res, next, '', false);
	
}).post((req, res, next) => {
	login(req.body.user, req.body.pw, (result) => {
		if(result === false) {
			if(req.body.ajax) {
				res.json({ valid: false });
			} else {
				render(req, res, next, req.body.user, true);
			}
		} else {
			req.session.auth = true;
			if(req.body.ajax) {
				res.json({ valid: true });
			} else {
				res.redirect('/admin');
			}
		}
	});
});

module.exports = router;
