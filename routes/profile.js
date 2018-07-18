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
			if(reviewer1!="")
			{
				var q1=User.find({"email":reviewer1});
				q1.exec((err,result)=>{
					if(err) throw err;
					note.reviewers.push({mail:reviewer1,comments:"",approved:""});
					note.save();
					console.log(note);
				});
			}
		});
		req.flash('success_msg', 'The note was created successfully.');
		res.redirect('/users/profile/');
	}
});


router.get('/view', ensureAuthenticated, (req,res) => {
	var id = req.user.id;
	var name = req.user.name;
	var q = Note.find({"author.authorid":id,"author.name":name});
	q.exec((err,result) => {
		if (err) return console.log('Error : ',err);
		var notes = Object.keys(result).map(i => result[i]);
		res.render('viewnote',{notes});
	});
});

router.get('/review', ensureAuthenticated, (req,res) => {
	var email = req.user.email;
	console.log(email);
	var query =  Note.find({"reviewers":{$elemMatch:{mail:email,approved:""}}});
	query.exec((err,result) => {
		if (err) return console.log('Error : ',err);
		var notes = Object.keys(result).map(i => result[i]);
		res.render('reviewnotes',{notes});
	});
});

router.post('/review' , ensureAuthenticated, (req,res) =>{
	var email = req.user.email;
	var noteid = req.body.noteid;
	var cmt = req.body.comment;
	var r1 = req.body.reviewer1;
	var a = req.body.approve;
	var mongo = require('mongodb');
	var o_id = new mongo.ObjectID(noteid);
	var query = Note.updateOne({"_id":o_id,"reviewers.mail":email,"reviewers.approved":""},{$set:{"reviewers.$.comments":cmt,"reviewers.$.approved":a}});
	query.exec((err,result) => {
		if (err) return console.log('Error : ',err);
		if(r1!="")
		{
			var q1=User.find({"email":r1});
			q1.exec((err,result)=>{
				if(err) return console.log('Error:',err);
				var query1 = Note.updateOne({"_id":o_id},{$push:{reviewers:{mail:r1,comments:"",approved:""}}});
				query1.exec((err,result)=>{
					if(err) return console.log('Error:',err);
					});
				});
		}
		else
		{
			if(a=="yes")
			{
				var query2 = Note.updateOne({"_id":o_id},{$set:{"status":"Approved"}});
				query2.exec((err,result) => {
					if(err) throw err;
				})
			}
			else if(a=="no")
			{
				var query3 = Note.updateOne({"_id":o_id},{$set:{"status":"Rejected"}});
				query3.exec((err,result) => {
					if(err) throw err;
				})
			}
		}
		req.flash('success_msg', 'The note was reviewed successfully.');
		res.redirect('/users/profile/review');
	});
});

router.get('/reviewed', ensureAuthenticated, (req,res)=>{
	var email = req.user.email;
	console.log(email);
	var query =  Note.find({"reviewers":{$elemMatch:{mail:email,"$or":[{"approved":"yes"},{"approved":"no"}]}}});
	query.exec((err,result) => {
		if (err) return console.log('Error : ',err);
		var notes = Object.keys(result).map(i => result[i]);
		res.render('reviewednotes',{notes});
	});
})
module.exports = router;
