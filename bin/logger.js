/* jshint esversion: 6, node: true */
'use strict';

var fs = require('graceful-fs');

function formatLog(date, level, message) {
	return `${date.toISOString()} | ${level} | ${message.toString().replace(/\r\n|\n|\r/g, '\r\n\t')}\r\n`;
}
 
/* istanbul ignore next */
var nodeEnvironment = process.env.NODE_ENV || 'development';
/* istanbul ignore next */
var logger = nodeEnvironment === 'development' || process.env.NODE_TESTING === 'testing' ? { 
		logError(message) { console.error(message); },
		logInfo(message) { console.info(message); }
	} : { 
		_log(message) { 
			fs.appendFile('data.log', message, (err) => {
				/* istanbul ignore if */
				if(err)
					console.log(err);
			}); 
		},
		logError(message) {
			/* istanbul ignore if */
			if(message === undefined || message === null) {
				return;
			}
			this._log(formatLog(new Date(), 'ERROR',  message));
		},
		logInfo(message) {
			/* istanbul ignore if */
			if(message === undefined || message === null) {
				return;
			}
			this._log(formatLog(new Date(), 'INFO',  message));
		}
	};
	
	
module.exports = logger;