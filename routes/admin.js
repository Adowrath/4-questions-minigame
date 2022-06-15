/* jshint esversion: 6, node: true */
'use strict';

var logger = require('../bin/logger');
var database = require('../bin/database');
var express = require('express');
var router = express.Router();
var regexes = {
	catName: /^\s*[A-ZÄÖÜ0-9].*$/,
	catDesc: /^\s*[A-ZÄÖÜ0-9].*$/,
	queText: /^\s*[A-ZÄÖÜ0-9].*$/,
	queAnswer: /^\s*.+$/
};

function indexed(req, res, next, database) {
	try {
		switch(req.params.method) {
			case 'category':
				database
				.getCategories()
				.then(results => {
					res.render(req.body.ajax ? 'admin/category' : 'admin/_category', {
						pretty: true,
						title: 'Adminbereich - Kategorien',
						categories: results.sort(database.categorySort),
						error: req.error || {},
						method: req.params.method,
						regexes
					});
				}).catch(err => {
					if(req.body.ajax) {
						res.json({ err: 'renderError' });
					} else {
						err.status = 500;
						next(err);
					}
				});
				break;
			case 'question':
				Promise
				.all([database.getCategories(), database.getQuestions()])
				.then(results => {
					res.render(req.body.ajax ? 'admin/question' : 'admin/_question', {
						pretty: true,
						title: 'Adminbereich - Fragen',
						categories: results[0].sort(database.categorySort),
						questions: results[1].sort(database.questionSort),
						error: req.error || {},
						method: req.params.method,
						regexes
					});
				}).catch(err => {
					if(req.body.ajax) {
						res.json({ err: 'renderError' });
					} else {
						err.status = 500;
						next(err);
					}
				});
				break;
			case 'highscore':
				database
				.getHighscores()
				.then(results => {
					res.render(req.body.ajax ? 'admin/highscore' : 'admin/_highscore', {
						pretty: true,
						title: 'Adminbereich - Highscores',
						highscores: results.sort(database.highscoreSort),
						method: req.params.method,
						regexes
					});
				}).catch(err => {
					if(req.body.ajax) {
						res.json({ err: 'renderError' });
					} else {
						err.status = 500;
						next(err);
					}
				});
				break;
			default:
				Promise
				.all([database.countCategories(), database.countQuestions(), database.countHighscores()])
				.then(results => {
					res.render(req.body.ajax ? 'admin/home' : 'admin/_home', {
                		pretty: true,
                		title: 'Adminbereich - Home',
                		cCount: results[0],
                		qCount: results[1],
                		hCount: results[2],
                		method: req.params.method,
                		regexes
                	});
				}).catch(err => {
					if(req.body.ajax) {
						res.json({ err: 'renderError' });
					} else {
						err.status = 500;
						next(err);
					}
				});
		}
	} catch(err) {
		/* istanbul ignore next */ 
		logger.logError("THERE WAS AN ERROR", err);
		/* istanbul ignore next */ 
		if(req.body.ajax) {
			res.json({ err: 'renderError' });
		} else {
			err.status = 500;
			next(err);
		}
	}
}

function escape(string) {
	return string.trim().replace(/\r|\n/g, ' ').replace(/\s+/g, ' ');
}

function checkParam(body, values) {

	var a = [];
	values.forEach(entry => {

		if(body[entry] === undefined || (typeof body[entry] === 'string' && body[entry].trim() === '')) {
			a[a.length] = entry;
		}
		
	});
	return a;
}

function newCat(req, res, next, database) {
	
	if(checkParam(req.body, ['_id', 'name', 'desc']).length === 0) {
		var wrongs = {};
		wrongs.name = !regexes.catName.test(req.body.name);
		wrongs.desc = !regexes.catDesc.test(req.body.desc);
		
		if(wrongs.name || wrongs.desc) {
			if(req.body.ajax) {
				res.json(wrongs);
			} else {
				req.error = wrongs;
				indexed(req, res, next, database);
			}
		} else {
			var cat = new database.Category({ name: escape(req.body.name), desc: escape(req.body.desc) });
			var method = 'addCategory';
			if(req.body._id != -1) { 
				cat._id = req.body._id;
				method = 'modifyCategory';
			}
			
			database[method](cat)
			.then(results => {
				if(req.body.ajax)
					return database.getCategories();
				indexed(req, res, next, database);
				
			}).then(results => {
				if(results) {
					res.json(
						results.map((i) => {
								i.name = escape(i.name);
								i.desc = escape(i.desc);
							return i;
						}).sort(database.categoriesSort));
				}				
			}).catch(err => {
				var errors = {};
				errors.name = err.message && err.message.startsWith('E11000 duplicate key error collection');
				
				if(req.body.ajax) {
					if(!errors.message) {
						logger.logError(err);
					}
					res.json(errors);
				} else {
					req.error = errors;
					indexed(req, res, next, database);
				}
			});
		}
	} else if(!req.body.ajax) {
		indexed(req, res, next, database);
	} else {
		// TODO
		res.json({});
	}
}

function remCat(req, res, next, database) {

	if(checkParam(req.body, ['_id']).length === 0) {
		database
		.removeCategory(req.body._id)
		.then(results => {
			if(req.body.ajax)
				return database.getCategories();
			indexed(req, res, next, database);
		}).then(results => {
			if(results) {
				res.json({
					update: 'categories',
					data: results.map((i) => {
							i.name = escape(i.name);
							i.desc = escape(i.desc);
						return i;
					}).sort(database.categoriesSort)
				});
			}
		}).catch(err => {
			logger.logError('This should not happen: ' + err);
			
			if(req.body.ajax) {
				res.json({});
			} else {
				err.status = 500;
				next(err);
			}
		});
	} else if(!req.body.ajax) {
		indexed(req, res, next, database);
	} else {
		// TODO
		res.json({});
	}
}

function editCat(req, res, next, database) {

	if(checkParam(req.body, ['_id']).length === 0) {
		if(!req.body.ajax) {
			database
			.getCategories()
			.then(results => {
				res.render('admin/_category', {
					pretty: true,
					title: 'Adminbereich - Kategorien',
					categories: results.sort(database.categoriesSort),
					category: results.find(c => c._id == req.body._id),
					method: req.params.method,
					regexes
				});
			}).catch(err => {
				err.status = 500;
				next(err);
			});
		} else {
			database
			.getCategory(req.body._id)
			.then(results => {
				res.json({ 
					update: 'categoryForm', 
					data: results
				});
			}).catch(err => {
				res.json({});
			});
		}
	} else if(!req.body.ajax) {
		indexed(req, res, next, database);
	} else {
		// TODO
		res.json({});
	}
}

function newQues(req, res, next, database) {
	
	if(checkParam(req.body, ['_id', '_category', 'text', 'answer', 'wrong1', 'wrong2', 'wrong3']).length === 0) {
		var wrongs = {};
		wrongs.text= !regexes.queText.test(req.body.text);
		wrongs.answer = !regexes.queAnswer.test(req.body.answer);
		wrongs.wrong1 = !regexes.queAnswer.test(req.body.wrong1);
		wrongs.wrong2 = !regexes.queAnswer.test(req.body.wrong2);
		wrongs.wrong3 = !regexes.queAnswer.test(req.body.wrong3);
		
		if(wrongs.text || wrongs.answer || wrongs.wrong1 || wrongs.wrong2 || wrongs.wrong3) {
			if(req.body.ajax) {
				res.json(wrongs);
			} else {
				req.error = wrongs;
				indexed(req, res, next, database);
			}
		} else {
			var ques = new database.Question({ 
				_category: req.body._category, 
				text: escape(req.body.text), 
				answer: escape(req.body.answer), 
				wrong1: escape(req.body.wrong1), 
				wrong2: escape(req.body.wrong2), 
				wrong3: escape(req.body.wrong3), 
				answeredRight: 0, 
				answeredWrong: 0 
			});
			var method = 'addQuestion';
			
			if(req.body._id != -1) {
				ques._id = req.body._id;
				method = 'modifyQuestion';
			}
			database[method](ques)
			.then(results => {
				if(req.body.ajax)
					return database.getQuestions();
				indexed(req, res, next, database);
			}).then(results => {
				if(results) {
					res.json(results.map((i) => {
							i._category.name = escape(i._category.name);
							i._category.desc = escape(i._category.desc);
							i.text = escape(i.text);
							i.answer = escape(i.answer);
							i.wrong1 = escape(i.wrong1);
							i.wrong2 = escape(i.wrong2);
							i.wrong3 = escape(i.wrong3);
						return i;
					}).sort(database.questionsSort));
				}
			}).catch(err => {
				var errors = {};
				errors.text = err.message && err.message.startsWith('E11000 duplicate key error collection');
				errors.category = err.errors && err.errors._category && 
						err.errors._category.message === '_category document not found in Category collection';
				
				if(req.body.ajax) {
					if(!errors.message && !errors.category) {
						logger.logError(err);
					}
					res.json(errors);
				} else {
					req.error = errors;
					indexed(req, res, next, database);
				}
			});			
		}
	} else if(!req.body.ajax) {
		indexed(req, res, next, database);
	} else {
		// TODO
		res.json({});
	}
}

function remQues(req, res, next, database) {

	if(checkParam(req.body, ['_id']).length === 0) {
		
		database
		.removeQuestion(req.body._id)
		.then(results => {
			if(req.body.ajax)
				return database.getQuestions();
			indexed(req, res, next, database);
		}).then(results => {
			if(results) {
				res.json({
					update: 'questions',
					data: results.map((i) => {
							i._category.name = escape(i._category.name);
							i._category.desc = escape(i._category.desc);
							i.text = escape(i.text);
							i.answer = escape(i.answer);
							i.wrong1 = escape(i.wrong1);
							i.wrong2 = escape(i.wrong2);
							i.wrong3 = escape(i.wrong3);
						return i;
					}).sort(database.questionsSort)
				});
			}
		}).catch(err => {
			logger.logError('This should not happen: ' + err);
			
			if(req.body.ajax) {
				res.json({});
			} else {
				err.status = 500;
				next(err);
			}
		});
	} else if(!req.body.ajax) {
		indexed(req, res, next, database);
	} else {
		// TODO
		res.json({});
	}
}

function editQues(req, res, next, database) {

	if(checkParam(req.body, ['_id']).length === 0) {
		if(!req.body.ajax) {
			Promise
			.all([database.getQuestions(), database.getCategories()])
			.then(results => {
				res.render('admin/_question', {
					pretty: true,
					title: 'Adminbereich - Fragen',
					categories: results[1].sort(database.categoriesSort),
					questions: results[0].sort(database.questionsSort),
					question: results[0].find(c => c._id == req.body._id),
					method: req.params.method,
					regexes
				});
			}).catch(err => {
				err.status = 500;
				next(err);
			});
		} else {
			database
			.getQuestion(req.body._id)
			.then(results => {
				res.json({
					update: 'questionForm',
					data: results
				});
			}).catch(err => {
				res.json({});
			});
		}
	} else if(!req.body.ajax) {
		indexed(req, res, next, database);
	} else {
		// TODO
		res.json({});
	}
}

function remHigh(req, res, next, database) {

	if(checkParam(req.body, ['_id']).length === 0) {
		database
		.removeHighscore(req.body._id)
		.then(results => {
			if(req.body.ajax)
				return database.getHighscores();
			indexed(req, res, next, database);
		}).then(results => {
			if(results) {
				res.json({
					update: 'highscores',
					data: results.map((i) => {
						i.name = escape(i.name);
						i._categories.map((c) => {
							c.name = escape(c.name);
							c.desc = escape(c.desc);
							return c;
						});
						return i;
					}).sort(database.highscoreSort)
				});
			}
		}).catch(err => {
			logger.logError('This should not happen: ' + err);
			
			if(req.body.ajax) {
				res.json({});
			} else {
				err.status = 500;
				next(err);
			}
		});
	} else if(!req.body.ajax) {
		indexed(req, res, next, database);
	} else {
		// TODO
		res.json({});
	}
}

router.route('/:method?').all((req, res, next) => {
	if(req.session.auth) {
		if(!req.params.method) {
			res.redirect('/admin/home');
			return;
		}
		database = require('../bin/database');
		next();
		return;
	}
	if(req.body.ajax) {
		res.json({ err: 'unauthorized' });
		return;
	}
	res.redirect('/login');
}).get((req, res, next) => {
	switch(req.params.method) {
		case 'category':
		case 'question':
		case 'highscore':
		case 'home':
			indexed(req, res, next, database);
			break;
		default:
			next();
	
	}
}).post((req, res, next) => {
	switch(req.params.method) {
		case 'category':
			switch(req.body.editType) {
				case 'newCategory':
					newCat(req, res, next, database);
					break;
				case 'removeCategory':
					remCat(req, res, next, database);
					break;
				case 'editCategory':
					editCat(req, res, next, database);
					break;
				case undefined:
					if(req.body.ajax) {
						indexed(req, res, next, database);
						break;
					}
				default:
					var error = new Error(`"${req.body.editType}" ist kein zugelassener Wert für 'editType' auf ${req.params.method}`);
					error.status = 400;
					next(error);
			}
			break;
		case 'question':
			switch(req.body.editType) {
				case 'newQuestion':
					newQues(req, res, next, database);
					break;
				case 'removeQuestion':
					remQues(req, res, next, database);
					break;
				case 'editQuestion':
					editQues(req, res, next, database);
					break;
				case undefined:
					if(req.body.ajax) {
						indexed(req, res, next, database);
						break;
					}
				default:
					var error = new Error(`"${req.body.editType}" ist kein zugelassener Wert für 'editType' auf ${req.params.method}`);
					error.status = 400;
					next(error);
			}
			break;
		case 'highscore':
			switch(req.body.editType) {
				case 'removeHighscore': 
					remHigh(req, res, next, database);
					break;
				case undefined:
					if(req.body.ajax) {
						indexed(req, res, next, database);
						break;
					}
				default:
					var error = new Error(`"${req.body.editType}" ist kein zugelassener Wert für 'editType' auf ${req.params.method}`);
					error.status = 400;
					next(error);
			}
			break;
		case 'home':
			switch(req.body.editType) {
				case undefined:
					if(req.body.ajax) {
						indexed(req, res, next, database);
						break;
					}
				default:
					var error = new Error(`"${req.body.editType}" ist kein zugelassener Wert für 'editType' auf ${req.params.method}`);
					error.status = 400;
					next(error);
			}
			break;	
		default:
			next();
	}
});

module.exports = router;