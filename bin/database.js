/* jshint esversion: 6, node: true */
'use strict';

var logger = require('./logger');

var required = true;
var index = true;
var unique = true;

var mongoose = require('mongoose');
var idexists = require('mongoose-idexists');
var Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

var categorySchema = new Schema({
	name: { type: String, required, index, unique },
	desc: { type: String, required } 
});
var questionSchema = new Schema({
	text: { type: String, required, index, unique },
	_category: { type: Schema.ObjectId, ref: 'Category', required },
	answer: { type: String, required },
	wrong1: { type: String, required },
	wrong2: { type: String, required },
	wrong3: { type: String, required },
	answeredRight: { type: Number, required, min: 0 },
	answeredWrong: { type: Number, required, min: 0 }
});
var highscoreSchema = new Schema({
	name: { type: String, required, index },
	_categories: { type: [{ type: Schema.ObjectId, ref: 'Category' }], default: [] }, // Wenn eine Kategorie gelöscht wird, werden die Highscores nicht gelöscht
	points: { type: Number, required, min: 0 },
	start: { type: Date, required },
	duration: { type: Number, required, min: 1 }
});

var username = 'admin',
    password = 'asdf',
    server   = 'localhost',
    port     = '27017',
    db       = process.env.NODE_TESTING === 'testing' ? 'million_testing' : /* istanbul ignore next */ 'million',
    authDb   = 'admin';

var url = `mongodb://${username}:${password}@${server}:${port}/${db}?authSource=${authDb}`;

var db = mongoose.createConnection(url);

idexists.forPath(questionSchema.path("_category"), { connection: db });

var Category = db.model('Category', categorySchema);
var Question = db.model('Question', questionSchema);
var Highscore = db.model('Highscore', highscoreSchema);

var categories;
var catTimeout = 0;

function addCategory(category) {
	
	return category
			.save()
			.then(result => {
				categories = undefined;
				return result;
			}).catch(err => {
				logger.logError(err);
				return Promise.reject(err);
			});
}

function modifyCategory(category) {
	
	return Category
			.findByIdAndUpdate(category._id, category, { new: true, runValidators: true })
			.then(result => {
				categories = undefined;
				questions = undefined;
				
				if(!result) {
					throw 'unknown id: ' + category._id;
				}
				return result;
			}).catch(err => {
				logger.logError(err);
				return Promise.reject(err);
			});
}

function removeCategory(id) {
	return Promise.all([
		Question.remove({ _category: id }),
		Highscore.update({ _categories: id }, { $pull: { _categories: id } }, { multi: true })
	]).then(result => {
		console.log();
		categories = undefined;
		questions = undefined;
		
		return Category.findByIdAndRemove(id);
	}).then(result => {
		if(!result) {
			throw 'unknown id: ' + id;
		}
		return result;
	}).catch(err => {
		logger.logError(err);
		return Promise.reject(err);
	});
}

function loadCategories() {
	
	return Category
			.find()
			.then(result => {
				
				clearTimeout(catTimeout);
				categories = result;
				/* istanbul ignore next */
				catTimeout = setTimeout(() => { categories = undefined; }, 30000);
				
				return result;
			}).catch(err => {
				/* istanbul ignore next */
				logger.logError(err);
				/* istanbul ignore next */
				return Promise.reject(err);
			});
}

function getCategories(filter) {
	if(filter !== undefined && filter !== null && typeof filter !== 'object') {
		logger.logError('invalid filter: ' + filter);
		return Promise.reject('invalid filter: ' + filter);
	}
	if(filter === undefined || filter === null || Object.keys(filter).length === 0) {
		var c = categories;
		/* istanbul ignore next */
		if(c) {
			return Promise.resolve(c);
		}
		/* istanbul ignore next */
		return loadCategories();
	}
	
	return Category
			.find(filter)
			.catch(err => {
				logger.logError(err);
				return Promise.reject(err);
			});
}

function getCategory(id) {
	
	return Category
			.findById(id)
			.catch(err => {
				logger.logError(err);
				return Promise.reject(err);
			});
}

function categorySort(a, b) {
	return a.name < b.name ? -1 : 1;
}

function countCategories(filter) {
	if(filter !== undefined && filter !== null && typeof filter !== 'object') {
		logger.logError('invalid filter: ' + filter);
		return Promise.reject('invalid filter: ' + filter);
	}
	if(filter === undefined || filter === null || Object.keys(filter).length === 0) {
		var c = categories;
		/* istanbul ignore next */
		if(c) {
			return Promise.resolve(c.length);
		}
		/* istanbul ignore next */
		return loadCategories().then(result => result.length);
	}
	
	return Category
			.count(filter)
			.catch(err => {
				logger.logError(err);
				return Promise.reject(err);
			});
}

var questions;
var queTimeout = 0;

function addQuestion(question) {
	
	return question
			.save()
			.then(result => {
				questions = undefined;
				return result;
			}).catch(err => {
				logger.logError(err);
				return Promise.reject(err);
			});
}

function modifyQuestion(question) {
	
	return Question
			.findByIdAndUpdate(question._id, question, { new: true, runValidators: true })
			.then(result => {
				questions = undefined;
				if(!result) {
					throw 'unknown id: ' + question._id;
				}
				
				return result.populate('_category');
			}).catch(err => {
				logger.logError(err);
				return Promise.reject(err);
			});
}

function answeredQuestion(id, correct) {
	
	return Question
			.findByIdAndUpdate(id, {
				$inc: { [correct ? 'answeredRight' : 'answeredWrong']: 1 }
			}, { new: true, runValidators: true })
			.then(result => {
				questions = undefined;
				if(!result) {
					throw 'unknown id: ' + id;
				}
				return result;
			}).catch(err => {
				logger.logError(err);
				return Promise.reject(err);
			});
}

function removeQuestion(id) {

	return Question
			.findByIdAndRemove(id)
			.then(result => {
				questions = undefined;
				if(!result) {
					throw 'unknown id: ' + id;
				}
				return result;
			}).catch(err => {
				logger.logError(err);
				return Promise.reject(err);
			});
}

function loadQuestions() {
	
	return Question
			.find()
			.populate('_category')
			.then(result => {
				
				clearTimeout(queTimeout);
				questions = result;
				/* istanbul ignore next */
				queTimeout = setTimeout(() => { questions = undefined; }, 30000);
				
				return result;
			}).catch(err => {
				/* istanbul ignore next */
				logger.logError(err);
				/* istanbul ignore next */
				return Promise.reject(err);
			});	
}

function getQuestions(filter) {
	
	if(filter !== undefined && filter !== null && typeof filter !== 'object') {
		logger.logError('invalid filter ' + filter);
		return Promise.reject('invalid filter ' + filter);
	}
	
	if(filter === undefined || filter === null || Object.keys(filter).length === 0) {
		var q = questions;
		/* istanbul ignore next */
		if(q) {
			return Promise.resolve(q);
		}
		return loadQuestions();
	}
	
	return Question
			.find(filter)
			.populate('_category')
			.catch(err => {
				logger.logError(err);
				return Promise.reject(err);
			});
}

function getQuestion(id) {
	
	return Question
			.findById(id)
			.catch(err => {
				logger.logError(err);
				return Promise.reject(err);
			});
}

function questionSort(a, b) {
	return a._category.name < b._category.name ? 
			-1 : 
				a._category.name > b._category.name ? 
						1 : 
							a.text < b.text ? 
									-1 : 
										1;
}

function countQuestions(filter) {
	if(filter !== undefined && filter !== null && typeof filter !== 'object') {
		logger.logError('invalid filter: ' + filter);
		return Promise.reject('invalid filter: ' + filter);
	}
	if(filter === undefined || filter === null || Object.keys(filter).length === 0) {
		var q = questions;
		/* istanbul ignore next */
		if(q) {
			return Promise.resolve(q.length);
		}
		/* istanbul ignore next */
		return loadQuestions().then(result => result.length);
	}
	
	return Question
			.count(filter)
			.catch(err => {
				logger.logError(err);
				return Promise.reject(err);
			});
}

function addHighscore(highscore) {

	return highscore
			.save()
			.catch(err => {
				logger.logError(err);
				return Promise.reject(err);
			});
}

function removeHighscore(id) {

	return Highscore
			.findByIdAndRemove(id)
			.then(result => {
				if(!result) {
					throw 'unknown id: ' + id;
				}
				return result;
			}).catch(err => {
				logger.logError(err);
				return Promise.reject(err);
			});
}

function getHighscores(filter) {
	if(filter !== undefined && typeof filter !== 'object') {
		logger.logError('invalid filter: ' + filter);
		return Promise.reject('invalid filter: ' + filter);
	}
	
	return Highscore
			.find(filter)
			.populate('_categories')
			.catch(err => {
				logger.logError(err);
				return Promise.reject(err);
			});
}

function highscoreSort(a, b) {
	var aWeight = ~~(a.points/a.duration);
	var bWeight = ~~(b.points/b.duration);
	return aWeight < bWeight ? 
			1 :
				aWeight > bWeight ?
						-1 :
							a.points < b.points ?
									1 :
										a.points > b.points ?
												-1 :
													a.start < b.start ?
															-1 :
																a.start > b.start ?
																		1 :
																			a.name < b.name ?
																					-1 :
																						a.name > b.name ?
																								1 :
																									0;
}

function countHighscores(filter) {
	if(filter !== undefined && filter !== null && typeof filter !== 'object') {
		logger.logError('invalid filter: ' + filter);
		return Promise.reject('invalid filter: ' + filter);
	}
	
	return Highscore
			.count(filter)
			.catch(err => {
				logger.logError(err);
				return Promise.reject(err);
			});
}
	
module.exports = {
	Category,
	addCategory,
	modifyCategory,
	removeCategory,
	getCategories,
	getCategory,
	categorySort,
	countCategories,
	
	Question,
	addQuestion,
	modifyQuestion,
	answeredQuestion,
	removeQuestion,
	getQuestions,
	getQuestion,
	questionSort,
	countQuestions,
	
	Highscore,
	addHighscore,
	removeHighscore, 
	getHighscores,
	highscoreSort,
	countHighscores
};
