const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let FilesSchema = new Schema({
    fileId : {type : String, index : true, unique : true},
    fileFor : {type : String},
    fileForId : {type : String},
    fileName : {type : String}
})

mongoose.model('Files', FilesSchema)