/* jshint esversion: 6, node: true, -W030 */
/* globals describe,it,before,beforeEach,after,afterEach */

'use strict';
console.log(Object.keys(require.cache).length);
var server   = require('../bin/www');
console.log(Object.keys(require.cache).length);
var database = require('../bin/database');
console.log(Object.keys(require.cache).length);
var chai     = require('chai');
var chaiHTTP = require('chai-http');
var expect   = chai.expect;
var sinon    = require('sinon');
console.log(Object.keys(require.cache).length);

var loginName = 'admin';
var loginPass = 'asdf';
var baseURL = 'http://127.0.0.1:3000';

chai.use(chaiHTTP);

function wrapError(test) {
	
	return function(done) {
		if(console.error.restore) {
			console.error.restore();
		}
		sinon.stub(console, 'error', function(message) {
			
		});
		try {
			test(function(error) {
				console.error.restore();
				done(error);
			});
		} catch(err) {
			console.log(err);
			console.error.restore();
			done(err);
		}
	};
}

describe('routes', function() {
	this.timeout(5000);
	
	var arrayCallbacks = {
		'getCategories': [
			{ _id: 1, name: 'One', desc: 'First' },
			{ _id: 2, name: 'Two', desc: 'Second' },
			{ _id: 3, name: 'Three', desc: 'Third' }
		],
		'getQuestions': [
			{ _id: 1, _category: { _id: { _id: 1, name: 'One', desc: 'First' }, name: 'One', desc: 'First' }, text: 'A', answer: 'A', wrong1: '_', wrong2: '__', wrong3: '___' },
			{ _id: 2, _category: { _id: { _id: 1, name: 'One', desc: 'First' }, name: 'One', desc: 'First' }, text: 'B', answer: 'B', wrong1: '_', wrong2: '__', wrong3: '___' },
			{ _id: 3, _category: { _id: { _id: 2, name: 'Two', desc: 'Second' }, name: 'Two', desc: 'Second' }, text: 'C', answer: 'C', wrong1: '_', wrong2: '__', wrong3: '___' },
			{ _id: 4, _category: { _id: { _id: 3, name: 'Three', desc: 'Third' }, name: 'Three', desc: 'Third' }, text: 'D', answer: 'D', wrong1: '_', wrong2: '__', wrong3: '___' }
		],
		'getHighscores': [
			
		]
	};
	
	var countCallbacks = [
		'countCategories',
		'countQuestions',
		'countHighscores'
	];
	
	var singleCategoryCallbacks = [
		'addCategory',
		'modifyCategory',
		'removeCategory',
		'getCategory'
	];
	
	var singleQuestionCallbacks = [
		'addQuestion',
		'modifyQuestion',
		'removeQuestion',
		'getQuestion'
	];
	
	var singleHighscoreCallbacks = [
		'addHighscore',
		'removeHighscore'
	];
	
	var allFunctions = [
		...Object.keys(arrayCallbacks),
		...countCallbacks,
		...singleCategoryCallbacks,
		...singleQuestionCallbacks,
		...singleHighscoreCallbacks,
		'highscoreSort'
	];
	
	var calledFunctions = [];
	
	before('mock and spy the database', function() {
		this.timeout(5000);
		
		Object.keys(arrayCallbacks).forEach(func => {
			sinon.stub(database, func, function(filter) {
				calledFunctions.push(func);
				if(filter !== undefined && filter !== null && Object.keys(filter).length !== 0) {
					return Promise.resolve(arrayCallbacks[func]);
				} else {
					return Promise.resolve([]);
				}
			});
		});
		
		countCallbacks.forEach(func => {
			sinon.stub(database, func, function(filter) {
				calledFunctions.push(func);
				return Promise.resolve(17);
			});
		});
		
		singleCategoryCallbacks.forEach(func => {
			sinon.stub(database, func, function(filter) {
				calledFunctions.push(func);
				return Promise.resolve(undefined);
			});
		});
		
		singleQuestionCallbacks.forEach(func => {
			sinon.stub(database, func, function(filter) {
				calledFunctions.push(func);
				return Promise.resolve(undefined);
			});
		});
		
		singleHighscoreCallbacks.forEach(func => {
			sinon.stub(database, func, function(filter) {
				calledFunctions.push(func);
				return Promise.resolve(undefined);
			});
		});
		
		sinon.stub(database, 'highscoreSort', function(a, b) {
			calledFunctions.push('highscoreSort');
			return 0;
		});
	});
	
	beforeEach('reset the database mock and spies', function() {
		calledFunctions.forEach(func => {
			if(database[func].reset)
				database[func].reset();
		});
		calledFunctions = [];
	});
	
	after('cleans ', function() {
		allFunctions.forEach(func => {
			if(database[func].restore) {
				database[func].restore();
			}
		});
	});

	/* -------------------- *\
	 * Initialization ended *
	\* -------------------- */
	
	describe('login route', function() {
		it('respons normally on /login', function(done) {
			chai.request(server)
			.get('/login')
			.then(res => {
				expect(res).to.have.status(200);
				expect(res).to.not.redirect;
				done();
			}).catch(err => {
				done('Should not fail: ' + err);
			});
		});
		
		it('logs in successfully', function(done) {
			var agent = chai.request.agent(server);
			agent
			.post('/login')
			.send({ user: loginName, pw: loginPass })
			.then(res => {
				expect(res).to.redirectTo(baseURL + '/admin/home');
				expect(res).to.have.cookie('connect.sid');
				done();
			}).catch(err => {
				done('Should not fail: ' + err);
			});
		});
		
		it('does not log in successfully', function(done) {
			var agent = chai.request.agent(server);
			agent
			.post('/login')
			.send({ user: 'Peter', pw: loginPass })
			.then(res => {
				expect(res).to.not.redirect;
				expect(res).to.have.status(200);
				expect(res).to.have.not.cookie('connect.sid');
				done();
			}).catch(err => {
				done('Should not fail: ' + err);
			});
		});
		
		it('logs in successfully with AJAX', function(done) {
			var agent = chai.request.agent(server);
			agent
			.post('/login')
			.send({ ajax: true, user: loginName, pw: loginPass })
			.then(res => {
				expect(res).to.not.redirect;
				expect(res).to.have.status(200);
				expect(res).to.have.cookie('connect.sid');
				expect(res.body).to.have.property('valid', true);
				done();
			}).catch(err => {
				done('Should not fail: ' + err);
			});
		});
		
		it('does not log in successfully with AJAX', function(done) {
			var agent = chai.request.agent(server);
			agent
			.post('/login')
			.send({ ajax: true, user: 'Peter', pw: loginPass })
			.then(res => {
				expect(res).to.not.redirect;
				expect(res).to.have.status(200);
				expect(res).to.not.have.cookie('connect.sid');
				expect(res.body).to.have.property('valid', false);
				done();
			}).catch(err => {
				done('Should not fail: ' + err);
			});
		});
	});

	/* -------------------- *\
	 *  Login route ended   *
	\* -------------------- */
	
	describe('admin route', function() {
		var agent;
		var urls = {
			'/admin/home': [
				'countCategories',
				'countQuestions',
				'countHighscores'
			],
			'/admin/category': [
				'getCategories'
			],
			'/admin/question': [
				'getQuestions'
			],
			'/admin/highscore': [
				'getHighscores'
			]
		};
		
		beforeEach('Logs in for access', function(done) {
			agent = chai.request.agent(server);
			agent
			.post('/login')
			.send({ user: loginName, pw: loginPass })
			.then(res => {
				expect(res).to.have.status(200);
				expect(res).to.have.cookie('connect.sid');
				done();
			}).catch(err => {
				done('Should not fail: ' + err);
			});
		});
		
		function errors() {
			
			describe('errors', function() {
				it('should redirect a GET to /admin to /login if not logged in', function(done) {
					chai.request(server)
					.get('/admin/home')
					.then(res => {
						expect(res).to.redirect;
						expect(res).to.redirectTo(baseURL + '/login');
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('should give a 404 on a GET to /admin/meow', function(done) {
					agent
					.get('/admin/meow')
					.then(res => {
						done('Should not succeed: ' + res);
					}).catch(err => {
						expect(err).to.have.status(404);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('should give a 404 on a POST to /admin/meow', function(done) {
					agent
					.post('/admin/meow')
					.then(res => {
						done('Should not succeed: ' + res);
					}).catch(err => {
						expect(err).to.have.status(404);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
			});
		}
		
		function getRequests() {
			
			describe('GET requests', function() {
				it('should redirect a GET from /admin to /admin/home', function(done) {
					agent
					.get('/admin')
					.then(res => {
						expect(res).to.redirect;
						expect(res).to.redirectTo(baseURL + '/admin/home');
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				Object.keys(urls).forEach(url => {
					it('answers correctly on GET to ' + url, function(done) {
						countCallbacks.forEach(func => {
							database[func].reset();
						});
						agent
						.get(url)
						.then(res => {
							urls[url].forEach(method => {
								expect(database[method].calledOnce).to.be.true;
							});
							expect(res).to.have.status(200);
							expect(res).to.not.redirect;
							done();
						}).catch(err => {
							done('Should not fail: ' + err);
						});
					});
				});
			});
		}
		
		function postRequests() {
			
			describe('POST requests', function() {
				describe('Simple POST requests without data', function() {
					it('answers correctly with a redirect to /admin/home', function(done) {
						agent
						.post('/admin')
						.then(res => {
							expect(res).to.redirect;
							expect(res).to.redirectTo(baseURL + '/admin/home');
							done();
						}).catch(err => {
							done('Should not fail: ' + err);
						});
					});
					
					Object.keys(urls).forEach(url => {
						it('answers correctly with a 400 on data-less POST to ' + url, function(done) {
							agent
							.post(url)
							.then(res => {
								done(new Error('Should not succeed'));
							}).catch(err => {
								expect(err).to.have.status(400);
								expect(err).to.not.redirect;
								done();
							}).catch(err => {
								done('Should not fail: ' + err);
							});
						});
					});
					
					Object.keys(urls).forEach(url => {
						it('answers correctly with a normal response on an AJAX POST to ' + url, function(done) {
							countCallbacks.forEach(func => {
								database[func].reset();
							});
							agent
							.post(url)
							.send({ ajax: true })
							.then(res => {
								urls[url].forEach(method => {
									expect(database[method].calledOnce).to.be.true;
								});
								expect(res).to.not.redirect;
								expect(res).to.have.status(200);
								done();
							}).catch(err => {
								done('Should not fail: ' + err);
							});
						});
					});
				});
			});
		}
		
		errors();
		
		getRequests();
		
		postRequests();
	});
	
	/* -------------------- *\
	 *  Admin route ended   *
	\* -------------------- */
	
	describe('game route', function() {
		var agent;
		
		beforeEach(function(done) {
			agent = chai.request.agent(server);
			done();
		});
		
		function errors() {
			describe('errors', function() {
				it('should give a 404 on a GET to /meow', function(done) {
					agent
					.get('/meow')
					.then(res => {
						done('Should not succeed: ' + res);
					}).catch(err => {
						expect(err).to.have.status(404);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('should give a 404 on a POST to /meow', function(done) {
					agent
					.post('/meow')
					.then(res => {
						done('Should not succeed: ' + res);
					}).catch(err => {
						expect(err).to.have.status(404);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
			});
		}
		
		function getRequests() {
			
			describe('Normal GET requests', function() {
				it('should access / normally', function(done) {
					
					agent
					.get('/')
					.then(res => {
						expect(res).to.not.redirect;
						expect(res).to.have.status(200);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('should redirect from /reset to /', function(done) {
					agent
					.get('/reset')
					.then(res => {
						expect(res).to.redirect;
						expect(res).to.redirectTo(baseURL + '/');
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('should redirect from /logout to /', function(done) {
					agent
					.get('/logout')
					.then(res => {
						expect(res).to.redirect;
						expect(res).to.redirectTo(baseURL + '/');
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('should load highscores', function(done) {
					agent
					.get('/highscores')
					.then(res => {
						expect(res).to.not.redirect;
						expect(res).to.have.status(200);		
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
			});
			
			describe('GET requests with unstarted game', function() {
				it('should redirect from /lost to /', function(done) {
					agent
					.get('/lost')
					.then(res => {
						expect(res).to.redirect;
						expect(res).to.redirectTo(baseURL + '/');
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('should redirect from /end to /', function(done) {
					agent
					.get('/end')
					.then(res => {
						expect(res).to.redirect;
						expect(res).to.redirectTo(baseURL + '/');
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('should redirect from /quiz to /', function(done) {
					agent
					.get('/quiz')
					.then(res => {
						expect(res).to.redirect;
						expect(res).to.redirectTo(baseURL + '/');
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
			});
		}
		
		function simplePostRequests() {
			
			describe('Simple POST requests without having started', function() {
				it('rejects an empty body on /', function(done) {
					agent
					.post('/')
					.then(res => {
						expect(res).to.not.redirect;
						expect(res).to.have.status(200);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('rejects a non-array categories on /', function(done) {
					agent
					.post('/')
					.send({ categories: true })
					.then(res => {
						expect(res).to.not.redirect;
						expect(res).to.have.status(200);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('rejects an empty categories array on /', function(done) {
					agent
					.post('/')
					.send({ categories: [] })
					.then(res => {
						expect(res).to.not.redirect;
						expect(res).to.have.status(200);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('rejects a categories array with invalid keys on /', wrapError(function(done) {
					database.getQuestions.restore();
					agent
					.post('/')
					.send({ categories: [-1] })
					.then(res => {
						done('Should not succeed: ' + err);
					}).catch(err => {
						expect(console.error.calledOnce).to.be.true;
						expect(err).to.not.redirect;
						expect(err).to.have.status(500);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('rejects a POST to /end when not in a game', function(done) {
					agent
					.post('/end')
					.send({ name: 'Günther' })
					.then(res => {
						expect(res).to.redirect;
						expect(res).to.redirectTo(baseURL + '/');
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('rejects a POST to /quiz when not in a game', function(done) {
					agent
					.post('/quiz')
					.send({ id: 'ffffffffffffffffffffffff', chosen: 1 })
					.then(res => {
						expect(res).to.redirect;
						expect(res).to.redirectTo(baseURL + '/');
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
			});
		}
		
		errors();
		
		getRequests();
		
		simplePostRequests();
	});
	
	/* -------------------- *\
	 *   Game Route ended   *
	\* -------------------- */
	
	describe('misc routes', function() {
		it('logs out successfully', function(done) {
			var agent = chai.request.agent(server);
			agent
			.post('/login')
			.send({ user: loginName, pw: loginPass })
			.then(res => {
				expect(res).to.have.status(200);
				expect(res).to.have.cookie('connect.sid');
				
				return agent.get('/admin/home');
			}).then(res => {
				expect(res).to.not.redirect;
				expect(res).to.have.status(200);
					
				return agent.get('/logout');
			}).then(res => {
				expect(res).to.redirect;
				expect(res).to.redirectTo(baseURL + '/');
				
				return agent.get('/admin');
			}).then(res => {
				expect(res).to.redirect;
				expect(res).to.redirectTo(baseURL + '/login');
				
				done();
			}).catch(err => {
				done('Should not fail: ' + err);
			});
		});
	});
	
	/* -------------------- *\
	 *  Miscellaneous ended *
	\* -------------------- */
});

describe('database', function(done) {	
	before('removes all', function(done) {
		database.Category
		.remove()
		.then(results => {
			return database.Question.remove();
		}).then(results => {
			return database.Highscore.remove();
		}).then(results => {
			done();
		}).catch(err => {
			done('Should not fail: ' + err);
		});
	});
	
	describe('category', function() {
		describe('schema', function() {
			it('has a working category constructor', function() {
				expect(typeof database.Category === 'function').to.be.true;
				expect(typeof new database.Category() === 'object').to.be.true;
				expect(typeof database.Category() === 'object').to.be.true;
			});
			
			var attributes = [
				'name',
				'desc'
			];
			
			attributes.forEach(attribute => {
				describe(attribute, function() {
					it('requires a ' + attribute, function(done) {
						var cat = new database.Category();
						cat
						.validate()
						.then(() => {
							done('Should not have passed');
						}).catch(err => {
							expect(err.message).to.match(/validation failed/i);
							expect(err.errors[attribute].message).to.match(/is required/i);
							done();
						}).catch(err => {
							done('Should not fail: ' + err);
						});
					});
					
					it('requires the ' + attribute + ' to be a string', function(done) {
						var cat = new database.Category({ [attribute]: { h: 2 } });
						cat
						.validate()
						.then(() => {
							done('Should not have passed');
						}).catch(err => {
							expect(err.message).to.match(/validation failed/i);
							expect(err.errors[attribute].message).to.match(/cast to string failed/i);
							done();
						}).catch(err => {
							done('Should not fail: ' + err);
						});
					});
					
					it('accepts a ' + attribute, function(done) {
						var cat = new database.Category({ [attribute]: 'Mathematik' });
						cat
						.validate()
						.then(() => {
							done('Should not have passed');
						}).catch(err => {
							expect(err.message).to.match(/validation failed/i);
							expect(err.errors[attribute]).to.not.exist;
							done();
						}).catch(err => {
							done('Should not fail: ' + err);
						});
					});
				});
			});
		});
		
		describe('methods', function() {
			beforeEach('saves pre-defined categories', function(done) {
				var categoryOne = new database.Category({ name: 'One', desc: 'First category' });
				var categoryTwo = new database.Category({ name: 'Two', desc: 'Second category' });
				var categoryThree = new database.Category({ name: 'Three', desc: 'Third category' });
				categoryOne
				.save()
				.then(result1 => {
					expect(result1).to.deep.equal(categoryOne);
					return categoryTwo.save();
				}).then(result1 => {
					expect(result1).to.deep.equal(categoryTwo);
					return categoryThree.save();
				}).then(result1 => {
					expect(result1).to.deep.equal(categoryThree);
					done();
				}).catch(err => {
					done('Should not fail: ' + err);
				});
			});	
			
			afterEach('deletes all entries', function(done) {
				database.Category
				.remove()
				.then(results => {
					expect(results).to.exist;
					return database.Category.find();
				}).then(results => {
					expect(results).to.be.of.length(0);
					return database.Highscore.remove();
				}).then(results => {
					return database.Question.remove();
				}).then(results => {
					done();
				}).catch(err => {
					done('Should not fail: ' + err);
				});
			});
			
			it('sorts correctly', function() {
				var cat1 = new database.Category({ name: 'Some', desc: 'Something' });
				var cat2 = new database.Category({ name: 'Else', desc: 'Something else' });
				var cat3 = new database.Category({ name: 'Other', desc: 'Something else' });
				expect([cat1,cat2,cat3].sort(database.categorySort)).to.deep.equal([cat2, cat3, cat1]);
			});
			
			describe('save (CREATE)', function() {
				it('logs an error upon invalid document save', wrapError(function(done) {
					var cat = new database.Category();
					database
					.addCategory(cat)
					.then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(console.error.calledOnce).to.be.true;
						expect(err.name).to.match(/validat(or|ion)error/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('logs an error upon non-unique name', wrapError(function(done) {
					var cat = new database.Category({ name: 'Three', desc: 'Something' });
					database
					.addCategory(cat)
					.then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(console.error.calledOnce).to.be.true;
						expect(err.name).to.match(/mongoerror/i);
						expect(err.message).to.match(/duplicate.*name.*Three/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('saves correctly', function(done) {
					var cat = new database.Category({ name: 'Some', desc: 'Something' });
					database
					.addCategory(cat)
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat);
						return database.Category.findById(cat._id);
					}).then(results => {
						expect(results).to.exist;
						expect(results.toObject()).to.deep.equal(cat.toObject());
						done();
					}).catch(err => {
						done('Should not fail: ' +  err);
					});
				});
			});
			
			describe('get (READ)', function() {
				it('lists all categories correctly', function(done) {
					database
					.getCategories()
					.then(results => {
						expect(results).to.be.of.length(3);
						expect(results.map(c => c.name).sort()).to.deep.equal(['One', 'Three', 'Two']);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('lists all categories correctly when filtered', function(done) {
					database
					.getCategories({ name: /T/ })
					.then(results => {
						expect(results).to.be.of.length(2);
						expect(results.map(c => c.name).sort()).to.deep.equal(['Three', 'Two']);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('gives an error upon listing with an invalid filter', wrapError(function(done) {
					database
					.getCategories(17.42)
					.then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err).to.match(/invalid filter/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('gives an error upon listing with a filter with invalid options', wrapError(function(done) {
					database
					.getCategories({ name: { $hans_peter: 2 } })
					.then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err).to.match(/can't use \$hans_peter with/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('counts all categories correctly', function(done) {
					database
					.countCategories()
					.then(results => {
						expect(results).to.equal(3);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('counts all categories correctly when filtered', function(done) {
					database
					.countCategories({ name: /T/ })
					.then(results => {
						expect(results).to.equal(2);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('gives an error upon counting with an invalid filter', wrapError(function(done) {
					database
					.countCategories(17.42)
					.then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err).to.match(/invalid filter/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('gives an error upon counting with a filter with invalid options', wrapError(function(done) {
					database
					.countCategories({ name: { $hans_peter: 2 } })
					.then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err).to.match(/can't use \$hans_peter with/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('gives the correct single category', function(done) {
					var cat = new database.Category({ name: 'Some', desc: 'Something' });
					cat
					.save()
					.then(results => {
						expect(results).to.deep.equal(cat);
						return database.getCategory(cat._id);
					}).then(results => {
						expect(results.toObject()).to.deep.equal(cat.toObject());
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('gives an error upon non-objectidifiable id', wrapError(function(done) {
					database
					.getCategory({ h: 2 })
					.then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err.message).to.match(/cast to objectid failed/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
			});
			
			describe('modify (UPDATE)', function() {
				it('modifies without failure', function(done) {
					var cat = new database.Category({ name: 'Some', desc: 'Something' });
					cat
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat);
						cat.name = 'Someother';
						return database.modifyCategory(cat);
					}).then(results => {
						expect(results).to.exist;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('returns the new document upon modification', function(done) {
					var cat = new database.Category({ name: 'Some', desc: 'Something' });
					cat
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat);
						cat.name = 'Someother';
						return database.modifyCategory(cat);
					}).then(results => {
						expect(results).to.exist;
						expect(results.toObject()).to.exist.and.deep.equal(cat.toObject());
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('validates upon modification', wrapError(function(done) {
					var cat = new database.Category({ name: 'Some', desc: 'Something' });
					cat
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat);
						cat.name = '';
						return database.modifyCategory(cat);
					}).then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err.errors.name).to.exist.and.property('message').to.match(/required/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('gives an error when modifying an unknown id', wrapError(function(done) {
					var cat = new database.Category({ name: 'Some', desc: 'Something' });
					cat
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat);
						cat.name = 'Someother';
						cat._id = '000000000000000000000000';
						return database.modifyCategory(cat);
					}).then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err).to.exist.and.to.be.a('string').and.to.match(/unknown id/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('gives an error when modifying violates the unique name constraint', wrapError(function(done) {
					var cat = new database.Category({ name: 'Some', desc: 'Something' });
					cat
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat);
						cat.name = 'One';
						return database.modifyCategory(cat);
					}).then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err).to.exist;
						expect(err.name).to.match(/mongoerror/i);
						expect(err.message).to.match(/duplicate.*name.*One/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
			});
			
			describe('remove (DELETE)', function() {
				it('deletes correctly', function(done) {
					var cat = new database.Category({ name: 'Some', desc: 'Something' });
					cat
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat);
						return database.removeCategory(cat._id);
					}).then(results => {
						expect(results.toObject()).to.deep.equal(cat.toObject());
						return database.Category.findById(cat._id);
					}).then(results => {
						expect(results).to.not.exist;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('prints an error when trying to delete unkown id', wrapError(function(done) {
					var cat = new database.Category({ name: 'Some', desc: 'Something' });
					cat
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat);
						cat._id = '000000000000000000000000';
						return database.removeCategory(cat._id);
					}).then(results => {
						done('Should fail: ' + results);
					}).catch(err => {
						expect(console.error.calledOnce).to.be.true;
						expect(err).to.match(/unknown id/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('deletes only linked questions', function(done) {
					var cat1 = new database.Category({ name: 'Some', desc: 'Something' });
					var cat2 = new database.Category({ name: 'Someother', desc: 'Something else' });
					var ques1, ques2, ques3;
					cat1
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat1);
						return cat2.save();
					}).then(results => {
						expect(results).to.exist.and.deep.equal(cat2);
						ques1 = new database.Question({ text: 'a', _category: cat1, answer: 'a', wrong1: 'a', wrong2: 'a', wrong3: 'a', answeredWrong: 0, answeredRight: 0 });
						ques2 = new database.Question({ text: 'b', _category: cat1, answer: 'a', wrong1: 'a', wrong2: 'a', wrong3: 'a', answeredWrong: 0, answeredRight: 0 });
						ques3 = new database.Question({ text: 'c', _category: cat2, answer: 'a', wrong1: 'a', wrong2: 'a', wrong3: 'a', answeredWrong: 0, answeredRight: 0 });
						return ques1.save();
					}).then(results => {
						expect(results).to.exist.and.deep.equal(ques1);
						return ques2.save();
					}).then(results => {
						expect(results).to.exist.and.deep.equal(ques2);
						return ques3.save();
					}).then(results => {
						expect(results).to.exist.and.deep.equal(ques3);
						return database.removeCategory(cat1._id);
					}).then(results => {
						expect(results.toObject()).to.deep.equal(cat1.toObject());
						return database.Question.findById(ques1._id);
					}).then(results => {
						expect(results).to.not.exist;
						return database.Question.findById(ques2._id);
					}).then(results => {
						expect(results).to.not.exist;
						return database.Question.findById(ques3._id);
					}).then(results => {
						expect(results).to.exist;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('removes itself from highscore categories arrays', function(done) {
					var cat1 = new database.Category({ name: 'Some', desc: 'Something' });
					var cat2 = new database.Category({ name: 'Someother', desc: 'Something else' });
					var high1, high2, high3;
					cat1
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat1);
						return cat2.save();
					}).then(results => {
						expect(results).to.exist.and.deep.equal(cat2);
						high1 = new database.Highscore({ name: 'a', points: 1, start: Date.now(), duration: 1, _categories: [cat1] });
						high2 = new database.Highscore({ name: 'a', points: 1, start: Date.now(), duration: 1, _categories: [cat1,cat2] });
						high3 = new database.Highscore({ name: 'a', points: 1, start: Date.now(), duration: 1, _categories: [cat2] });
						return high1.save();
					}).then(results => {
						expect(results).to.exist.and.deep.equal(high1);
						return high2.save();
					}).then(results => {
						expect(results).to.exist.and.deep.equal(high2);
						return high3.save();
					}).then(results => {
						expect(results).to.exist.and.deep.equal(high3);
						return database.removeCategory(cat1._id);
					}).then(results => {
						expect(results.toObject()).to.deep.equal(cat1.toObject());
						return database.Highscore.findById(high1._id);
					}).then(results => {
						expect(results._categories).to.have.length(0);
						expect(results._categories).to.not.contain(cat1._id);
						return database.Highscore.findById(high2._id);
					}).then(results => {
						expect(results._categories).to.have.length(1);
						expect(results._categories).to.not.contain(cat1._id);
						expect(results._categories).to.contain(cat2._id);
						return database.Highscore.findById(high3._id);
					}).then(results => {
						expect(results._categories).to.have.length(1);
						expect(results._categories).to.contain(cat2._id);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
			});
		});
	});
	
	/* -------------------- *\
	 *   Categories ended   *
	\* -------------------- */
	
	describe('question', function() {
		describe('schema', function() {
			it('has a working question constructor', function() {
				expect(typeof database.Question === 'function').to.be.true;
				expect(typeof new database.Question() === 'object').to.be.true;
				expect(typeof database.Question() === 'object').to.be.true;
			});
			
			describe('text', function() {
				it('requires a text', function(done) {
					var que = new database.Question();
					que
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors.text.message).to.match(/is required/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('requires text to be a string', function(done) {
					var que = new database.Question({ text: { h: 2 } });
					que
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors.text.message).to.match(/cast to string failed/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('accepts a valid text', function(done) {
					var que = new database.Question({ text: 'D' });
					que
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors.text).to.not.exist;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
			});
			
			describe('_category', function() {
				it('requires a _category', function(done) {
					var que = new database.Question();
					que
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors._category.message).to.match(/is required/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('requires _category to be ObjectID-ifiable', function(done) {
					var que = new database.Question({ _category: 2 });
					que
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors._category.message).to.match(/cast to objectid failed/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('requires _category to exist', function(done) {
					var que = new database.Question({ text: 'a', _category: '000000000000000000000000', answer: 'a', wrong1: 'a', wrong2: 'a', wrong3: 'a', answeredWrong: 13, answeredRight: 14 });
					que
					.save()
					.then(result => {
						done('Should not succeed: ' + result);
					}).catch(err => {
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors._category.message).to.match(/document not found/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('accepts a valid _category', function(done) {
					var cat = new database.Category({ name: 'a', desc: 'a' });
					var que = new database.Question({ text: 'a', _category: cat._id, answer: 'a', wrong1: 'a', wrong2: 'a', wrong3: 'a', answeredWrong: 13, answeredRight: 14 });
					cat
					.save()
					.then(results => {
						expect(results).to.deep.equal(cat);
						return que.save();
					}).then(results => {
						expect(results).to.deep.equal(que);
						return cat.remove();
					}).then(results => {
						return que.remove();
					}).then(results => {
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
			});
			
			var answers = [
				'answer',
				'wrong1',
				'wrong2',
				'wrong3'
			];
			
			answers.forEach(answer => {
				describe(answer, function() {
					it('requires an ' + answer, function(done) {
						var que = new database.Question();
						que
						.validate()
						.then(() => {
							done('Should not succeed!');
						}).catch(err => {
							expect(err.message).to.match(/validation failed/i);
							expect(err.errors[answer].message).to.match(/is required/i);
							done();
						}).catch(err => {
							done('Should not fail: ' + err);
						});
					});
					
					it('requires ' + answer + ' to be a string', function(done) {
						var que = new database.Question({ [answer]: { h: 2 } });
						que
						.validate()
						.then(() => {
							done('Should not succeed!');
						}).catch(err => {
							expect(err.message).to.match(/validation failed/i);
							expect(err.errors[answer].message).to.match(/cast to string failed/i);
							done();
						}).catch(err => {
							done('Should not fail: ' + err);
						});
					});
					
					it('accepts a valid ' + answer, function(done) {
						var que = new database.Question({ [answer]: 'D' });
						que
						.validate()
						.then(() => {
							done('Should not succeed!');
						}).catch(err => {
							expect(err.message).to.match(/validation failed/i);
							expect(err.errors[answer]).to.not.exist;
							done();
						}).catch(err => {
							done('Should not fail: ' + err);
						});
					});
				});
			});
			
			var answerCount = [
				'answeredRight',
				'answeredWrong'
			];
			
			answerCount.forEach(answer => {
				describe(answer, function() {
					it('requires an ' + answer, function(done) {
						var que = new database.Question();
						que
						.validate()
						.then(() => {
							done('Should not succeed!');
						}).catch(err => {
							expect(err.message).to.match(/validation failed/i);
							expect(err.errors[answer].message).to.match(/is required/i);
							done();
						}).catch(err => {
							done('Should not fail: ' + err);
						});
					});
					
					it('requires ' + answer + ' to be a number', function(done) {
						var que = new database.Question({ [answer]: { h: 2 } });
						que
						.validate()
						.then(() => {
							done('Should not succeed!');
						}).catch(err => {
							expect(err.message).to.match(/validation failed/i);
							expect(err.errors[answer].message).to.match(/cast to number failed/i);
							done();
						}).catch(err => {
							done('Should not fail: ' + err);
						});
					});
					
					it('rejects a negative ' + answer + ' amount', function(done) {
						var que = new database.Question({ [answer]: -1 });
						que
						.validate()
						.then(() => {
							done('Should not succeed!');
						}).catch(err => {
							expect(err.message).to.match(/validation failed/i);
							expect(err.errors[answer].message).to.match(/less than minimum/i);
							done();
						}).catch(err => {
							done('Should not fail: ' + err);
						});
					});
					
					it('accepts a valid ' + answer, function(done) {
						var que = new database.Question({ [answer]: 10 });
						que
						.validate()
						.then(() => {
							done('Should not succeed!');
						}).catch(err => {
							expect(err.message).to.match(/validation failed/i);
							expect(err.errors[answer]).to.not.exist;
							done();
						}).catch(err => {
							done('Should not fail: ' + err);
						});
					});
				});
			});
		});
		
		describe('methods', function() {
			beforeEach('saves pre-defined questions', function(done) {
				var cat1 = new database.Category({ name: 'a', desc: 'a' });
				var cat2 = new database.Category({ name: 'b', desc: 'a' });
				var questionOne =   new database.Question({ text: 'One', _category: cat1, answer: 'a', wrong1: 'a', wrong2: 'a', wrong3: 'a', answeredWrong: 9, answeredRight: 0 });
				var questionTwo =   new database.Question({ text: 'Two', _category: cat1, answer: 'a', wrong1: 'a', wrong2: 'a', wrong3: 'a', answeredWrong: 0, answeredRight: 3 });
				var questionThree = new database.Question({ text: 'Three', _category: cat2, answer: 'a', wrong1: 'a', wrong2: 'a', wrong3: 'a', answeredWrong: 2, answeredRight: 5 });
				var questionFour = new database.Question({ text: 'Four', _category: cat1, answer: 'a', wrong1: 'a', wrong2: 'a', wrong3: 'a', answeredWrong: 2, answeredRight: 5 });
				cat1
				.save()
				.then(result => {
					expect(result).to.deep.equal(cat1);
					return cat2.save();
				}).then(result => {
					expect(result).to.deep.equal(cat2);
					return questionOne.save();
				}).then(result => {
					expect(result).to.deep.equal(questionOne);
					return questionTwo.save();
				}).then(result => {
					expect(result).to.deep.equal(questionTwo);
					return questionThree.save();
				}).then(result => {
					expect(result).to.deep.equal(questionThree);
					return questionFour.save();
				}).then(result => {
					expect(result).to.deep.equal(questionFour);
					done();
				}).catch(err => {
					done('Should not fail: ' + err);
				});
			});	
			
			afterEach('deletes all categories and questions', function(done) {
				database.Category
				.remove()
				.then(results => {
					expect(results).to.exist;
					return database.Category.find();
				}).then(results => {
					expect(results).to.be.of.length(0);
					return database.Question.remove();
				}).then(results => {
					done();
				}).catch(err => {
					done('Should not fail: ' + err);
				});
			});
			
			it('sorts correctly', function() {
				var cat1 = new database.Category({ name: 'One', desc: 'a' });
				var cat2 = new database.Category({ name: 'Two', desc: 'a' });
				var ques1 = new database.Question({ text: 'One', _category: cat1, answer: 'a', wrong1: 'a', wrong2: 'a', wrong3: 'a', answeredWrong: 9, answeredRight: 0 });
				var ques2 = new database.Question({ text: 'Two', _category: cat1, answer: 'a', wrong1: 'a', wrong2: 'a', wrong3: 'a', answeredWrong: 0, answeredRight: 3 });
				var ques3 = new database.Question({ text: 'Three', _category: cat2, answer: 'a', wrong1: 'a', wrong2: 'a', wrong3: 'a', answeredWrong: 2, answeredRight: 5 });
				var ques4 = new database.Question({ text: 'Four', _category: cat1, answer: 'a', wrong1: 'a', wrong2: 'a', wrong3: 'a', answeredWrong: 2, answeredRight: 5 });
				var ques5 = new database.Question({ text: 'Five', _category: cat2, answer: 'a', wrong1: 'a', wrong2: 'a', wrong3: 'a', answeredWrong: 2, answeredRight: 5 });
				
				expect([ques1, ques2, ques3, ques4, ques5].sort(database.questionSort))
						.to.deep.equal([ques4, ques1, ques2, ques5, ques3]);
			});
			
			describe('save (CREATE)', function() {
				it('logs an error upon invalid document save', wrapError(function(done) {
					var ques = new database.Question();
					database
					.addQuestion(ques)
					.then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(console.error.calledOnce).to.be.true;
						expect(err.name).to.match(/validat(or|ion)error/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('logs an error upon non-unique text', wrapError(function(done) {
					var cat = new database.Category({ name: 'Aftermath', desc: '...is stupid.' });
					var ques = new database.Question({ text: 'Three', _category: cat._id, answer: 'a', wrong1: 'a', wrong2: 'a', wrong3: 'a', answeredRight: 0, answeredWrong: 0 });
					cat
					.save()
					.then(results => {
						expect(results).to.deep.equal(cat);
						return database.addQuestion(ques);
					}).then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(console.error.calledOnce).to.be.true;
						expect(err.name).to.match(/mongoerror/i);
						expect(err.message).to.match(/duplicate.*text.*Three/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('saves correctly', function(done) {
					var cat = new database.Category({ name: 'Aftermath', desc: '...is stupid.' });
					var ques = new database.Question({ text: 'Fourishly', _category: cat._id, answer: 'a', wrong1: 'a', wrong2: 'a', wrong3: 'a', answeredRight: 0, answeredWrong: 0 });
					cat
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat);
						return database.addQuestion(ques);
					}).then(results => {
						expect(results).to.exist.and.deep.equal(ques);
						return database.Question.findById(ques._id);
					}).then(results => {
						expect(results).to.exist;
						expect(results.toObject()).to.deep.equal(ques.toObject());
						done();
					}).catch(err => {
						done('Should not fail: ' +  err);
					});
				});
			});
			
			describe('get (READ)', function() {
				it('lists all questions correctly', function(done) {
					database
					.getQuestions()
					.then(results => {
						expect(results).to.be.of.length(4);
						expect(results.map(c => c.text).sort()).to.deep.equal(['Four', 'One', 'Three', 'Two']);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('lists all questions correctly when filtered', function(done) {
					database
					.getQuestions({ text: /T/ })
					.then(results => {
						expect(results).to.be.of.length(2);
						expect(results.map(c => c.text).sort()).to.deep.equal(['Three', 'Two']);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('gives an error upon listing with an invalid filter', wrapError(function(done) {
					database
					.getQuestions(17.42)
					.then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err).to.match(/invalid filter/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('gives an error upon listing with a filter with invalid options', wrapError(function(done) {
					database
					.getQuestions({ text: { $hans_peter: 2 } })
					.then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err).to.match(/can't use \$hans_peter with/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('counts all questions correctly', function(done) {
					database
					.countQuestions()
					.then(results => {
						expect(results).to.equal(4);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('counts all questions correctly when filtered', function(done) {
					database
					.countQuestions({ text: /T/ })
					.then(results => {
						expect(results).to.equal(2);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('gives an error upon counting with an invalid filter', wrapError(function(done) {
					database
					.countQuestions(17.42)
					.then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err).to.match(/invalid filter/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('gives an error upon counting with a filter with invalid options', wrapError(function(done) {
					database
					.countQuestions({ text: { $hans_peter: 2 } })
					.then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err).to.match(/can't use \$hans_peter with/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('gives the correct single question', function(done) {
					var cat = new database.Category({ name: '_', desc: 'a' });
					var ques = new database.Question({ text: '_', _category: cat._id, answer: '_', wrong1: '_', wrong2: '_', wrong3: '_', answeredWrong: 0, answeredRight: 0 });
					cat
					.save()
					.then(results => {
						expect(cat).to.deep.equal(cat);
						return ques.save();
					}).then(results => {
						expect(results).to.deep.equal(ques);
						return database.getQuestion(ques._id);
					}).then(results => {
						expect(results.toObject()).to.deep.equal(ques.toObject());
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('gives an error upon non-objectidifiable id', wrapError(function(done) {
					database
					.getQuestion({ h: 2 })
					.then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err.message).to.match(/cast to objectid failed/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
			});
			
			describe('modify (UPDATE)', function() {
				it('modifies without failure', function(done) {
					var cat = new database.Category({ name: '_', desc: 'a' });
					var ques = new database.Question({ text: '_', _category: cat._id, answer: '_', wrong1: '_', wrong2: '_', wrong3: '_', answeredWrong: 0, answeredRight: 0 });
					cat
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat);
						return ques.save();
					}).then(results => {
						expect(results).to.exist.and.deep.equal(ques);
						ques.text = 'Someother';
						return database.modifyQuestion(ques);
					}).then(results => {
						expect(results).to.exist;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('returns the new document upon modification', function(done) {
					var cat = new database.Category({ name: '_', desc: 'a' });
					var ques = new database.Question({ text: '_', _category: cat._id, answer: '_', wrong1: '_', wrong2: '_', wrong3: '_', answeredWrong: 0, answeredRight: 0 });
					cat
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat);
						return ques.save();
					}).then(results => {
						expect(results).to.exist.and.deep.equal(ques);
						ques.text = 'Someother';
						return database.modifyQuestion(ques);
					}).then(results => {
						expect(results.toObject()).to.exist.and.deep.equal(ques.toObject());
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('validates upon modification', wrapError(function(done) {
					var cat = new database.Category({ name: '_', desc: 'a' });
					var ques = new database.Question({ text: '_', _category: cat._id, answer: '_', wrong1: '_', wrong2: '_', wrong3: '_', answeredWrong: 0, answeredRight: 0 });
					cat
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat);
						return ques.save();
					}).then(results => {
						expect(results).to.exist.and.deep.equal(ques);
						ques.text = '';
						return database.modifyQuestion(ques);
					}).then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err.errors.text).to.exist.and.property('message').to.match(/required/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('gives an error when modifying an unknown id', wrapError(function(done) {
					var cat = new database.Category({ name: '_', desc: 'a' });
					var ques = new database.Question({ text: '_', _category: cat._id, answer: '_', wrong1: '_', wrong2: '_', wrong3: '_', answeredWrong: 0, answeredRight: 0 });
					cat
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat);
						return ques.save();
					}).then(results => {
						expect(results).to.exist.and.deep.equal(ques);
						ques.text = 'Someother';
						ques._id = '000000000000000000000000';
						return database.modifyQuestion(ques);
					}).then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err).to.exist.and.to.be.a('string').and.to.match(/unknown id/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('gives an error when modifying violates the unique text constraint', wrapError(function(done) {
					var cat = new database.Category({ name: '_', desc: 'a' });
					var ques = new database.Question({ text: '_', _category: cat._id, answer: '_', wrong1: '_', wrong2: '_', wrong3: '_', answeredWrong: 0, answeredRight: 0 });
					cat
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat);
						return ques.save();
					}).then(results => {
						expect(results).to.exist.and.deep.equal(ques);
						ques.text = 'One';
						return database.modifyQuestion(ques);
					}).then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err).to.exist;
						expect(err.name).to.match(/mongoerror/i);
						expect(err.message).to.match(/duplicate.*text.*One/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('gives an error when modifying violates the category existence constraint', wrapError(function(done) {
					var cat = new database.Category({ name: '_', desc: 'a' });
					var ques = new database.Question({ text: '_', _category: cat._id, answer: '_', wrong1: '_', wrong2: '_', wrong3: '_', answeredWrong: 0, answeredRight: 0 });
					cat
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat);
						return ques.save();
					}).then(results => {
						expect(results).to.exist.and.deep.equal(ques);
						ques._category = '056805680568123712371237';
						return database.modifyQuestion(ques);
					}).then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err).to.exist;
						expect(err.name).to.match(/validationerror/i);
						expect(err.errors._category.message).to.match(/document not found/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('saves a correct answer', function(done) {
					var cat = new database.Category({ name: '_', desc: 'a' });
					var ques = new database.Question({ text: '_', _category: cat._id, answer: '_', wrong1: '_', wrong2: '_', wrong3: '_', answeredWrong: 0, answeredRight: 0 });
					cat
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat);
						return ques.save();
					}).then(results => {
						expect(results).to.exist.and.deep.equal(ques);
						return database.answeredQuestion(ques._id, true);
					}).then(results => {
						ques.answeredRight += 1;
						expect(results.toObject()).to.deep.equal(ques.toObject());
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('saves a wrong answer', function(done) {
					var cat = new database.Category({ name: '_', desc: 'a' });
					var ques = new database.Question({ text: '_', _category: cat._id, answer: '_', wrong1: '_', wrong2: '_', wrong3: '_', answeredWrong: 0, answeredRight: 0 });
					cat
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat);
						return ques.save();
					}).then(results => {
						expect(results).to.exist.and.deep.equal(ques);
						return database.answeredQuestion(ques._id, false);
					}).then(results => {
						ques.answeredWrong += 1;
						expect(results.toObject()).to.deep.equal(ques.toObject());
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('gives an error when answering to an unknown id', wrapError(function(done) {
					var cat = new database.Category({ name: '_', desc: 'a' });
					var ques = new database.Question({ text: '_', _category: cat._id, answer: '_', wrong1: '_', wrong2: '_', wrong3: '_', answeredWrong: 0, answeredRight: 0 });
					cat
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat);
						return ques.save();
					}).then(results => {
						expect(results).to.exist.and.deep.equal(ques);
						ques._id = '000000000000000000000000';
						return database.answeredQuestion(ques._id, true);
					}).then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err).to.exist.and.to.be.a('string').and.to.match(/unknown id/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
			});
			
			describe('remove (DELETE)', function() {
				it('deletes correctly', function(done) {
					var cat = new database.Category({ name: '_', desc: 'a' });
					var ques = new database.Question({ text: '_', _category: cat._id, answer: '_', wrong1: '_', wrong2: '_', wrong3: '_', answeredWrong: 0, answeredRight: 0 });
					cat
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat);
						return ques.save();
					}).then(results => {
						expect(results).to.exist.and.deep.equal(ques);
						return database.removeQuestion(ques._id);
					}).then(results => {
						expect(results.toObject()).to.exist.and.deep.equal(ques.toObject());
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('prints an error when trying to delete unknown id', wrapError(function(done) {
					var cat = new database.Category({ name: '_', desc: 'a' });
					var ques = new database.Question({ text: '_', _category: cat._id, answer: '_', wrong1: '_', wrong2: '_', wrong3: '_', answeredWrong: 0, answeredRight: 0 });
					cat
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(cat);
						return ques.save();
					}).then(results => {
						expect(results).to.exist.and.deep.equal(ques);
						ques._id = '000000000000000000000000';
						return database.removeQuestion(ques._id);
					}).then(results => {
						done('Should fail: ' + results);
					}).catch(err => {
						expect(console.error.calledOnce).to.be.true;
						expect(err).to.match(/unknown id/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
			});
		});
	});
	
	/* -------------------- *\
	 *   Questions ended    *
	\* -------------------- */
	
	describe('highscore', function() {
		afterEach('deletes highscores', function(done) {
			database.Highscore
			.remove()
			.then(results => {
				return database.Highscore.find();
			}).then(results => {
				expect(results).to.be.of.length(0);
				done();
			}).catch(err => {
				done('Should not fail: ' + err);
			});
		});
		
		describe('schema', function() {
			it('has a working highscore constructor', function() {
				expect(typeof database.Highscore === 'function').to.be.true;
				expect(typeof new database.Highscore() === 'object').to.be.true;
				expect(typeof database.Highscore() === 'object').to.be.true;
			});
			
			describe('name', function() {
				it('requires a name', function(done) {
					var high = new database.Highscore();
					high
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err).to.exist;
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors.name.message).to.match(/is required/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('requires name to be a string', function(done) {
					var high = new database.Highscore({ name: { h: 2 } });
					high
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err).to.exist;
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors.name.message).to.match(/cast to string failed/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('accepts a name', function(done) {
					var high = new database.Highscore({ name: 'John' });
					high
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err).to.exist;
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors.name).to.not.exist;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
			});
			
			describe('_categories', function() {
				it('does not require categories', function(done) {
					var high = new database.Highscore();
					high
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err).to.exist;
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors._categories).to.not.exist;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('requires categories as an array or an ObjectID-ifiable string', function(done) {
					var high = new database.Highscore({ _categories: false });
					high
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err).to.exist;
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors._categories.message).to.match(/cast to array failed/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('rejects as categories an array of mixed content', function(done) {
					var high = new database.Highscore({ _categories: ['abcdabcdabcdabcdabcdabcd', 12] });
					high
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err).to.exist;
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors._categories.message).to.match(/cast to array failed/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('accepts as categories an empty array', function(done) {
					var high = new database.Highscore({ _categories: [] });
					high
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err).to.exist;
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors._categories).to.not.exist;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('accepts a category with just a ObjectID-ifiable string', function(done) {
					var high = new database.Highscore({ _categories: 'ffffffffffffffffffffffff' });
					high
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err).to.exist;
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors._categories).to.not.exist;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('accepts as categories an array of ObjectID-ifiable strings', function(done) {
					var high = new database.Highscore({ _categories: ['ffffffffffffffffffffffff', 'eeeeeeeeeeeeeeeeeeeeeeee'] });
					high
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err).to.exist;
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors._categories).to.not.exist;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
			});
			
			describe('points', function() {
				it('requires a score', function(done) {
					var high = new database.Highscore();
					high
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err).to.exist;
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors.points.message).to.match(/is required/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('renders a negative score as invalid', function(done) {
					var high = new database.Highscore({ points: -10 });
					high
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err).to.exist;
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors.points.message).to.match(/less than minimum/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('renders a score of 0 as valid', function(done) {
					var high = new database.Highscore({ points: 0 });
					high
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err).to.exist;
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors.points).to.not.exist;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('renders a score of 10 as valid', function(done) {
					var high = new database.Highscore({ points: 10 });
					high
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err).to.exist;
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors.points).to.not.exist;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
			});
			
			describe('start', function() {
				it('requires a start', function(done) {
					var high = new database.Highscore();
					high
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err).to.exist;
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors.start.message).to.match(/is required/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('requires the start to be a date', function(done) {
					var high = new database.Highscore({ start: { h: 2 } });
					high
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err).to.exist;
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors.start.message).to.match(/cast to date failed/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('accepts a start', function(done) {
					var high = new database.Highscore({ start: Date.now() });
					high
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err).to.exist;
						expect(err.message).to.match(/validation failed/i);
						expect(err.errorsstart).to.not.exist;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
			});
			
			describe('duration', function() {
				it('renders a negative duration as invalid', function(done) {
					var high = new database.Highscore({ duration: -10 });
					high
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err).to.exist;
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors.duration.message).to.match(/less than minimum/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('renders a duration of 0 as invalid', function(done) {
					var high = new database.Highscore({ duration: 0 });
					high
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err).to.exist;
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors.duration.message).to.match(/less than minimum/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('renders a duration of 10 as valid', function(done) {
					var high = new database.Highscore({ duration: 10 });
					high
					.validate()
					.then(() => {
						done('Should not succeed!');
					}).catch(err => {
						expect(err).to.exist;
						expect(err.message).to.match(/validation failed/i);
						expect(err.errors.duration).to.not.exist;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
			});
		});
		
		describe('methods', function() {
			beforeEach('saves pre-defined highscores', function(done) {
				var highOne = new database.Highscore  ({ name: 'One', points: 1800, start: Date.now(), duration: 15 });
				var highTwo = new database.Highscore  ({ name: 'Two', points: 1800, start: Date.now(), duration: 15 });
				var highThree = new database.Highscore({ name: 'Three', points: 1800, start: Date.now(), duration: 15 });
				highOne
				.save()
				.then(result => {
					expect(result).to.deep.equal(highOne);
					return highTwo.save();
				}).then(result => {
					expect(result).to.deep.equal(highTwo);
					return highThree.save();
				}).then(result => {
					expect(result).to.deep.equal(highThree);
					done();
				}).catch(err => {
					done('Should not fail: ' + err);
				});
			});	
			
			afterEach('deletes all entries', function(done) {
				database.Highscore
				.remove()
				.then(results => {
					expect(results).to.exist;
					return database.Highscore.find();
				}).then(results => {
					expect(results).to.be.of.length(0);
					done();
				}).catch(err => {
					done('Should not fail: ' + err);
				});
			});
			
			it('sorts correctly based on weighted, descending', function() {
				var high1 = new database.Highscore({ name: 'Günther', points: 1000, start: Date.now(), duration: 10, _categories: ['abcdabcdabcdabcdabcdabcd'] });
				var high2 = new database.Highscore({ name: 'Günther', points: 2000, start: Date.now(), duration: 10, _categories: ['abcdabcdabcdabcdabcdabcd'] });
				var high3 = new database.Highscore({ name: 'Günther', points: 3000, start: Date.now(), duration: 50, _categories: ['abcdabcdabcdabcdabcdabcd'] });
				expect([high1,high2,high3].sort(database.highscoreSort)).to.deep.equal([high2, high1, high3]);
			});
			
			it('sorts correctly based on points, descending after weighted', function() {
				var high1 = new database.Highscore({ name: 'Günther', points: 40, start: Date.now(), duration: 2, _categories: ['abcdabcdabcdabcdabcdabcd'] });
				var high2 = new database.Highscore({ name: 'Günther', points: 60, start: Date.now(), duration: 3, _categories: ['abcdabcdabcdabcdabcdabcd'] });
				var high3 = new database.Highscore({ name: 'Günther', points: 20, start: Date.now(), duration: 1, _categories: ['abcdabcdabcdabcdabcdabcd'] });
				expect([high1,high2,high3].sort(database.highscoreSort)).to.deep.equal([high2, high1, high3]);
			});
			
			it('sorts correctly based on start, ascending after points after weighted', function() {
				var high1 = new database.Highscore({ name: 'Günther', points: 60, start: new Date(28), duration: 3, _categories: ['abcdabcdabcdabcdabcdabcd'] });
				var high2 = new database.Highscore({ name: 'Günther', points: 60, start: new Date(17), duration: 3, _categories: ['abcdabcdabcdabcdabcdabcd'] });
				var high3 = new database.Highscore({ name: 'Günther', points: 60, start: new Date(37), duration: 3, _categories: ['abcdabcdabcdabcdabcdabcd'] });
				expect([high1,high2,high3].sort(database.highscoreSort)).to.deep.equal([high2, high1, high3]);
			});
			
			it('sorts correctly based on name, ascending after start points after weighted', function() {
				var high1 = new database.Highscore({ name: 'Günther', points: 20, start: new Date(15), duration: 1, _categories: ['abcdabcdabcdabcdabcdabcd'] });
				var high2 = new database.Highscore({ name: 'Dieter', points: 20, start: new Date(15), duration: 1, _categories: ['abcdabcdabcdabcdabcdabcd'] });
				var high3 = new database.Highscore({ name: 'Meissner', points: 20, start: new Date(15), duration: 1, _categories: ['abcdabcdabcdabcdabcdabcd'] });
				var high4 = new database.Highscore({ name: 'Meissner', points: 20, start: new Date(15), duration: 1, _categories: ['abcdabcdabcdabcdabcdabcd'] });
				expect([high1,high2,high3,high4].sort(database.highscoreSort)).to.deep.equal([high2, high1, high3, high4]);
			});
			
			describe('save (CREATE)', function() {
				it('logs an error upon invalid save', wrapError(function(done) {
					var high = new database.Highscore();
					database
					.addHighscore(high)
					.then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err.name).to.match(/validat(or|ion)error/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('saves correctly', wrapError(function(done) {
					var high = new database.Highscore({ name: 'Günther', points: 1800, start: Date.now(), duration: 15, _categories: ['abcdabcdabcdabcdabcdabcd'] });
					database
					.addHighscore(high)
					.then(results => {
						expect(results).to.exist.and.deep.equal(high);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
			});
			
			describe('get (READ)', function() {
				it('lists all highscores correctly', function(done) {
					database
					.getHighscores()
					.then(results => {
						expect(results.map(h => h.name).sort()).to.deep.equal(['One', 'Three', 'Two']);
						done();
					}).catch(err => {
						done('Should not fail: ' + err)
					});
				});
			
				it('lists all highscores correctly when filtered', function(done) {
					database
					.getHighscores({ name: /T/ })
					.then(results => {
						expect(results.map(h => h.name).sort()).to.deep.equal(['Three', 'Two']);
						done();
					}).catch(err => {
						done('Should not fail: ' + err)
					});
				});
			
				it('gives an error upon listing with an invalid filter', wrapError(function(done) {
					database
					.getHighscores(17.42)
					.then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err).to.match(/invalid filter/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('gives an error upon listing with a filter with invalid options', wrapError(function(done) {
					database
					.getHighscores({ name: { $hans_peter: 2 } })
					.then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err).to.match(/can't use \$hans_peter with/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('counts all highscores correctly', function(done) {
					database
					.countHighscores()
					.then(results => {
						expect(results).to.equal(3);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('counts all highscores correctly when filtered', function(done) {
					database
					.countHighscores({ name: /T/ })
					.then(results => {
						expect(results).to.equal(2);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				});
				
				it('gives an error upon counting with an invalid filter', wrapError(function(done) {
					database
					.countHighscores(17.42)
					.then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err).to.match(/invalid filter/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
				
				it('gives an error upon counting with a filter with invalid options', wrapError(function(done) {
					database
					.countHighscores({ name: { $hans_peter: 2 } })
					.then(results => {
						done('Should not succeed: ' + results);
					}).catch(err => {
						expect(err).to.match(/can't use \$hans_peter with/i);
						expect(console.error.calledOnce).to.be.true;
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
			});
			
			describe('modify (UPDATE)', function() {
				it('has no modification process', function() {
					expect(database.modifyHighscore).to.not.exist;
				});
			});
			
			describe('remove (DELETE)', function() {
				it('deletes correctly', function(done) {
					var high = new database.Highscore({ name: 'Günther', points: 1800, start: Date.now(), duration: 15, _categories: ['abcdabcdabcdabcdabcdabcd'] });
					high
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(high);
						return database.removeHighscore(high._id);
					}).then(results => {
						expect(results.toObject()).to.exist.and.deep.equal(high.toObject());
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					})
				});
				
				it('prints an error when trying to delete unknown id', wrapError(function(done) {
					var high = new database.Highscore({ name: 'Günther', points: 1800, start: Date.now(), duration: 15, _categories: ['abcdabcdabcdabcdabcdabcd'] });
					high
					.save()
					.then(results => {
						expect(results).to.exist.and.deep.equal(high);
						high._id = '000055558888111122226666';
						return database.removeHighscore(high._id);
					}).then(results => {
						done('Should fail: ' + results);
					}).catch(err => {
						expect(console.error.calledOnce).to.be.true;
						expect(err).to.match(/unknown id/i);
						done();
					}).catch(err => {
						done('Should not fail: ' + err);
					});
				}));
			});
		});
	});
	
	/* -------------------- *\
	 *   Highscores ended   *
	\* -------------------- */
});
