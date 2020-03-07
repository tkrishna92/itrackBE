//external modules
const mongoose = require('mongoose');
const shortId = require('shortid');

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

// create a new issue
let createNewIssue = (req, res)=>{

    //checking required input parameters
    let validateInput = ()=>{
        return new Promise((resolve, reject)=>{
            if(check.isEmpty(req.body.issueTitle) || check.isEmpty(req.body.issueDescription) || check.isEmpty(req.body.assignedToId)){
                logger.error("required input not valid", "issueController : createNewIssue - validateInput", 9);
                let apiResponse = response.generate(true, "required input not valid", 500, null);
                reject(apiResponse);
            }else{
                resolve();
            }
        })
    }

    //creating a new issue
    let creatingIssue = ()=>{
        return new Promise((resolve, reject)=>{
            let newIssue = new issueModel({
                issueId : shortId.generate(),
                reporterId : req.user.userId,
                assignedToId : req.body.assignedToId,
                title : req.body.issueTitle,
                description : req.body.issueDescription,
                watchersId : [req.user.userId, req.body.assignedToId],
                createdOn : time.localTimeNow()
            })
            newIssue.save((err, result)=>{
                if(err){
                    logger.error("error saving new issue", "issueController : createNewIssue - creatingIssue", 9);
                    let apiResponse = response.generate(true, "error while saving new issue", 500, err);
                    reject(apiResponse);
                }else {
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
    let addIssueToWatchList = (newIssueDetails)=>{
        return new Promise((resolve, reject)=>{
            userModel.findOneAndUpdate({userId : req.user.userId}, {$push : {watchingIssues : newIssueDetails.issueId}}, (err, result)=>{
                if(err){
                    logger.error("error updating new issue to reporter issue watchlist", "issueController : createNewIssue - addIssueToWatchList(reporter)", 9);
                    let apiResponse = response.generate(true, "error while updating new issue to reporter issue watchlist", 500, err);
                    reject(apiResponse);
                }else if(check.isEmpty(result)){
                    logger.error("reporter detial not found to update the watchlist", "issueController : createNewIssue - addIssueToWatchList(reporter)", 9);
                    let apiResponse = response.generate(true, "reporter details not found to update the issue", 404, null);
                    reject(apiResponse);
                }else{
                    let updateObj = {
                        $push : {watchingIssues : newIssueDetails.issueId, assignedIssues : newIssueDetails.issueId}                            
                    }
                    userModel.findOneAndUpdate({userId : req.body.assignedToId}, updateObj, (err, assignResult)=>{
                        if(err){
                            logger.error("error while adding the new issue to the assigned user", "issueController : createNewIssue - addIssueToWatchList(assignedTo)", 9);
                            let apiResponse = response.generate(true, "error while adding the new issue to assigned user", 500, err);
                            reject(apiResponse);
                        }else if(check.isEmpty(assignResult)){
                            logger.error("user detail to assign the issue not found", "issueController : createNewIssue - addIssueToWatchList(assignedTo)", 9);
                            let apiResponse = response.generate(true, "user details to assign the issue not found", 404, null);
                            reject(apiResponse);
                        }else{
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
    .then((newIssueDetails)=>{
        let apiResponse = response.generate(false, "issue created successfully", 200, newIssueDetails);
        res.send(apiResponse);
    })
    .catch((error)=>{
        res.send(error);
    })
}


//delete issue
let deleteIssue = (req, res)=>{

    //find the issue details
    let findIssue = ()=>{
        return new Promise((resolve, reject)=>{
            queryObj = {
                $and: [
                    {issueId : req.body.issueId},
                    {
                        $or: [
                            {reporterId : req.user.userId},
                            {assignedId : req.user.userId}
                        ]
                    }
                ]
            }
            issueModel.findOne(queryObj, (err, result)=>{
                if(err){
                    logger.error("error finding the issue details", "issueController : deleteIssue - findIssue", 9);
                    let apiResponse = response.generate(true, "error while finding the issue details to delete", 500, err);
                    reject(apiResponse);
                }else if(check.isEmpty(result)){
                    logger.error("issue details not found", "issueController : deleteIssue - findIssue", 9);
                    let apiResponse = response.generate(true, "issue details not found", 404, null);
                    reject(apiResponse);
                }else{
                    let issueDetails = result.toObject();
                    resolve(issueDetails);
                }
            })
        })
    }

    //removing the issue from assigned user's assignments
    let deleteFromAssignedUser = (issueDetails)=>{
        return new Promise((resolve, reject)=>{
            updateObj = {
                $pull: {assignedIssues: issueDetails.issueId}                
            }
            userModel.findOneAndUpdate({userId : issueDetails.assignedToId}, updateObj, (err, result)=>{
                if(err){
                    logger.error("error while unassigning the issue", "issueController : deleteIssue - deleteFromAssignedUser", 9);
                    let apiResponse = response.generate(true, "error while unassigning the issue", 500, err);
                    reject(apiResponse);
                }else{
                    resolve(issueDetails);
                }
            })
        })
    }

    //deleting the issue from all the watchers watching list
    let deleteFromWatcherList = (issueDetails)=>{
        console.log("deleting from watchers list")
        return new Promise((resolve, reject)=>{
            updateObj = {
                $pull: {watchingIssues: issueDetails.issueId}                
            }
            for(let user of issueDetails.watchersId){
                userModel.findOneAndUpdate({userId : user}, updateObj, (err, result)=>{
                    if(err){
                        logger.error("error while removing the issue from a user's watch list", "issueController : deleteIssue - deleteFromWatcherList", 9);
                        let apiResponse = response.generate(true, "error while removing the issue from a user's watch list", 500, err);
                        reject(apiResponse);
                    }else{
                        
                    }
                })
            }
            resolve(issueDetails);
        })
    }

    //deleting the issue details
    let deletingIssue = (issueDetails)=>{
        return new Promise((resolve, reject)=>{
            issueModel.findOneAndDelete({issueId : issueDetails.issueId}, (err, result)=>{
                if(err){
                    logger.error("error while deleting the issue", "issueController : deleteIssue - deletingISsue", 9);
                    let apiResponse = response.generate(true, "error while deleting the issue", 500, err);
                    reject(apiResponse);                    
                }else{
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
    .then((deletedIssue)=>{
        let apiResponse = response.generate(false, "issue deleted successfully", 200, deletedIssue);
        res.send(apiResponse);
    })
    .catch((error)=>{
        res.send(error);
    })

}

//edit issue
let editIssue = (req, res)=>{

    //validating input 
    let validatingInput = ()=>{
        return new Promise((resolve, reject)=>{
            if(check.isEmpty(req.body.issueId)){
                logger.error("issue information not provided", "issueController : editIssue - validatingInput", 9);
                let apiResponse = response.generate(true, "details of the issue to edit not valid", 400, null);
                reject(apiResponse);
            }
            else{
                resolve();
            }
        })
    }

    //edit title or description of the issue
    let editTitleOrDescription = ()=>{
        return new Promise((resolve, reject)=>{
            let updateObj = {
                title : req.body.title,
                description: req.body.description
            }
            issueModel.update({issueId : req.body.issueId}, updateObj, (err, result)=>{
                if(err){
                    logger.error("error editing issue details", "issueController : editIssue - editTitleOrDescription", 9);
                    let apiResponse = response.generate(true, "error editing issue details", 500, err);
                    reject(apiResponse);
                }else if(check.isEmpty(result)){
                    logger.error("could not find issue to update", "issueController : editIssue - editTitleOrDescription", 9);
                    let apiResponse = response.generate(true, "issue details not found", 404, null);
                    reject(apiResponse);
                }else{
                    let updatedIssue = result;
                    resolve(updatedIssue);
                }
            })
        })
    }

    validatingInput()
    .then(editTitleOrDescription)
    .then((updatedIssue)=>{
        let apiResponse = response.generate(false, "issue details editted successfully", 200, updatedIssue);
        res.send(apiResponse);
    })
    .catch((error)=>{
        res.send(error);
    })
}

//get all issues
let getAllIssues = (req, res)=>{
    issueModel.find()
    .select('-_id -__v')
    .sort('-createdOn')
    .skip(parseInt(req.body.skip) || 0)
    .lean()
    .limit(10)
    .exec((err, result)=>{
        if(err){
            logger.error("error while retreiving issues", "issueController : getAllIssues", 9);
            let apiResponse = response.generate(true, "error while retreiving issues", 500, err);
            res.send(apiResponse);
        }else if(check.isEmpty(result)){
            logger.error("no issues found", "issueController : getAllIssues", 9);
            let apiResponse = response.generate(true, "issues not found", 404, null);
            res.send(apiResponse);
        }else{
            logger.info("issues retreived successfully", "issueController : getAllIssues", 9);
            let apiResponse = response.generate(false, "issues retreived successfully", 200, result);
            res.send(apiResponse);
        }
    })
}

//assign issue to user
let assignIssue = (req, res)=>{
    
    //finding issue details
    let findIssue = ()=>{
        return new Promise((resolve, reject)=>{
            issueModel.findOne({issueId : req.body.issueId}, (err, result)=>{
                if(err){
                    logger.error("error retrieving issue details", "issueController : assignIssue - findIssue", 9);
                    let apiResponse = response.generate(true, "error while retrieving issue details", 500, err);
                    reject(apiResponse);
                }else if(check.isEmpty(result)){
                    logger.error("issue details not found", "issueController : assignIssue - findIssue", 9);
                    let apiResponse = response.generate(true, "issue details not found", 404, null);
                    reject(apiResponse);
                }else {
                    let issueDetails = result.toObject();
                    resolve(issueDetails);
                }
            })
        })
    }
    

    //updating the previous assigned user
    let updatePreviousUser = (issueDetails)=>{
        return new Promise((resolve, reject)=>{
            let updateObj = {
                $pull : {assignedIssues : issueDetails.issueId}
            }
            userModel.update({userId : issueDetails.assignedToId}, updateObj, (err, result)=>{
                if(err){
                    logger.error("error while updating the current user assigned with the issue", "issueController : assignIssue - updatePreviousUser", 9);
                    let apiResponse = response.generate(true, "error while updating the current user assigned with the issue", 500, err);
                    reject(apiResponse);
                }else if(result.n == 0){
                    logger.error("current assigned user not found", "issueController : assignIssue - updatePreviousUser", 9);
                    let apiResponse = response.generate(true, "current assigned user details not found", 404, null);
                    reject(apiResponse);
                }else{
                    logger.info("current user un-assigned of the issue", "issueController : assignIssue - updatePreviousUser", 9);
                    resolve(issueDetails);
                }
            })
        })
    }

    //assigning new user with the issue
    let updateNewUser = (issueDetails)=>{
        return new Promise((resolve, reject)=>{
            let updateObj = {
                $push : {assignedIssues : issueDetails.issueId}
            }
            userModel.update({userId : req.body.assignToId}, updateObj, (err, result)=>{
                if(err){
                    logger.error("error while assigning the issue to user", "issueController : assignIssue - updateNewUser", 9);
                    let apiResponse = response.generate(true, "error while assigning the issue to user", 500, err);
                    reject(apiResponse);
                }else if(result.n == 0){
                    logger.error("user details not found to assing the issue", "issueController : assignIssue - updateNewUser", 9);
                    let apiResponse = response.generate(true, "user details not found", 404, null);
                    reject(apiResponse);
                }else{
                    logger.info("new user assigned with the issue", "issueController : assignIssue - updateNewUser", 9);
                    resolve(issueDetails);
                }
            })
        })
    }

    //update issue
    let updateIssue = (issueDetails)=>{
        return new Promise((resolve, reject)=>{
            let updateObj = {
                assignedToId : req.body.assignToId
            }
            issueModel.update({issueId : req.body.issueId}, updateObj, (err, result)=>{
                if(err){
                    logger.error("error assigning the issue to another user", "issueController : assignIssue", 9);
                    let apiResponse = response.generate(true, "error while assigning the issue to another user", 500, err);
                    reject(apiResponse);
                }else if(result.n == 0){
                    logger.error("issue details not found", "issueController : assigningIssue", 9);
                    let apiResponse = response.generate(true, "issue details not found", 404, null);
                    reject(apiResponse);
                }else {
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
    .then((result)=>{
        let apiResponse = response.generate(false, "issue successfully assigned to user", 200, result);
        res.send(apiResponse);
    })
    .catch((error)=>{
        res.send(error);
    })
}

//add issue to current user's watch list
let watchIssue = (req, res)=>{

    //add to user's watch list
    let addToWatchList = ()=>{
        return new Promise((resolve, reject)=>{
            let updateObj = {
                $push : {watchingIssues : req.body.issueId}
            }
            userModel.updateOne({userId : req.user.userId}, updateObj, (err, result)=>{
                if(err){
                    logger.error("error while updating users watchlist", "issueController : watchIssue - addToWatchList", 9);
                    let apiResponse = response.generate(true, "error while updating users watchlist", 500, err);
                    reject(apiResponse);
                }else if(result.n == 0){
                    logger.error("user details not found", "issueController : watchIssue - addToWatchList", 9);
                    let apiResponse = response.generate(true, "user details not found", 404, null);
                    reject(apiResponse);
                }else{
                    logger.info("updated user's watchlist", "issueController : watchIssue - addToWatchList", 9);
                    resolve();
                }
            })
        })
    }

    //add user details to issue's watcher list
    let addUserToIssue = ()=>{
        return new Promise((resolve, reject)=>{
            let updateObj = {
                $push : {watchersId : req.user.userId}
            }
            issueModel.updateOne({issueId : req.body.issueId}, updateObj, (err, result)=>{
                if(err){
                    logger.error("error while adding the user to the watcher list of the issue", "issueController : watchIssue - addUserToIssue", 9);
                    let apiResponse = response.generate(true, "error while adding the user to the watcher list of the issue", 500, err);
                    reject(apiResponse);
                }else if(result.n == 0){
                    logger.error("issue details not found", "issueController : watchIssue - addUserToIssue", 9);
                    let apiResponse = response.generate(true, "issue details not found", 404, null);
                    reject(apiResponse);
                }else{
                    logger.info("updated watchers list of the issue", "issueController : watchIssue - addUserToIssue", 9);
                    resolve(result);
                }
            })
        })
    }

    addToWatchList()
    .then(addUserToIssue)
    .then((result)=>{
        let apiResponse = response.generate(false, "issue added to watch list successfully", 200, result);
        res.send(apiResponse);
    })
    .catch((error)=>{
        res.send(error);
    })
}

//change issue status
let changeIssueStatus = (req, res)=>{
    issueModel.updateOne({issueId: req.body.issueId},{status : req.body.newStatus}, (err,result)=>{
        if(err){
            logger.error("error while updating the status of issue", "issueController : changeIssueStatus", 9);
            let apiResponse = response.generate(true, "error while updating the status", 500, err);
            res.send(apiResponse);
        }else if(result.n == 0){
            logger.error("issue details not found to update status", "issueController : changeIssueStatus", 9);
            let apiResponse = response.generate(true, "issue details not found to update", 404, null);
            res.send(apiResponse);
        }else{
            logger.info("issue status updated successfully", "issueController: changeIssueStatus", 9);
            let apiResponse = response.generate(false, "issue status updated successfully", 200, result);
            res.send(apiResponse);
        }
    })
}


//testing delete issue
let testDeleteIssue = (req, res)=>{
    issueModel.findOneAndDelete({issueId : req.body.issueId}, (err, result)=>{
        if(err){
            res.send(err)
        }else{
            res.send(result);
        }
    })
}


module.exports = {
    createIssue : createNewIssue,
    deleteIssue : deleteIssue,
    editIssue : editIssue,
    getAllIssues : getAllIssues,
    testDeleteIssue : testDeleteIssue,
    assignIssue : assignIssue,
    watchIssue : watchIssue,
    changeIssueStatus : changeIssueStatus
}