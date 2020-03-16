const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let CommentSchema = new Schema({
    commentId : {type : String, index : true, unique : true},
    commenterId : {type : String},
    createdOn : { type : Date, default : Date.now()},
    comment : { type : String},
    issueId : { type : String},
    filesId : {type : [], default : []}
})

mongoose.model('Comment', CommentSchema)