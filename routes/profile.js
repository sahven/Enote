var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');
var Note = require('../models/note');


// Function to ensure that user is logged in before accessing the page
function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		//req.flash('error_msg','You are not logged in');
		res.redirect('/users/login');
	}
}

// Routes

// Get user Dashboard
router.get('/', ensureAuthenticated, (req,res) => {
	res.render('profile');
});


router.get('/create', ensureAuthenticated, (req,res) => {
	User.getAll(function(result) {
		var users = Object.keys(result).map(i => result[i]);
		res.render('create',{users});
	});
});


router.post('/create', ensureAuthenticated, (req,res) => {
	var subject = req.body.subject;
	var purpose = req.body.purpose;
	var details = req.body.details;
	var budget = req.body.budget;
	var reviewer1 = req.body.reviewer1;
	var reviewer2 = req.body.reviewer2;
	var reviewer3 = req.body.reviewer3;
	var authorid = req.user.id;
	var authorname = req.user.name;

	//Validation
	req.checkBody('subject', 'Subject is required').notEmpty();
	req.checkBody('purpose', 'Purpose is required').notEmpty();
	req.checkBody('details', 'Details are required').notEmpty();

	var errors = req.validationErrors();

	if (errors) {
		res.render('create', {
			errors: errors
		});
	}
	else {
		var newNote = new Note({
			author : {authorid : req.user.id, name : req.user.name},
			subject : subject,
			purpose : purpose,
			details : details,
			budget : budget,
			reviewers : [reviewer1,reviewer3,reviewer2]
		});

		Note.createNote(newNote,(err,note) => {
			if (err) throw err;
			console.log(note);
		});
		req.flash('success_msg', 'The note was created successfully.');
		res.redirect('/users/profile/');
	}
});


module.exports = router;
