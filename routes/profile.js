var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');

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


module.exports = router;
