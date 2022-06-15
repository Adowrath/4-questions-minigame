/* jshint esversion: 6, browser: true, jquery: true */
$(function() {
	'use strict';
	
	$('form#loginForm').submit(function(e) {
		
		var user = $('form#loginForm input#user').val().trim();
		var pw = $('form#loginForm input#pw').val();
		
		$.post('', {
			user: user,
			pw: pw,
			ajax: true
		}, function(data) {

			if(data.valid) {
				window.location.href = '/admin';
			} else {
				if($('div#loginFailed').length === 0) {
					$(`<div class="alert alert-danger" id="loginFailed" role="alert">
					     <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"/>
					     <span class="sr-only">Error: </span>
					     Falscher Benutzername oder Passwort
					   </div>`).insertAfter('form#loginForm h2.form-signin-heading');
				}
			}
		});
		e.preventDefault();
	});
	
});