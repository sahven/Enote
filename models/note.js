var mongoose = require('mongoose');
const {Schema} = require('mongoose');


//Author Schema
var authorSchema = mongoose.Schema({
	authorid : Schema.Types.ObjectId,
	name : String
});

var reviewerSchema = mongoose.Schema({
	mail : String,
	comments : String,
	approved : String
})
// Note Schema
var NoteSchema = mongoose.Schema({
	author : {
		type : authorSchema
	},
	subject : {
		type : String,
		required : true
	},
	date : {
		type : Date,
		default : Date.now
	},
	purpose : {
		type : String
	},
	details : {
		type : String,
		required : true
	},
	budget : {
		type : String
	},
	reviewers : {
		type : [reviewerSchema]
	},
	status : {
		type : String,
		default : "Pending"
	}
});

var Note = module.exports = mongoose.model('Note', NoteSchema);

module.exports.createNote = (newNote,callback) => {
	newNote.save(callback);
};
