//external modules
const mongoose = require('mongoose');
const shortId = require('shortid');
const path = require('path');
const mime = require('mime');
const fs = require('fs');

//libraries
const check = require('./../libs/checkLib');
const logger = require('./../libs/loggerLib');
const response = require('./../libs/responseLib');
const time = require('./../libs/timeLib');
const token = require('./../libs/tokenLib');


//models
const userModel = mongoose.model('User');
const issueModel = mongoose.model('Issue');
const commentModel = mongoose.model('Comment');
const fileModel = mongoose.model('Files');

// create a new issue
let createNewIssue = (req, res) => {

    //checking required input parameters
    let validateInput = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(req.body.issueTitle) || check.isEmpty(req.body.issueDescription) || check.isEmpty(req.body.assignedToId)) {
                logger.error("required input not valid", "issueController : createNewIssue - validateInput", 9);
                let apiResponse = response.generate(true, "required input not valid", 500, null);
                reject(apiResponse);
            } else {
                resolve();
            }
        })
    }

    //creating a new issue
    let creatingIssue = () => {
        return new Promise((resolve, reject) => {
            let newIssue = new issueModel({
                issueId: shortId.generate(),
                reporterId: req.user.userId,
                assignedToId: req.body.assignedToId,
                title: req.body.issueTitle,
                description: req.body.issueDescription,
                watchersId: [req.user.userId, req.body.assignedToId],
                createdOn: time.localTimeNow()
            })
            newIssue.save((err, result) => {
                if (err) {
                    logger.error("error saving new issue", "issueController : createNewIssue - creatingIssue", 9);
                    let apiResponse = response.generate(true, "error while saving new issue", 500, err);
                    reject(apiResponse);
                } else {
                    logger.info("new issue created successfully", "issueController : createNewIssue - creatingIssue", 8);
                    let newIssueDetails = result.toObject();
                    delete newIssueDetails.__v;
                    delete newIssueDetails._id;
                    resolve(newIssueDetails);
                }
            })
        })
    }

    //adding the new issue to the watched list of reported and assignedTo user
    let addIssueToWatchList = (newIssueDetails) => {
        return new Promise((resolve, reject) => {
            userModel.findOneAndUpdate({ userId: req.user.userId }, { $push: { watchingIssues: newIssueDetails.issueId } }, (err, result) => {
                if (err) {
                    logger.error("error updating new issue to reporter issue watchlist", "issueController : createNewIssue - addIssueToWatchList(reporter)", 9);
                    let apiResponse = response.generate(true, "error while updating new issue to reporter issue watchlist", 500, err);
                    reject(apiResponse);
                } else if (check.isEmpty(result)) {
                    logger.error("reporter detial not found to update the watchlist", "issueController : createNewIssue - addIssueToWatchList(reporter)", 9);
                    let apiResponse = response.generate(true, "reporter details not found to update the issue", 404, null);
                    reject(apiResponse);
                } else {
                    let updateObj = {
                        $push: { watchingIssues: newIssueDetails.issueId, assignedIssues: newIssueDetails.issueId }
                    }
                    userModel.findOneAndUpdate({ userId: req.body.assignedToId }, updateObj, (err, assignResult) => {
                        if (err) {
                            logger.error("error while adding the new issue to the assigned user", "issueController : createNewIssue - addIssueToWatchList(assignedTo)", 9);
                            let apiResponse = response.generate(true, "error while adding the new issue to assigned user", 500, err);
                            reject(apiResponse);
                        } else if (check.isEmpty(assignResult)) {
                            logger.error("user detail to assign the issue not found", "issueController : createNewIssue - addIssueToWatchList(assignedTo)", 9);
                            let apiResponse = response.generate(true, "user details to assign the issue not found", 404, null);
                            reject(apiResponse);
                        } else {
                            resolve(newIssueDetails);
                        }
                    })
                }
            })
        })
    }

    validateInput()
        .then(creatingIssue)
        .then(addIssueToWatchList)
        .then((newIssueDetails) => {
            let apiResponse = response.generate(false, "issue created successfully", 200, newIssueDetails);
            res.send(apiResponse);
        })
        .catch((error) => {
            res.send(error);
        })
}


//delete issue
let deleteIssue = (req, res) => {

    //find the issue details
    let findIssue = () => {
        return new Promise((resolve, reject) => {
            queryObj = {
                $and: [
                    { issueId: req.body.issueId },
                    {
                        $or: [
                            { reporterId: req.user.userId },
                            { assignedId: req.user.userId }
                        ]
                    }
                ]
            }
            issueModel.findOne(queryObj, (err, result) => {
                if (err) {
                    logger.error("error finding the issue details", "issueController : deleteIssue - findIssue", 9);
                    let apiResponse = response.generate(true, "error while finding the issue details to delete", 500, err);
                    reject(apiResponse);
                } else if (check.isEmpty(result)) {
                    logger.error("issue details not found", "issueController : deleteIssue - findIssue", 9);
                    let apiResponse = response.generate(true, "issue details not found", 404, null);
                    reject(apiResponse);
                } else {
                    let issueDetails = result.toObject();
                    resolve(issueDetails);
                }
            })
        })
    }

    //removing the issue from assigned user's assignments
    let deleteFromAssignedUser = (issueDetails) => {
        return new Promise((resolve, reject) => {
            updateObj = {
                $pull: { assignedIssues: issueDetails.issueId }
            }
            userModel.findOneAndUpdate({ userId: issueDetails.assignedToId }, updateObj, (err, result) => {
                if (err) {
                    logger.error("error while unassigning the issue", "issueController : deleteIssue - deleteFromAssignedUser", 9);
                    let apiResponse = response.generate(true, "error while unassigning the issue", 500, err);
                    reject(apiResponse);
                } else {
                    resolve(issueDetails);
                }
            })
        })
    }

    //deleting the issue from all the watchers watching list
    let deleteFromWatcherList = (issueDetails) => {
        console.log("deleting from watchers list")
        return new Promise((resolve, reject) => {
            updateObj = {
                $pull: { watchingIssues: issueDetails.issueId }
            }
            for (let user of issueDetails.watchersId) {
                userModel.findOneAndUpdate({ userId: user }, updateObj, (err, result) => {
                    if (err) {
                        logger.error("error while removing the issue from a user's watch list", "issueController : deleteIssue - deleteFromWatcherList", 9);
                        let apiResponse = response.generate(true, "error while removing the issue from a user's watch list", 500, err);
                        reject(apiResponse);
                    } else {

                    }
                })
            }
            resolve(issueDetails);
        })
    }

    //deleting the issue details
    let deletingIssue = (issueDetails) => {
        return new Promise((resolve, reject) => {
            issueModel.findOneAndDelete({ issueId: issueDetails.issueId }, (err, result) => {
                if (err) {
                    logger.error("error while deleting the issue", "issueController : deleteIssue - deletingISsue", 9);
                    let apiResponse = response.generate(true, "error while deleting the issue", 500, err);
                    reject(apiResponse);
                } else {
                    let deletedIssue = result.toObject();
                    delete deletedIssue.__v;
                    delete deleteIssue._id;
                    resolve(deletedIssue);
                }
            })
        })
    }

    findIssue()
        .then(deleteFromAssignedUser)
        .then(deleteFromWatcherList)
        .then(deletingIssue)
        .then((deletedIssue) => {
            let apiResponse = response.generate(false, "issue deleted successfully", 200, deletedIssue);
            res.send(apiResponse);
        })
        .catch((error) => {
            res.send(error);
        })

}

//edit issue
let editIssue = (req, res) => {

    //validating input 
    let validatingInput = () => {
        return new Promise((resolve, reject) => {
            if (check.isEmpty(req.body.issueId)) {
                logger.error("issue information not provided", "issueController : editIssue - validatingInput", 9);
                let apiResponse = response.generate(true, "details of the issue to edit not valid", 400, null);
                reject(apiResponse);
            }
            else {
                resolve();
            }
        })
    }

    //edit title or description of the issue
    let editTitleOrDescription = () => {
        return new Promise((resolve, reject) => {
            let updateObj = {
                title: req.body.title,
                description: req.body.description
            }
            issueModel.update({ issueId: req.body.issueId }, updateObj, (err, result) => {
                if (err) {
                    logger.error("error editing issue details", "issueController : editIssue - editTitleOrDescription", 9);
                    let apiResponse = response.generate(true, "error editing issue details", 500, err);
                    reject(apiResponse);
                } else if (check.isEmpty(result)) {
                    logger.error("could not find issue to update", "issueController : editIssue - editTitleOrDescription", 9);
                    let apiResponse = response.generate(true, "issue details not found", 404, null);
                    reject(apiResponse);
                } else {
                    let updatedIssue = result;
                    resolve(updatedIssue);
                }
            })
        })
    }

    validatingInput()
        .then(editTitleOrDescription)
        .then((updatedIssue) => {
            let apiResponse = response.generate(false, "issue details editted successfully", 200, updatedIssue);
            res.send(apiResponse);
        })
        .catch((error) => {
            res.send(error);
        })
}

//get single issue details
let getSingleIssue = (req, res)=>{
    issueModel.findOne({issueId : req.body.issueId})
    .lean()
    .exec((err, result)=>{
        if(err){
            logger.error("error retreiving selected issue", "issueController : getSingleIssue", 9);
            let apiResponse = response.generate(true, "error whilre retreiving selected issue", 500, err);
            res.send(apiResponse);
        }else if(check.isEmpty(result)){
            logger.error("issue details not found", "issueController : getSingleIssue", 9);
            let apiResponse = response.generate(true, "issue details not found", 404, null);
            res.send(apiResponse);
        }else{
            logger.info("issue details retreived successfully", "issueController : getSingleIssue", 9);
            let issueDetails = result;
            delete issueDetails.__v;
            delete issueDetails._id;
            let apiResponse = response.generate(false, "showing selected issue", 200, issueDetails);
            apiResponse["count"] = 0;
            res.send(apiResponse);
        }
    })
}

//get all issues
let getAllIssues = (req, res) => {
    if(req.body.statusFilter){
        queryObj = {
            status : req.body.statusFilter
        }
    }else{
        queryObj = {}
    }
    issueModel.find(queryObj)
        .select('-_id -__v')
        .sort('-createdOn')
        .skip(parseInt(req.body.skip) || 0)
        .lean()
        .limit(10)
        .exec((err, result) => {
            if (err) {
                logger.error("error while retreiving issues", "issueController : getAllIssues", 9);
                let apiResponse = response.generate(true, "error while retreiving issues", 500, err);
                res.send(apiResponse);
            } else if (check.isEmpty(result)) {
                logger.error("no issues found", "issueController : getAllIssues", 9);
                let apiResponse = response.generate(true, "issues not found", 404, null);
                res.send(apiResponse);
            } else {
                logger.info("issues retreived successfully", "issueController : getAllIssues", 9);
                issueModel.countDocuments(queryObj,(err, count)=>{
                    if(err){
                        logger.info("unable to get count of total filtered issue", "issueController : getAllIssues-findingCount",9);                        
                    }else{
                        let apiResponse = response.generate(false, "issues retreived successfully", 200, result);
                        apiResponse.count = count;
                        res.send(apiResponse);
                    }
                })
                
            }
        })
}

//get all the issues assigned to the logged in user
let getAssignedIssues = (req, res)=>{
    if(req.body.statusFilter){
        queryObj = {
        $and: [
                {assignedToId : req.user.userId},
                {status : req.body.statusFilter}
            ]
        }
    }else{
        queryObj = {assignedToId : req.user.userId}
    }
    issueModel.find(queryObj)
    .select('-__v -_id')
    .sort('-createdOn')
    .skip(parseInt(req.body.skip) || 0)
    .lean()
    .limit(10)
    .exec((err, result)=>{
        if(err){
            logger.error("error while retreiving assigned issues", "issueController : getAssignedIssues", 9);
            let apiResponse = response.generate(true, "error while retreiving assigned issues", 500, err);
            res.send(apiResponse);
        }else if(check.isEmpty(result)){
            logger.error("no assigned issues found", "issueController : getAssignedIssues", 9);
            let apiResponse = response.generate(true, "no assigned issues found", 404, null);
            res.send(apiResponse);
        }else {
            logger.info("issues found", "issueController : getAssignedIssues", 9);
            issueModel.countDocuments(queryObj,(err, count)=>{
                if(err){
                    logger.info("unable to get count of total filtered issue", "issueController : getAllIssues-findingCount",9);                        
                }else{
                    let apiResponse = response.generate(true, "issues found", 200, result);
                    apiResponse.count = count;
                    res.send(apiResponse);
                }
            })
        }
    })
}

//get watching issues of logged in user
let getWatchingIssues = (req, res)=>{
    if(req.body.statusFilter){
        queryObj = {
        $and: [
                {watchersId : req.user.userId},
                {status : req.body.statusFilter}
            ]
        }
    }else{
        queryObj = {watchersId : req.user.userId}
    }
    issueModel.find(queryObj)
    .select('-__v -_id')
    .sort('-createdOn')
    .skip(parseInt(req.body.skip) || 0)
    .lean()
    .limit(10)
    .exec((err, result)=>{
        if(err){
            logger.error("error while retreiving user watching issues", "issueController : getWatchingIssue", 9);
            let apiResponse = response.generate(true, "error while retreiving your watched issues", 500, err);
            res.send(apiResponse);
        }else if(check.isEmpty(result)){
            logger.error("no watching issues found", "issueController : getWatchingIssues", 9);
            let apiResponse = response.generate(true, "no watching issues found", 404, null);
            res.send(apiResponse);
        }else{
            logger.info("successfully retreived watching issues", "issueController : getWatchingIssues", 9);
            issueModel.countDocuments(queryObj,(err, count)=>{
                if(err){
                    logger.info("unable to get count of total filtered issue", "issueController : getWatchingIssues-findingCount",9);                        
                }else{
                    let apiResponse = response.generate(false, "showing watching issues", 200, result);
                    apiResponse.count = count;
                    res.send(apiResponse);
                }
            })            
        }
    })
}

//get issues reported by user
let getReportedIssues = (req, res)=>{
    if(req.body.statusFilter){
        queryObj = {
        $and: [
                {reporterId : req.user.userId},
                {status : req.body.statusFilter}
            ]
        }
    }else{
        queryObj = {reporterId : req.user.userId}
    }
    issueModel.find(queryObj)
    .select('-__v -_id')
    .sort('-createdOn')
    .skip(parseInt(req.body.skip) || 0)
    .lean()
    .limit(10)
    .exec((err, result)=>{
        if(err){
            logger.error("error while retreiving user reported issues", "issueController : getReportedIssues", 9);
            let apiResponse = response.generate(true, "error while retreiving your reported issues", 500, err);
            res.send(apiResponse);
        }else if(check.isEmpty(result)){
            logger.error("no reported issues found", "issueController : getReportedIssues", 9);
            let apiResponse = response.generate(true, "no reported issues found", 404, null);
            res.send(apiResponse);
        }else{
            logger.info("successfully retreived reported issues", "issueController : getReportedIssues", 9);
            issueModel.countDocuments(queryObj,(err, count)=>{
                if(err){
                    logger.info("unable to get count of total filtered issue", "issueController : getReportedIssues-findingCount",9);                        
                }else{
                    let apiResponse = response.generate(false, "showing reported issues", 200, result);
                    apiResponse.count = count;
                    res.send(apiResponse);
                }
            })            
        }
    })
}

//assign issue to user
let assignIssue = (req, res) => {

    //finding issue details
    let findIssue = () => {
        return new Promise((resolve, reject) => {
            issueModel.findOne({ issueId: req.body.issueId }, (err, result) => {
                if (err) {
                    logger.error("error retrieving issue details", "issueController : assignIssue - findIssue", 9);
                    let apiResponse = response.generate(true, "error while retrieving issue details", 500, err);
                    reject(apiResponse);
                } else if (check.isEmpty(result)) {
                    logger.error("issue details not found", "issueController : assignIssue - findIssue", 9);
                    let apiResponse = response.generate(true, "issue details not found", 404, null);
                    reject(apiResponse);
                } else {
                    let issueDetails = result.toObject();
                    resolve(issueDetails);
                }
            })
        })
    }


    //updating the previous assigned user
    let updatePreviousUser = (issueDetails) => {
        return new Promise((resolve, reject) => {
            let updateObj = {
                $pull: { assignedIssues: issueDetails.issueId }
            }
            userModel.update({ userId: issueDetails.assignedToId }, updateObj, (err, result) => {
                if (err) {
                    logger.error("error while updating the current user assigned with the issue", "issueController : assignIssue - updatePreviousUser", 9);
                    let apiResponse = response.generate(true, "error while updating the current user assigned with the issue", 500, err);
                    reject(apiResponse);
                } else if (result.n == 0) {
                    logger.error("current assigned user not found", "issueController : assignIssue - updatePreviousUser", 9);
                    let apiResponse = response.generate(true, "current assigned user details not found", 404, null);
                    reject(apiResponse);
                } else {
                    logger.info("current user un-assigned of the issue", "issueController : assignIssue - updatePreviousUser", 9);
                    resolve(issueDetails);
                }
            })
        })
    }

    //assigning new user with the issue
    let updateNewUser = (issueDetails) => {
        return new Promise((resolve, reject) => {
            let updateObj = {
                $push: { assignedIssues: issueDetails.issueId }
            }
            userModel.update({ userId: req.body.assignToId }, updateObj, (err, result) => {
                if (err) {
                    logger.error("error while assigning the issue to user", "issueController : assignIssue - updateNewUser", 9);
                    let apiResponse = response.generate(true, "error while assigning the issue to user", 500, err);
                    reject(apiResponse);
                } else if (result.n == 0) {
                    logger.error("user details not found to assing the issue", "issueController : assignIssue - updateNewUser", 9);
                    let apiResponse = response.generate(true, "user details not found", 404, null);
                    reject(apiResponse);
                } else {
                    logger.info("new user assigned with the issue", "issueController : assignIssue - updateNewUser", 9);
                    resolve(issueDetails);
                }
            })
        })
    }

    //update issue
    let updateIssue = (issueDetails) => {
        return new Promise((resolve, reject) => {
            let updateObj = {
                assignedToId: req.body.assignToId
            }
            issueModel.update({ issueId: req.body.issueId }, updateObj, (err, result) => {
                if (err) {
                    logger.error("error assigning the issue to another user", "issueController : assignIssue", 9);
                    let apiResponse = response.generate(true, "error while assigning the issue to another user", 500, err);
                    reject(apiResponse);
                } else if (result.n == 0) {
                    logger.error("issue details not found", "issueController : assigningIssue", 9);
                    let apiResponse = response.generate(true, "issue details not found", 404, null);
                    reject(apiResponse);
                } else {
                    logger.info("issue successfully reassigned", "issueController : assignIssue - updateIssue", 9);
                    resolve(result);
                }
            })
        })
    }

    findIssue()
        .then(updatePreviousUser)
        .then(updateNewUser)
        .then(updateIssue)
        .then((result) => {
            let apiResponse = response.generate(false, "issue successfully assigned to user", 200, result);
            res.send(apiResponse);
        })
        .catch((error) => {
            res.send(error);
        })
}

//add issue to current user's watch list
let watchIssue = (req, res) => {

    //add to user's watch list
    let addToWatchList = () => {
        return new Promise((resolve, reject) => {
            let updateObj = {
                $push: { watchingIssues: req.body.issueId }
            }
            userModel.updateOne({ userId: req.user.userId }, updateObj, (err, result) => {
                if (err) {
                    logger.error("error while updating users watchlist", "issueController : watchIssue - addToWatchList", 9);
                    let apiResponse = response.generate(true, "error while updating users watchlist", 500, err);
                    reject(apiResponse);
                } else if (result.n == 0) {
                    logger.error("user details not found", "issueController : watchIssue - addToWatchList", 9);
                    let apiResponse = response.generate(true, "user details not found", 404, null);
                    reject(apiResponse);
                } else {
                    logger.info("updated user's watchlist", "issueController : watchIssue - addToWatchList", 9);
                    resolve();
                }
            })
        })
    }

    //add user details to issue's watcher list
    let addUserToIssue = () => {
        return new Promise((resolve, reject) => {
            let updateObj = {
                $push: { watchersId: req.user.userId }
            }
            issueModel.updateOne({ issueId: req.body.issueId }, updateObj, (err, result) => {
                if (err) {
                    logger.error("error while adding the user to the watcher list of the issue", "issueController : watchIssue - addUserToIssue", 9);
                    let apiResponse = response.generate(true, "error while adding the user to the watcher list of the issue", 500, err);
                    reject(apiResponse);
                } else if (result.n == 0) {
                    logger.error("issue details not found", "issueController : watchIssue - addUserToIssue", 9);
                    let apiResponse = response.generate(true, "issue details not found", 404, null);
                    reject(apiResponse);
                } else {
                    logger.info("updated watchers list of the issue", "issueController : watchIssue - addUserToIssue", 9);
                    resolve(result);
                }
            })
        })
    }

    addToWatchList()
        .then(addUserToIssue)
        .then((result) => {
            let apiResponse = response.generate(false, "issue added to watch list successfully", 200, result);
            res.send(apiResponse);
        })
        .catch((error) => {
            res.send(error);
        })
}

//change issue status
let changeIssueStatus = (req, res) => {
    issueModel.updateOne({ issueId: req.body.issueId }, { status: req.body.newStatus }, (err, result) => {
        if (err) {
            logger.error("error while updating the status of issue", "issueController : changeIssueStatus", 9);
            let apiResponse = response.generate(true, "error while updating the status", 500, err);
            res.send(apiResponse);
        } else if (result.n == 0) {
            logger.error("issue details not found to update status", "issueController : changeIssueStatus", 9);
            let apiResponse = response.generate(true, "issue details not found to update", 404, null);
            res.send(apiResponse);
        } else {
            logger.info("issue status updated successfully", "issueController: changeIssueStatus", 9);
            let apiResponse = response.generate(false, "issue status updated successfully", 200, result);
            res.send(apiResponse);
        }
    })
}

//search for issue title
let searchIssueTitle = (req, res) => {
    let searchQuery = `"\"${req.body.searchString}\""`
    let queryObj = {
        $text: { $search: searchQuery }
    }
    issueModel.find(queryObj)
        .select('-__v -_id')
        .sort('-createdOn')
        .lean()
        .exec((err, result) => {
            if (err) {
                logger.error("error while searching for given input", "issueController : searchIssueTitle", 9);
                let apiResponse = response.generate(true, "error while searching for given input", 500, err);
                res.send(apiResponse);
            } else if (check.isEmpty(result)) {
                logger.error("no such issues found", "issueController : searchIssueTitle", 9);
                let apiResponse = response.generate(true, "no such issues found", 404, null);
                res.send(apiResponse);
            } else {
                logger.info("issues retreived", "issueController : searchIssueTitle", 9);
                let apiResponse = response.generate(false, "issue title found", 200, result);
                res.send(apiResponse);
            }
        })

}




//create a new comment on an issue
let createNewComment = (req, res) => {

    //create comment
    let createComment = () => {
        return new Promise((resolve, reject) => {
            let newComment = new commentModel({
                commentId: shortId.generate(),
                commenterId: req.user.userId,
                createdOn: time.localTimeNow(),
                comment: req.body.comment,
                issueId: req.body.issueId
            })
            newComment.save((err, result) => {
                if (err) {
                    logger.error("error while saving new comment", "issueController : createNewComment - createComment", 9);
                    let apiResponse = response.generate(true, "error while saving new comment", 500, err);
                    reject(apiResponse);
                } else {
                    let commentDetails = result.toObject();
                    delete commentDetails.__v;
                    delete commentDetails._id;
                    resolve(commentDetails);
                }
            })
        })
    }

    //add comment details to issue
    let addCommentToIssue = (commentDetails) => {
        return new Promise((resolve, reject) => {
            issueModel.update({ issueId: req.body.issueId }, { $push: { commentsId: commentDetails.commentId } }, (err, result) => {
                if (err) {
                    logger.error("error while adding comment to the issue", "issueController : createNewComment - addCommentToIssue", 9);
                    let apiResponse = response.generate(true, "error while adding comment to the issue", 500, err);
                    reject(apiResponse);
                } else if (result.n == 0) {
                    logger.error("issue details not found to add comment", "issueController : createNewComment - addCommentToIssue", 9);
                    let apiResponse = response.generate(true, "issue details not found to add comment", 404, null);
                    reject(apiResponse);
                } else {
                    logger.info("comment added to the issue", "issueController : createNewComment - addCommentToIssue", 9);
                    resolve(commentDetails);
                }
            })
        })
    }

    createComment()
        .then(addCommentToIssue)
        .then((commentDetails) => {
            let apiResponse = response.generate(false, "comment created successfully", 200, commentDetails);
            res.send(apiResponse);
        })
        .catch((error) => {
            res.send(error);
        })
}

// get all the comments of the issue
let getIssueComments = (req, res) => {
    commentModel.find({ issueId: req.body.issueId })
        .select('-__v -_id')
        .sort('-createdOn')
        .skip(parseInt(req.body.skip) || 0)
        .lean()
        .limit(10)
        .exec((err, result) => {
            if (err) {
                logger.error("error while retreiving comments", "issueController : getIssueComments", 9);
                let apiResponse = response.generate(true, "error while retreiving comments", 500, err);
                res.send(apiResponse);
            } else if (check.isEmpty(result)) {
                logger.error("no comments found on issue", "issueController : getIssueComments", 9);
                let apiResponse = response.generate(true, "no comments found on issue", 404, null);
                res.send(apiResponse);
            } else {
                console.log(result);
                logger.info("comments retreived successfully", "issueController : getIssueCommens", 9);
                let apiResponse = response.generate(false, "comments retreived successfully", 200, result);
                res.send(apiResponse);
            }
        })
}

//delete comment made by user logged in
let deleteComment = (req, res)=>{
    
    //delete comment
    let deletingComment = ()=>{
        return new Promise((resolve, reject)=>{
            let queryObj = {                
                commentId : req.body.commentId                
            }
            commentModel.findOneAndDelete(queryObj, (err, result)=>{
                if(err){
                    logger.error("error while deleting comment", "issueController : deleteComment - deletingcomment", 9);
                    let apiResponse = response.generate(true, "error while deleting comment", 500, err);
                    reject(apiResponse);
                }else if(check.isEmpty(result)){
                    logger.error("comment not found", "issueController : deleteComment - deletingcomment", 9);
                    let apiResponse = response.generate(true, "comment not found", 404, null);
                    reject(apiResponse);
                }else if(result.commenterId !== req.user.userId){
                    logger.error("cannot delete others comments", "issueController : deleteComment - deletingComment", 9);
                    let apiResponse = response.generate(true, "cannot delete others comments", 400, null);
                    reject(apiResponse)
                }else{                    
                    let commentDetails = result.toObject();
                    delete commentDetails.__v;
                    delete commentDetails._id;
                    resolve(commentDetails);
                }
            })
        })
    }

    //deleting comment details from issue
    let deleteCommentDetails = (commentDetails)=>{
        return new Promise((resolve, reject)=>{
            let queryObj = {
                issueId : commentDetails.issueId
            }
            let updateObj = {
                $pull : {commentsId : commentDetails.commentId}
            }
            issueModel.updateOne(queryObj, updateObj, (err, result)=>{
                if(err){
                    logger.error("error removing comment details from issue", "issueController : deleteComment - deleteCommentDetails", 9);
                    let apiResponse = response.generate(true, "error while removing comment details from issue", 500, err);
                    reject(apiResponse);
                }else if(result.n == 0){
                    logger.error("issue not found to remove comment", "issueController : deleteComment - deleteCommentDetails", 9);
                    let apiResponse = response.generate(true, "issue not found to remove comment", 404, null);
                    reject(apiResponse);
                }else {
                    resolve(commentDetails);
                }
            })
        })
    }

    deletingComment()
    .then(deleteCommentDetails)
    .then((commentDetails)=>{
        let apiResponse = response.generate(false, "comment deleted successfully", 200, commentDetails);
        res.send(apiResponse);
    })
    .catch((error)=>{
        res.send(error);
    })
}

//save file info
let saveFileInfo = (req, res)=>{

    //saving file info
    let savingFileInfo = ()=>{
        return new Promise((resolve, reject)=>{
            if(!req.files || Object.keys(req.files).length === 0){
                logger.error("no files were uploaded", "issueController : saveFileInfo - savingFileInfo", 9);
                let apiResponse = response.generate(true, "no files were uploaded", 400, null);
                reject(apiResponse);
            }else{
                let currentFile = req.files.uploadedFile;
                let newFile = new fileModel({
                    fileId : shortId.generate(),
                    fileFor : req.query.fileFor,
                    fileForId : req.query.fileForId,
                    fileName : currentFile.name                    
                })
                newFile.save((err,result)=>{
                    if(err){
                        logger.error("error while saving new file information", "issueContoller : saveFileInfo-savingFileInfo", 9);
                        let apiResponse = response.generate(true, "error while saving new file info", 500, err);
                        reject(apiResponse);
                    }else{
                        let fileInfo = result.toObject();
                        delete fileInfo.__v;
                        delete fileInfo._id;
                        resolve(fileInfo);
                    }
                })
            }
        })
    }

    //save file info on issue or comment based on input
    let saveFileInfoOnFileFor = (fileInfo)=>{
        return new Promise((resolve, reject)=>{
            if(fileInfo.fileFor == "comment"){
                commentModel.findOneAndUpdate({commentId : fileInfo.fileForId}, {$push : {filesId : fileInfo.fileId}}, (err,result)=>{
                    if(err){
                        logger.error("error while saving file info to comment", "issueController : saveFileInfo - saveFileInfoOnFileFor(comment)", 9);
                        let apiResponse = response.generate(true, "error while saving file infor to comment", 500, err);
                        reject(apiResponse);
                    }else if(check.isEmpty(result)){
                        logger.error("comment details not found", "issueController : saveFileInfo - saveFileInfoOnFileFor(comment)", 9);
                        let apiResponse = response.generate(true, "comment details not found to save file", 404, null);
                        reject(apiResponse);
                    }else{
                        resolve(fileInfo);
                    }
                })
            }else if(fileInfo.fileFor == "issue"){
                issueModel.findOneAndUpdate({issueId : fileInfo.fileForId}, {$push : {filesId : fileInfo.fileId}}, (err,result)=>{
                    if(err){
                        logger.error("error while saving file info to issue", "issueController : saveFileInfo - saveFileInfoOnFileFor(issue)", 9);
                        let apiResponse = response.generate(true, "error while saving file infor to issue", 500, err);
                        reject(apiResponse);
                    }else if(check.isEmpty(result)){
                        logger.error("issue details not found", "issueController : saveFileInfo - saveFileInfoOnFileFor(issue)", 9);
                        let apiResponse = response.generate(true, "issue details not found to save file", 404, null);
                        reject(apiResponse);
                    }else{
                        resolve(fileInfo);
                    }
                })
            }
        })
    }

    //save file on server
    let saveFileOnServer = (fileInfo)=>{
        return new Promise((resolve, reject)=>{
            let currentFile = req.files.uploadedFile;
            currentFile.mv(`./app/files/${fileInfo.fileId}${fileInfo.fileName}`,(err)=>{
                if(err){
                    logger.error("error while saving the file on server", "issueController : saveFileInfo - saveFileOnServer", 9);
                    let apiResponse = response.generate(true, "error while saving the file on server", 500, err);
                    reject(apiResponse);
                }else{
                    resolve(fileInfo);
                }
            })
        })
    }



    savingFileInfo()
    .then(saveFileInfoOnFileFor)
    .then(saveFileOnServer)
    .then((fileData)=>{
        let apiResponse = response.generate(false, "file saved successfully", 200, fileData);
        res.send(apiResponse);
    })
    .catch((error)=>{
        res.send(error);
    })

}

//get all files details 
let getAllFiles = (req, res)=>{
    fileModel.find()
    .lean()
    .exec((err, result)=>{
        if(err){
            logger.error("error finding files", "issueController : getAllFiles", 9);
            let apiResponse = response.generate(true, "error finding files", 500, err);
            res.send(apiResponse);
        }else if(check.isEmpty(result)){
            logger.error("no files found", "issueController : getAllFiles", 9);
            let apiResponse = response.generate(true, "no issues found", 404, null);
            res.send(apiResponse);
        }else {
            logger.info("files info retreived successfully", "issueController : getAllFiles", 9);
            let apiResponse = response.generate(false, "files info retreived successfully", 200, result);
            res.send(apiResponse);
        }
    })
}

//downloading file
// let downloadFile = (req, res)=>{
//     let fileName = `${req.query.fileId}${req.query.fileName}`
//     let file = `./app/files/${fileName}`;
//     let name = path.basename(file);
//     let mimetype = mime.getType(file);
//     res.setHeader('Content-disposition', 'attachment; filename='+name);
//     res.setHeader('Content-type', mimetype);
//     let filestream = fs.createReadStream(file);
//     console.log(filestream);
//     filestream.pipe(res);
//     // let fileName = `${req.query.fileId}${req.query.fileName}`
//     // const file = `./app/files/${fileName}`;
//     // res.sendFile(file);
// }

//testing delete issue
let testDeleteIssue = (req, res) => {
    issueModel.findOneAndDelete({ issueId: req.body.issueId }, (err, result) => {
        if (err) {
            res.send(err)
        } else {
            res.send(result);
        }
    })
}


module.exports = {
    createIssue: createNewIssue,
    deleteIssue: deleteIssue,
    editIssue: editIssue,
    getAllIssues: getAllIssues,
    getAssignedIssues : getAssignedIssues,
    getWatchingIssues : getWatchingIssues,
    getReportedIssues : getReportedIssues,
    testDeleteIssue: testDeleteIssue,
    assignIssue: assignIssue,
    watchIssue: watchIssue,
    changeIssueStatus: changeIssueStatus,
    createNewComment: createNewComment,
    getIssueComments: getIssueComments,
    searchIssueTitle: searchIssueTitle,
    deleteComment : deleteComment,
    getSingleIssue : getSingleIssue,
    saveFileInfo : saveFileInfo,
    getAllFiles : getAllFiles
    
}