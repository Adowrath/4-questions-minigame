/* jshint esversion: 6, node: true */
'use strict';

var database = require('../bin/database');
var express = require('express');
var router = express.Router();

function getRandomNumbers() {
	let nums = [];
	for(let i = 0; i < 4; i++) {
		let val = Math.floor(Math.random() * 0x1000);
		while(val in nums) {
			val = Math.floor(Math.random() * 0x1000);
		}
		nums[i] = val;
	}
	let sort = [0, 1, 2, 3];
	[sort[0], sort[2]] = [nums[sort[0]] < nums[sort[2]] ? sort[0] : sort[2], nums[sort[0]] > nums[sort[2]] ? sort[0] : sort[2]];
	[sort[1], sort[3]] = [nums[sort[1]] < nums[sort[3]] ? sort[1] : sort[3], nums[sort[1]] > nums[sort[3]] ? sort[1] : sort[3]];
	[sort[0], sort[1]] = [nums[sort[0]] < nums[sort[1]] ? sort[0] : sort[1], nums[sort[0]] > nums[sort[1]] ? sort[0] : sort[1]];
	[sort[2], sort[3]] = [nums[sort[2]] < nums[sort[3]] ? sort[2] : sort[3], nums[sort[2]] > nums[sort[3]] ? sort[2] : sort[3]];
	[sort[1], sort[2]] = [nums[sort[1]] < nums[sort[2]] ? sort[1] : sort[2], nums[sort[1]] > nums[sort[2]] ? sort[1] : sort[2]];
	
	return sort;
}

function quiz(req, res, next, database, last, joker) {
	if(req.session.game) {
		var game = req.session.game;
		if(game.questions === undefined || game.questions.length === 0) {
			res.redirect('/end');
		}
		if(game.curr === undefined) {
			game.curr = {};
			game.curr.qIndex = ~~(Math.random() * game.questions.length);
			let order = getRandomNumbers();
			game.curr.order = order;
		}
		res.render('game', {
			pretty: true,
			title: 'Spiel',
			question: game.questions[game.curr.qIndex],
			keys: game.curr.answers,
			order: game.curr.order,
			answers: [game.questions[game.curr.qIndex].answer, 
				game.questions[game.curr.qIndex].wrong1, 
				game.questions[game.curr.qIndex].wrong2, 
				game.questions[game.curr.qIndex].wrong3],
			correct: last,
			score: game.score,
			time: ~~((new Date() - new Date(game.start))/1000),
			start: game.start,
			joker,
			jokerUsed: game.jokerUsed
		});
		
	} else {
		res.redirect('/');
	}
}

function answer(req, res, next, database) {
	if(req.session.game) {
		var game = req.session.game;
		if(req.body.joker !== undefined) {
			if(game.jokerUsed === undefined) {
				game.jokerUsed = true;
				quiz(req, res, next, database, undefined, true);
			} else {
				quiz(req, res, next, database);
			}
		} else if(game.curr) {
			if(req.body.chosen === undefined || 
					req.body.id !== game.questions[game.curr.qIndex]._id) {
				
				quiz(req, res, next, database);
				
			} else if(game.curr.order[req.body.chosen] === 0) {
				database
				.answeredQuestion(game.questions[game.curr.qIndex]._id, true)
				.then(result => {
					game.questions.splice(game.curr.qIndex, 1);
					game.curr = undefined;
					game.score += 30;
					if(game.questions.length === 0) {
						res.redirect('/end');
					} else {
						quiz(req, res, next, database, true);
					}
				}).catch(err => {
					err.status = 500;
					next(err);
				});
			} else {
				database
				.answeredQuestion(game.questions[game.curr.qIndex]._id, false)
				.then(result => {
					game.lostWith = game.questions[game.curr.qIndex]['wrong' + game.curr.order[req.body.chosen]];
					
					res.redirect('/lost');
				}).catch(err => {
					err.status = 500;
					next(err);
				});
			}
		} else {
			res.redirect('/end');
		}
	} else {
		res.redirect('/');
	}
}

function lost(req, res, next, database) {
	if(req.session.game) {
		var game = req.session.game;
		req.session.game = undefined;
		res.render('lost', {
			pretty: true,
			title: 'Verloren',
			score: game.score,
			correct: game.questions[game.curr.qIndex].answer,
			wrong: game.lostWith
		});
	} else {
		res.redirect('/');
	}
}

function end(req, res, next, database) {
	if(req.session.game) {	
		if(req.session.game.duration === undefined) {
			req.session.game.duration = ~~((new Date() - new Date(req.session.game.start))/1000);
		}
		res.render('end', {
			pretty: true,
			title: 'Ende',
			score: req.session.game.score,
			duration: req.session.game.duration
		});
	} else {
		res.redirect('/');
	}
}

function register(req, res, next, database) {
	if(!req.session.game) {
		res.redirect('/');
	} else if(!req.body.name) {
		end(req, res, next, database);
	} else if(!req.session.game.duration) {
		res.redirect('/quiz');
	} else {
		database
		.addHighscore(new database.Highscore({
			_categories: req.session.game.categories,
			name: req.body.name,
			points: req.session.game.score,
			start: req.session.game.start,
			duration: req.session.game.duration
		})).then(result => {
			req.session.game = undefined;
			res.redirect('/highscores');
		}).catch(err => {
			err.status = 500;
			next(err);
		});
	}
}

function highscores(req, res, next, database) {
	database
	.getHighscores()
	.then(highscores => {
		res.render('public-highscore', {
			pretty: true,
			title: 'Highscores',
			highscores: highscores.sort(database.highscoreSort)
		});
	}).catch(err => {
		err.status = 500;
		next(err);
	});
}

function start(req, res, next, database, noneFound) {
	database
	.getCategories()
	.then(categories => {
		res.render('index', {
			pretty: true,
			title: 'Start',
			cats: categories.sort(database.categorySort),
			noneFound
		});
	}).catch(err => {
		err.status = 500;
		next(err);
	});
}

function startGame(req, res, next, database) {
	if(typeof req.body.categories === 'string' || 
			Object.prototype.toString.call(req.body.categories) === '[object Array]' && req.body.categories.length !== 0) {
		
		database
		.getQuestions({ _category: { $in: req.body.categories } })
		.then(result => {
			if(result === undefined || result.length === 0) {
				start(req, res, next, database, true);
				return;
			}
			req.session.game = {};
			req.session.game.categories = req.body.categories;
			req.session.game.questions = result;
			req.session.game.score = 0;
			req.session.game.start = new Date();
			res.redirect('/quiz');
		}).catch(err => {
			err.status = 500;
			next(err);
		});
	} else {
		start(req, res, next, database);
	}
}

var get_routes = {
	'': start,
	lost,
	end,
	highscores,
	quiz, 
	logout: (req, res, next) => {
		req.session.auth = false;
		res.redirect('/');
	}, 
	reset: (req, res, next) => {
		req.session.game = undefined;
		res.redirect('/');
	}
};
var post_routes = {
	'': startGame,
	quiz: answer,
	end: register
};
	
router.route('/:sub?').get((req, res, next) => {
	var route = get_routes[req.params.sub || ''];
	if(route) {
		try {
			route(req, res, next, require('../bin/database'));
		} catch(err) {
			next(err);
		}
	} else {
		next();
	}
}).post((req, res, next) => {
	var route = post_routes[req.params.sub || ''];
	if(route) {
		try {
			route(req, res, next, require('../bin/database'));
		} catch(err) {
			next(err);
		}
	} else {
		next();
	}
});
	
module.exports = router;