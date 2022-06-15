/* jshint esversion: 6, browser: true, jquery: true */
(function() {
	'use strict';
	
	
	function updateCategories(data) {
		var body = $('table#categories tbody')[0];
		if(!body || data.length === 0) {
			window.location.href = '';
			return;
		}
		body.innerHTML = '';
		
		data.forEach(function(cat) {
	
			var row = body.insertRow(-1);
			var c1 = row.insertCell(-1);
			var c2 = row.insertCell(-1);
			var c3 = row.insertCell(-1);
			c1.innerHTML = cat.name;
			c2.innerHTML = cat.desc;
			c3.innerHTML = `<form method="post" action="">
				<input type="hidden" name="_id" value="${cat._id}">
				<button type="submit" class="asLink" name="editType" value="removeCategory" title="Löschen">
				<div class="sr-only">Kategorie löschen</div><span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
				</button>
				<button type="submit" class="asLink" name="editType" value="editCategory" title="Bearbeiten">
				<div class="sr-only">Kategorie bearbeiten</div><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span>
				</button>
				</form>`;
		});
		editFormBindings();
	}
	
	function categoryForm(data) {
		
		$('form#catForm input#_id').val(data._id);
		$('form#catForm input#name').val(data.name).select();
		$('form#catForm textarea#desc').val(data.desc);
		$('form#catForm button[type="submit"] span:first-child').text('Bearbeiten ');
	}
	
	function updateQuestions(data) {
	
		var body = $('table#questions tbody')[0];
		if(!body || data.length === 0) {
			window.location.href = '';
			return;
		}
		body.innerHTML = '';
		
		data.forEach(function(que) {
	
			var row = body.insertRow(-1);
			var c1 = row.insertCell(-1);
			var c2 = row.insertCell(-1);
			var c3 = row.insertCell(-1);
			var c4 = row.insertCell(-1);
			var c5 = row.insertCell(-1);
			var c6 = row.insertCell(-1);
			var c7 = row.insertCell(-1);
			var c8 = row.insertCell(-1);
			var c9 = row.insertCell(-1);
			c1.innerHTML = que.text;
			c2.innerHTML = que._category.name;
			c3.innerHTML = que.answer;
			c4.innerHTML = que.wrong1;
			c5.innerHTML = que.wrong2;
			c6.innerHTML = que.wrong3;
			c7.innerHTML = que.answeredRight;
			c8.innerHTML = que.answeredWrong;
			c9.innerHTML = `<form method="post" action="">
				<input type="hidden" name="_id" value="${que._id}">
				<button type="submit" class="asLink" name="editType" value="removeQuestion" title="Löschen">
				<div class="sr-only">Kategorie löschen</div><span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
				</button>
				<button type="submit" class="asLink" name="editType" value="editQuestion" title="Bearbeiten">
				<div class="sr-only">Kategorie bearbeiten</div><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span>
				</button>
				</form>`;
		});
		editFormBindings();
	}
	
	function questionForm(data) {
		$('form#quesForm input#_id').val(data._id);
		$('form#quesForm input#text').val(data.text).select();
		$('form#quesForm select#_category').val(data._category);
		$('form#quesForm input#answer').val(data.answer);
		$('form#quesForm input#wrong1').val(data.wrong1);
		$('form#quesForm input#wrong2').val(data.wrong2);
		$('form#quesForm input#wrong3').val(data.wrong3);
		$('form#quesForm button[type="submit"] span:first-child').text('Bearbeiten ');
	}
	
	function updateHighscores(data) {
	
		var body = $('table#highscores tbody')[0];
		if(!body || data.length === 0) {
			window.location.href = '';
			return;
		}
		body.innerHTML = '';
		
		data.forEach(function(high, index) {
	
			var row = body.insertRow(-1);
			var c1 = row.insertCell(-1);
			var c2 = row.insertCell(-1);
			var c3 = row.insertCell(-1);
			var c4 = row.insertCell(-1);
			var c5 = row.insertCell(-1);
			var c6 = row.insertCell(-1);
			var c7 = row.insertCell(-1);
			var c8 = row.insertCell(-1);
			
			c1.innerHTML = index + 1;
			c2.innerHTML = (high.points/high.duration).toPrecision(2);
			c3.innerHTML = high.name;
			c4.innerHTML = new Date(high.start).toLocaleString();
			c5.innerHTML = high.points;
			c6.innerHTML = high.duration;
			c7.innerHTML = high._categories.length !== 0 ? high._categories.map(function(c) { return c.name; }).join(", ") : 'Kategorien nicht mehr vorhanden';
			c8.innerHTML = `<form method="post" action="">
				<input type="hidden" name="_id" value="${high._id}">
				<button type="submit" class="asLink" name="editType" value="removeHighscore" title="Löschen">
				<div class="sr-only">Highscore löschen</div><span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
				</button>
				</form>`;
		});
		editFormBindings();
	}
	
	function editFormBindings() {
		$('table.adminTable button[name="editType"]').click(function(e) {
			var type = $(e.target).parent('button').attr('value');
			var id = $(e.target).parents('form').children('input[type="hidden"][name="_id"]').attr('value');
			
			$.post('', {
				_id: id,
				ajax: true,
				editType: type
			}, function(data) {
				if(data.err === 'unauthorized') {
					window.location.href = '/login';
					return;
				}
				console.log(data.update);
				switch(data.update) {
					case 'categories':
						updateCategories(data.data);
						break;
					case 'categoryForm':
						categoryForm(data.data);
						break;
					case 'questions':
						updateQuestions(data.data);
						break;
					case 'questionForm':
						questionForm(data.data);
						break;
					case 'highscores':
						updateHighscores(data.data);
						break;
					default:
						console.log('Unknown update: ' + data.update);
				}
				}).fail(function(jqXHR, textStatus, errorThrown ) {
					if(jqXHR.statusCode !== 0) {
						$('main').append($(jqXHR.responseText).filter('main').html());
					} else {
						alert('Unknown Error.');
					}
				});
			e.preventDefault();
		});
	}
	
	function bindings() {
	
		$("form label").filter(':has(+ *:required, + br + *:required)').after($('<span title="Benötigt"> *</span>').css('color', 'red').css('font-weight', 'bold'));
		
		$('form#catForm').submit(function(e) {
			var id = $('form#catForm input#_id').val();
			var name = $('form#catForm input#name').val().trim();
			var desc = $('form#catForm textarea#desc').val().trim();
			var editType = $('form#catForm button[name="editType"]').attr('value');
			
			name = name.replace(/\r|\n/g, ' ').replace(/\s\s*/g, ' ');
			desc = desc.replace(/\r|\n/g, ' ').replace(/\s\s*/g, ' ');
			$.post('', {
				name: name,
				desc: desc,
				_id: id,
				ajax: true,
				editType: editType
			}, function(data) {
				if(data.err === 'unauthorized') {
					window.location.href = '/login';
				} else if(Object.prototype.toString.call(data) === '[object Array]') {
					updateCategories(data);
					$('form#catForm input#_id').val('-1');
					$('form#catForm input#name').val('').toggleClass('errorInput', false);
					$('form#catForm input#name + span').remove();
					$('form#catForm textarea#desc').val('');
					$('form#catForm button[type="submit"] span:first-child').text('Speichern ');
				} else {
					if(data.name) {
						$('form#catForm input#name + span').remove();
						$('form#catForm input#name').toggleClass('errorInput', true).after('<span> Name vergeben/invalid</span>');
					}
					if(data.desc) {
						$('form#catForm textarea#desc + span').remove();
						$('form#catForm textarea#desc').toggleClass('errorInput', true).after('<span> Beschreibung invalid</span>');
					}
				}
			}).fail(function(jqXHR, textStatus, errorThrown ) {
				if(jqXHR.statusCode !== 0) {
					$('main').append($(jqXHR.responseText).filter('main').html());
				} else {
					alert('Unknown Error.');
					console.error(jqXHR);
				}
			});
			e.preventDefault();
		});
		
		$('form#quesForm').submit(function(e) {
			
			var id = $('form#quesForm input#_id').val();
			var text = $('form#quesForm input#text').val().trim();
			var category = $('form#quesForm select#_category').val();
			var answer = $('form#quesForm input#answer').val().trim();
			var wrong1 = $('form#quesForm input#wrong1').val().trim();
			var wrong2 = $('form#quesForm input#wrong2').val().trim();
			var wrong3 = $('form#quesForm input#wrong3').val().trim();
			var editType = $('form#quesForm button[name="editType"]').attr('value');
			
			text = text.replace(/\r|\n/g, ' ').replace(/\s\s*/g, ' ');
			answer = answer.replace(/\r|\n/g, ' ').replace(/\s\s*/g, ' ');
			wrong1 = wrong1.replace(/\r|\n/g, ' ').replace(/\s\s*/g, ' ');
			wrong2 = wrong2.replace(/\r|\n/g, ' ').replace(/\s\s*/g, ' ');
			wrong3 = wrong3.replace(/\r|\n/g, ' ').replace(/\s\s*/g, ' ');
			
			$.post('', {
				_category: category,
				text: text,
				answer: answer,
				wrong1: wrong1,
				wrong2: wrong2,
				wrong3: wrong3,
				_id: id,
				ajax: true,
				editType: editType
			}, function(data) {
				if(data.err === 'unauthorized') {
					window.location.href = '/login';
				} else if(Object.prototype.toString.call(data) === '[object Array]') {
					
					updateQuestions(data);
					
					$('form#quesForm input#_id').val('-1');
					$('form#quesForm input#text').val('').toggleClass('errorInput', false);
					$('form#quesForm input#text + span').remove();
					$('form#quesForm select#_category').val('');
					$('form#quesForm input#answer').val('');
					$('form#quesForm input#wrong1').val('');
					$('form#quesForm input#wrong2').val('');
					$('form#quesForm input#wrong3').val('');
					$('form#quesForm button[type="submit"] span:first-child').text('Speichern ');
				} else {
					if(data.text) {
						$('form#quesForm input#text + span').remove();
						$('form#quesForm input#text').toggleClass('errorInput', true).after('<span> Text bereits vorhanden!</span>');
					}
				}
			}).fail(function(jqXHR, textStatus, errorThrown ) {
				if(jqXHR.statusCode !== 0) {
					$('main').append($(jqXHR.responseText).filter('main').html());
				} else {
					alert('Unknown Error.');
					console.error(jqXHR);
				}
			});
			e.preventDefault();
		});
		
		editFormBindings();
	}
	
	$(function() {
	
		function getPageName(pathname) {
	
			return pathname.substr(pathname.lastIndexOf('/') + 1);
		}
	
		var startingPage = getPageName(window.location.pathname);
		var startingTab = $('.nav-link[href="#"]')[0].id;
		var lastFailed = false;
		
		function loadPage(pageName, link) {
	
			$('main').load(pageName, {
				ajax: true
			}, function(resText, statusText, xhr) {
				if(statusText === 'error') {
					if(lastFailed) {
						window.location.href = '';
					} else {
						lastFailed = true;
						history.back();
					}
					return;
				}
				lastFailed = false;
				try {
					if(JSON.parse(resText).err === 'unauthorized') {
						$('main').html('<h2 style="color:red;">Session expired, redirecting</h2>');
						setTimeout(() => {
							window.location.href = '/login';
						}, 1000);
						return;
					}
				} catch(e) {
					console.log(e);
				}
				
				document.title = 'Adminbereich - ' + link.text;
				
				bindings();
				$('input[autofocus]').focus();
				$('.nav-link').parents('li').toggleClass('active', false);
				$(link).parents('li').toggleClass('active', true);
				$('#nav-home').attr('href', 'home');
				$('#nav-category').attr('href', 'category');
				$('#nav-question').attr('href', 'question');
				$('#nav-highscore').attr('href', 'highscore');
				link.href = '#';
			});
		}
		
		$(window).bind('popstate', function(event) {
			var state = event.originalEvent.state;
			if(state) {
				loadPage(state.page, $('#'+state.tab)[0]);
			} else {
				loadPage(startingPage, $('#'+startingTab)[0]);
			}
		});
		
		$('.nav-link').click(function(e) {
	
			if(!e.ctrlKey && !e.shiftKey) {
				if(!getPageName(e.target.href).endsWith('#')) {
					loadPage(getPageName(e.target.pathname), e.target);
					history.pushState({
						page: getPageName(e.target.pathname),
						tab: e.target.id
					}, '', e.target.href);
				}
				e.preventDefault();
			}
		});
		bindings();
	});
})();