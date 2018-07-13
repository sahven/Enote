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
		});

		Note.createNote(newNote,(err,note) => {
			if (err) throw err;
			note.reviewers.push({name : reviewer1,action : "Pending"});
			note.reviewers.push({name : reviewer2,action : "Pending"});
			note.reviewers.push({name : reviewer3,action : "Pending"});
			note.save();
			console.log(note);
		});
		req.flash('success_msg', 'The note was created successfully.');
		res.redirect('/users/profile/');
	}
});


router.get('/view', ensureAuthenticated, (req,res) => {
	var id = req.user.id;
	var name = req.user.name;
	// Note.getUserNotes(id, name, (err,result) => {
	// 	if (err) return console.log('Error in getting : ',err);
	// 	var notes = Object.keys(result).map(i => result[i]);
	// 	res.render('viewnote', {notes});
	// });
	var query = Note.find({"author.authorid" : id, "author.name" : name});
	query.exec((err,result) => {
		if (err) return console.log('Error : ',err);
		var notes = Object.keys(result).map(i => result[i]);
		res.render('viewnote',{notes});
	});
});

router.get('/reviewed',ensureAuthenticated, (req,res) => {
	var name = req.user.name;
	var query = Note.find({"reviewers.name" : name});
	query.exec((err,result) => {
		if (err) return console.log('Error : ' , err);
		var notes = Object.keys(result).map(i => result[i]);
		console.log('Notes : ',notes);
		var final = [];
		for (var i = notes.length - 1; i >= 0; i--) {
			for (var j = 0; j <3;j++){
				if (notes[i].reviewers[j].name === name && notes[i].reviewers[j].action !== "Pending") final.push(notes[i]);
			}
		}
		console.log('Final notes are : ',final);
		res.render('reviewed',{final});
	});
});

router.get('/toreview',ensureAuthenticated, (req,res) => {
	var name = req.user.name;
	var query = Note.find({"reviewers.name" : name, "status" : "Pending"});
	query.exec((err,result) => {
		if (err) return console.log(err);
		var notes = Object.keys(result).map(i => result[i]);
		console.log('Notes found to review are :',notes);
		var final = [];
		for (var i = notes.length - 1; i >= 0; i--) {
			for (var j = 0; j <3;j++){
				if (notes[i].reviewers[j].name === name && notes[i].reviewers[j].action === "Pending") final.push(notes[i]);
			}
		}
		console.log('Final notes found to review are :',final);
		res.render('toreview',{final});
	});
});

router.post('/toreview',ensureAuthenticated, (req,res) => {
	var comments = req.body.comments;
	var noteid = req.body.noteid;
	var action = req.body.action;
	var name = req.user.name;
	var query = Note.findById(noteid);
	query.exec((err,note) => {
		if (err) return console.log('Error occured : ', err);
		note.comments.push({by : name, body : comments});
		if (action === "Accept")
		{
			for (var i = note.reviewers.length - 1; i >= 0; i--) {
				if (note.reviewers[i].name === name) note.reviewers[i].action = "Accepted";
			}
			var c = 0;
			for (var i = note.reviewers.length - 1; i >= 0; i--) {
				if (note.reviewers[i].action !== "Accepted") c = 1;
			}
			if (c === 0) note.status = "Accepted";
			note.save();
			console.log(note);
		}
		else {
			for (var i = note.reviewers.length - 1; i >= 0; i--) {
				if (note.reviewers[i].name === name) note.reviewers[i].action = "Rejected";
			}
			note.status = "Rejected";
			note.save();
			console.log(note);
		}
		req.flash('success_msg', 'You have successfully reviewed the note.');
		res.redirect('/users/profile');
	})
	
});

module.exports = router;
