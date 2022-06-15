/* jshint esversion: 6, browser: true, jquery: true */

var percentage;
var timeCounter;

$(function() {
	'use strict';

	$('span', correctness).text('');
	correctness.classList.add("withBar");
	
	// progressbar.js@1.0.0 version is used
	// Docs: http://progressbarjs.readthedocs.org/en/1.0.0/
	percentage = new ProgressBar.Circle(correctness, {
		color: '#aaa',
		// This has to be the same size as the maximum width to
		// prevent clipping
		strokeWidth: 5,
		trailWidth: 3,
		easing: 'easeFromTo',
		duration: 700,
		text: {
			autoStyleContainer: false,
			style: {
				position: 'absolute',
				left: '50%',
				top: '50%',
				padding: '0px',
				margin: '0px',
				transform: {
					value: 'translate(-50%, -50%)',
					prefix: true
				},
				color: 'rgb(170, 170, 170)'
			}
		},
		from: {
			color: '#d32900',
			width: 2
		},
		to: {
			color: '#11d411',
			width: 5
		},
		// Set default step function for all animate calls
		step: function(state, circle) {

			circle.path.setAttribute('stroke', state.color);
			circle.path.setAttribute('stroke-width', state.width);
			
			var value = Math.round(circle.value() * 100);
			circle.setText(value + '% Korrekt');
		},
		warnings: true
	});
	percentage.text.style.fontFamily = '"Raleway", Helvetica, sans-serif';
	percentage.text.style.fontSize = '2rem';
	
	percentage.animate(correctness.getAttribute('data-correct'));
	
	$('span', time).text('');
	time.classList.add("withBar");

	timeCounter = new ProgressBar.Circle(time, {
		color: '#aaa',
		// This has to be the same size as the maximum width to
		// prevent clipping
		strokeWidth: 7,
		trailWidth: 4,
		easing: 'easeInOut',
		duration: 600,
		text: {
			autoStyleContainer: false,
			style: {
				position: 'absolute',
				left: '50%',
				top: '50%',
				padding: '0px',
				margin: '0px',
				transform: {
					value: 'translate(-50%, -50%)',
					prefix: true
				},
				color: 'rgb(170, 170, 170)'
			}
		},
		from: {
			color: '#999',
			width: 7
		},
		to: {
			color: '#999',
			width: 7
		},
		// Set default step function for all animate calls
		step: function(state, circle) {

			circle.path.setAttribute('stroke', state.color);
			circle.path.setAttribute('stroke-width', state.width);
			
			var value = Math.round(circle.value() * 30);
			circle.setText(value);
		},
		warnings: true
	});
	timeCounter.text.style.fontFamily = '"Raleway", Helvetica, sans-serif';
	timeCounter.text.style.fontSize = '2rem';
	
	timeCounter.animate(~~((new Date() - new Date(time.getAttribute('data-start'))) / 1000) / 30);
	setInterval(() => {
		timeCounter.animate(~~((new Date() - new Date(time.getAttribute('data-start'))) / 1000) / 30);
	}, 1000);
});