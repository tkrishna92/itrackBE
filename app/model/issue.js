const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let IssueSchema = new Schema({
    issueId : {type: String, index : true, unique : true},
    reporterId : {type : String},
    assignedToId : { type : String},
    status : {type : String, default : "new"},
    createdOn : {type : Date, default : Date.now()},
    title : { type : String},
    description : {type : String},
    watchersId : { type : [], default : []},
    commentsId : { type : [], default : []}
})

mongoose.model('Issue', IssueSchema)