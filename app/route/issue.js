const controller = require('./../controller/issueController');
const appConfig = require('./../../config/appConfig');
const auth = require('./../middleware/auth');

let setRouter = (app) =>{
    let baseUrl = `${appConfig.apiVersion}/issues`

    //create issue
    //params : issueTitle, issueDescription, assignedToId to be passed as body parameter
    //queryParams : authToken to be passed as body, query or header parameter
    app.post(`${baseUrl}/createIssue`, auth.isAuthenticated, controller.createIssue);

    /**
     * @api {post} /issues/createIssue createIssue
     * @apiVersion 1.0.0
     * @apiGroup issues
     * 
     * @apiParam {String} authToken authToken to be passed as body, query or header parameter
     * @apiParam {String} issueTitle title of the new issue to be passed as body parameter
     * @apiParam {String} issueDescription description of the issue to be passed as body parameter
     * @apiParam {String} assignedToId id of the user to whom the issue is being assigned to be passed as body parameter
     * 
     * @apiSuccessExample {json} Success-Response:
     * {
            "errorOccurred": false,
            "message": "issue created successfully",
            "status": 200,
            "data": {
                "status": "new",
                "createdOn": "2020-03-06T13:10:40.000Z",
                "watchersId": [
                    "pH4WJZvj",
                    "TuWUOF5B"
                ],
                "commentsId": [],
                "issueId": "Vu7dlg-2",
                "reporterId": "pH4WJZvj",
                "assignedToId": "TuWUOF5B",
                "title": "first",
                "description": "description"
            }
     * }
     *
     * @apiErrorExample {json} Error-Response:
     * {
            "errorOccurred": true,
            "message": "required input not valid",
            "status": 500,
            "data": null
        }
     */


    //getSingleIssue
    //queryParams : authToken to be passed as body, query or header parameter
    //params : issueId : issue id of the issue for which the details are being requested for to be passed as a body parameter
    app.put(`${baseUrl}/getSingleIssue`, auth.isAuthenticated, controller.getSingleIssue);

    /**
     * @api {post} /issues/getSingleIssue get single issue
     * @apiVersion 1.0.0
     * @apiGroup issues
     * 
     * @apiParam {String} authToken authToken to be passed as body, query or header parameter
     * @apiParam {String} issueId id of the issue being queried to be passed as a body parameter
     * 
     * @apiSuccessExample {json} Success-Response:
     * {
                    errorOccurred: false
                    message: "showing selected issue"
                    status: 200
                    data:
                    status: "new"
                    createdOn: "2020-03-12T17:47:49.000Z"
                    watchersId: (4) ["pH4WJZvj", "DrGeEuAI", "TuWUOF5B", "QafCGGqX"]
                    commentsId: ["cElLlwss"]
                    issueId: "kCmDioqD"
                    reporterId: "pH4WJZvj"
                    assignedToId: "DrGeEuAI"
                    title: "new issue 2 edit"
                    description: "description of new
                }
            ],
            "count": 4
        }
     *
     * @apiErrorExample {json} Error-Response:
     * {
            "errorOccurred": true,
            "message": "issues not found",
            "status": 404,
            "data": null
        }
     */



    //getAllIssues
    //queryParams : authToken to be passed as body, query or header parameter
    app.put(`${baseUrl}/getAllIssues`, auth.isAuthenticated, controller.getAllIssues);

    /**
     * @api {post} /issues/getAllIssues get all issues
     * @apiVersion 1.0.0
     * @apiGroup issues
     * 
     * @apiParam {String} authToken authToken to be passed as body, query or header parameter
     * @apiParam {String} skip integer value of number of issues to be displayed to be passed as a body parameter
     * @apiParam {String} statusFilter status filter to apply for getting issues to be passed as a body parameter
     * 
     * @apiSuccessExample {json} Success-Response:
     * {
            "errorOccurred": false,
            "message": "issues retreived successfully",
            "status": 200,
            "data": [
                {
                    "status": "new",
                    "createdOn": "2020-03-08T11:09:28.000Z",
                    "watchersId": [
                        "Kzq61Q8u",
                        "TuWUOF5B"
                    ],
                    "commentsId": [],
                    "issueId": "PhDPgHgv",
                    "reporterId": "Kzq61Q8u",
                    "assignedToId": "TuWUOF5B",
                    "title": "first search 2",
                    "description": "description"
                },
                ..
                ..
                {
                    "status": "new",
                    "createdOn": "2020-03-07T12:33:11.000Z",
                    "watchersId": [
                        "pH4WJZvj",
                        "TuWUOF5B"
                    ],
                    "commentsId": [],
                    "issueId": "mYhmiJnj",
                    "reporterId": "pH4WJZvj",
                    "assignedToId": "TuWUOF5B",
                    "title": "first edit",
                    "description": "description edit"
                }
            ],
            "count": 4
        }
     *
     * @apiErrorExample {json} Error-Response:
     * {
            "errorOccurred": true,
            "message": "issues not found",
            "status": 404,
            "data": null
        }
     */

    //getAssignedIssues - gets all the assigned issues of the logged in user
    //queryParams : authToken to be passed as body, query or header parameter
    app.put(`${baseUrl}/getAssignedIssues`, auth.isAuthenticated, controller.getAssignedIssues);

    /**
     * @api {post} /issues/getAssignedIssues get assigned issues
     * @apiVersion 1.0.0
     * @apiGroup issues
     * 
     * @apiParam {String} authToken authToken to be passed as body, query or header parameter
     * @apiParam {String} skip integer value of number of issues to be displayed to be passed as a body parameter
     * @apiParam {String} statusFilter status filter to apply for getting issues to be passed as a body parameter
     * 
     * @apiSuccessExample {json} Success-Response:
     * {
            "errorOccurred": true,
            "message": "issues found",
            "status": 200,
            "data": [
                {
                    "status": "new",
                    "createdOn": "2020-03-08T11:09:24.000Z",
                    "watchersId": [
                        "Kzq61Q8u",
                        "TuWUOF5B"
                    ],
                    "commentsId": [],
                    "issueId": "krW_aT6d",
                    "reporterId": "Kzq61Q8u",
                    "assignedToId": "TuWUOF5B",
                    "title": "first search 1",
                    "description": "description"
                },
                {
                    "status": "new",
                    "createdOn": "2020-03-08T11:09:19.000Z",
                    "watchersId": [
                        "Kzq61Q8u",
                        "TuWUOF5B"
                    ],
                    "commentsId": [],
                    "issueId": "aKy6qo0p",
                    "reporterId": "Kzq61Q8u",
                    "assignedToId": "TuWUOF5B",
                    "title": "first search",
                    "description": "description"
                }
            ],
            "count": 2
        }
     *
     * @apiErrorExample {json} Error-Response:
     * {
            "errorOccurred": true,
            "message": "no assigned issues found",
            "status": 404,
            "data": null
        }
     */

    //getWatchingIssues - gets all the assigned issues of the logged in user
    //queryParams : authToken to be passed as body, query or header parameter
    app.put(`${baseUrl}/getWatchingIssues`, auth.isAuthenticated, controller.getWatchingIssues);

    /**
     * @api {post} /issues/getWatchingIssues get watching issues
     * @apiVersion 1.0.0
     * @apiGroup issues
     * 
     * @apiParam {String} authToken authToken to be passed as body, query or header parameter
     * @apiParam {String} skip integer value of number of issues to be displayed to be passed as a body parameter
     * @apiParam {String} statusFilter status filter to apply for getting issues to be passed as a body parameter
     * 
     * @apiSuccessExample {json} Success-Response:
     * {
            "errorOccurred": false,
            "message": "showing watching issues",
            "status": 200,
            "data": [
                {
                    "status": "in-progress",
                    "createdOn": "2020-03-08T11:09:28.000Z",
                    "watchersId": [
                        "Kzq61Q8u",
                        "TuWUOF5B"
                    ],
                    "commentsId": [],
                    "issueId": "PhDPgHgv",
                    "reporterId": "Kzq61Q8u",
                    "assignedToId": "TuWUOF5B",
                    "title": "first search 2",
                    "description": "description"
                },
                {
                    "status": "in-progress",
                    "createdOn": "2020-03-07T14:28:45.000Z",
                    "watchersId": [
                        "pH4WJZvj",
                        "TuWUOF5B",
                        "Kzq61Q8u"
                    ],
                    "commentsId": [
                        "rsCswDe5",
                        "w9K9ifyY",
                        "7DwqoazN"
                    ],
                    "issueId": "Zk6ln5Q5",
                    "reporterId": "pH4WJZvj",
                    "assignedToId": "pH4WJZvj",
                    "title": "first",
                    "description": "description"
                }
            ],
            "count": 2
        }
     *
     * @apiErrorExample {json} Error-Response:
     * {
            "errorOccurred": true,
            "message": "no watching issues found",
            "status": 404,
            "data": null
        }
     */


    //getReportedIssues - gets all the watched issues of the logged in user
    //queryParams : authToken to be passed as body, query or header parameter
    app.put(`${baseUrl}/getReportedIssues`, auth.isAuthenticated, controller.getReportedIssues);

    /**
     * @api {post} /issues/getReportedIssues get reported issues
     * @apiVersion 1.0.0
     * @apiGroup issues
     * 
     * @apiParam {String} authToken authToken to be passed as body, query or header parameter
     * @apiParam {String} skip integer value of number of issues to be displayed to be passed as a body parameter
     * @apiParam {String} statusFilter status filter to apply for getting issues to be passed as a body parameter
     * 
     * @apiSuccessExample {json} Success-Response:
     * {
            "errorOccurred": false,
            "message": "showing reported issues",
            "status": 200,
            "data": [
                {
                    "status": "new",
                    "createdOn": "2020-03-08T11:09:24.000Z",
                    "watchersId": [
                        "Kzq61Q8u",
                        "TuWUOF5B"
                    ],
                    "commentsId": [],
                    "issueId": "krW_aT6d",
                    "reporterId": "Kzq61Q8u",
                    "assignedToId": "TuWUOF5B",
                    "title": "first search 1",
                    "description": "description"
                },
                {
                    "status": "new",
                    "createdOn": "2020-03-08T11:09:19.000Z",
                    "watchersId": [
                        "Kzq61Q8u",
                        "TuWUOF5B"
                    ],
                    "commentsId": [
                        "ALjnTVhh",
                        "T878fwym",
                        "PiJW1pqK",
                        "o-5CNqIF",
                        "uqHZzvQP",
                        "HZjsa40B",
                        "__K2nvd4",
                        "YeRqTDKB",
                        "58-AqyB6",
                        "4sqF-oKn",
                        "zPn5cRtZ",
                        "FydeBzbn"
                    ],
                    "issueId": "aKy6qo0p",
                    "reporterId": "Kzq61Q8u",
                    "assignedToId": "TuWUOF5B",
                    "title": "first search",
                    "description": "description"
                }
            ],
            "count": 2
        }
     *
     * @apiErrorExample {json} Error-Response:
     * {
            "errorOccurred": true,
            "message": "no reported issues found",
            "status": 404,
            "data": null
        }
     */



    //delete issue
    //params : issueId to be passed as body parameter
    //queryParams : authToken to be passed as body, query or header parameter
    app.put(`${baseUrl}/deleteIssue`, auth.isAuthenticated, controller.deleteIssue);

    /**
     * @api {post} /issues/deleteIssue delete issue
     * @apiVersion 1.0.0
     * @apiGroup issues
     * 
     * @apiParam {String} authToken authToken to be passed as body, query or header parameter
     * @apiParam {String} issueId issue that is being deleted to be passed as body parameter
     * 
     * @apiSuccessExample {json} Success-Response:
     * {
            "errorOccurred": false,
            "message": "issue deleted successfully",
            "status": 200,
            "data": {
                "status": "new",
                "createdOn": "2020-03-07T11:17:21.000Z",
                "watchersId": [
                    "pH4WJZvj",
                    "TuWUOF5B"
                ],
                "commentsId": [],
                "_id": "5e6382c13609a455f834d968",
                "issueId": "J2MfimkL",
                "reporterId": "pH4WJZvj",
                "assignedToId": "TuWUOF5B",
                "title": "first",
                "description": "description"
            }
        }
     *
     * @apiErrorExample {json} Error-Response:
     * {
            "errorOccurred": true,
            "message": "issue details not found",
            "status": 404,
            "data": null
        }
     */

    //edit issue
    //params : issueId to be passed as body parameter
    //params : title edited title to be passed as body paramater
    //params : description edited description to be passed as body parameter
    //queryParams : authToken to be passed as body, query or header parameter
    app.post(`${baseUrl}/editIssue`, auth.isAuthenticated, controller.editIssue);

    /**
     * @api {post} /issues/editIssue edit issue
     * @apiVersion 1.0.0
     * @apiGroup issues
     * 
     * @apiParam {String} authToken authToken to be passed as body, query or header parameter
     * @apiParam {String} issueId issue that is being deleted to be passed as body parameter
     * @apiParam {String} title edited title of the issue to be passed as body parameter optional
     * @apiParam {String} description edited description of the issue to be passed as body parameter optional
     * 
     * @apiSuccessExample {json} Success-Response:
     * {
            "errorOccurred": false,
            "message": "issue details editted successfully",
            "status": 200,
            "data": {
                "n": 1,
                "nModified": 1,
                "ok": 1
            }
        }
     *
     * @apiErrorExample {json} Error-Response:
     * {
            "errorOccurred": true,
            "message": "issue details not found",
            "status": 404,
            "data": null
        }
     */

    //assign issue
    //params : issueId to be passed as body parameter
    //params : assignToId id of the user to whom the issue being assigned to be passed as a body parameter
    //queryParams : authToken to be passed as body, query or header parameter
    app.put(`${baseUrl}/assignIssue`, auth.isAuthenticated, controller.assignIssue);

    /**
     * @api {post} /issues/assignIssue assign issue
     * @apiVersion 1.0.0
     * @apiGroup issues
     * 
     * @apiParam {String} authToken authToken to be passed as body, query or header parameter
     * @apiParam {String} issueId issue that is being deleted to be passed as body parameter
     * @apiParam {String} assignToId id of the user to whom the issue is being assigned to can be passed as a body parameter
     * 
     * @apiSuccessExample {json} Success-Response:
     * {
            "errorOccurred": false,
            "message": "issue successfully assigned to user",
            "status": 200,
            "data": {
                "n": 1,
                "nModified": 1,
                "ok": 1
            }
        }
     *
     * @apiErrorExample {json} Error-Response:
     * {
            "errorOccurred": true,
            "message": "issue details not found",
            "status": 404,
            "data": null
        }
     */

    //watch issue
    //params : issueId of the issue user wants to watch to be passed as body parameter
    //queryParams : authToken to be passed as body, query or header parameter
    app.put(`${baseUrl}/watchIssue`, auth.isAuthenticated, controller.watchIssue);

    /**
     * @api {post} /issues/watchIssue watch issue
     * @apiVersion 1.0.0
     * @apiGroup issues
     * 
     * @apiParam {String} authToken authToken to be passed as body, query or header parameter
     * @apiParam {String} issueId issue id of the issue user wants to watch to be passed as body parameter
     * 
     * @apiSuccessExample {json} Success-Response:
     * {
            "errorOccurred": false,
            "message": "issue added to watch list successfully",
            "status": 200,
            "data": {
                "n": 1,
                "nModified": 1,
                "ok": 1
            }
        }
     *
     * @apiErrorExample {json} Error-Response:
     * {
            "errorOccurred": true,
            "message": "issue details not found",
            "status": 404,
            "data": null
        }
     */

    //change issue status
    //params : issueId of the issue for which the status is being changed to be passed as body parameter
    //params : newStatus that is being update to be passed as body parameter
    //queryParams : authToken to be passed as body, query or header parameter
    app.put(`${baseUrl}/changeIssueStatus`, auth.isAuthenticated, controller.changeIssueStatus);

    /**
     * @api {post} /issues/changeIssueStatus change issue status
     * @apiVersion 1.0.0
     * @apiGroup issues
     * 
     * @apiParam {String} authToken authToken to be passed as body, query or header parameter
     * @apiParam {String} issueId issue id of the issue for which the status is being changed to be passed as body parameter
     * @apiParam {String} newStatus status update to be passed as a string as a body parameter
     * 
     * @apiSuccessExample {json} Success-Response:
     * {
            "errorOccurred": false,
            "message": "issue status updated successfully",
            "status": 200,
            "data": {
                "n": 1,
                "nModified": 1,
                "ok": 1
            }
        }
     *
     * @apiErrorExample {json} Error-Response:
     * {
            "errorOccurred": true,
            "message": "issue details not found to update",
            "status": 404,
            "data": null
        }
     */


    //search issue titles
    //params : searchString : search string to be passed as body parameter
    //queryParams : authToken to be passed as body, query or header parameter
    app.put(`${baseUrl}/searchIssueTitle`, auth.isAuthenticated, controller.searchIssueTitle);

    /**
     * @api {post} /issues/searchIssueTitle search issue titles
     * @apiVersion 1.0.0
     * @apiGroup issues
     * 
     * @apiParam {String} authToken authToken to be passed as body, query or header parameter
     * @apiParam {String} searchString search string for searching the issue title to be passed as body parameter
     * 
     * @apiSuccessExample {json} Success-Response:
     * {
            "errorOccurred": false,
            "message": "issue title found",
            "status": 200,
            "data": [
                {
                    "status": "new",
                    "createdOn": "2020-03-08T11:09:28.000Z",
                    "watchersId": [
                        "Kzq61Q8u",
                        "TuWUOF5B"
                    ],
                    "commentsId": [],
                    "issueId": "PhDPgHgv",
                    "reporterId": "Kzq61Q8u",
                    "assignedToId": "TuWUOF5B",
                    "title": "first search 2",
                    "description": "description"
                },
                ...
                ...
                {
                    "status": "new",
                    "createdOn": "2020-03-08T11:09:19.000Z",
                    "watchersId": [
                        "Kzq61Q8u",
                        "TuWUOF5B"
                    ],
                    "commentsId": [],
                    "issueId": "aKy6qo0p",
                    "reporterId": "Kzq61Q8u",
                    "assignedToId": "TuWUOF5B",
                    "title": "first search",
                    "description": "description"
                }
            ]
        }
     *
     * @apiErrorExample {json} Error-Response:
     * {
            "errorOccurred": true,
            "message": "no such issues found",
            "status": 404,
            "data": null
        }
     */

    //create comment
    //params : issueId - of the issue for which comment is being created to be passed as body parameter
    //params : comment - the comment to be passed as body parameter
    //queryParams : authToken to be passed as body, query or header parameter
    app.post(`${baseUrl}/createNewComment`, auth.isAuthenticated, controller.createNewComment);

    /**
     * @api {post} /issues/createNewComment create new comment
     * @apiVersion 1.0.0
     * @apiGroup issues
     * 
     * @apiParam {String} authToken authToken to be passed as body, query or header parameter
     * @apiParam {String} issueId issue id of the issue for which the comment is being created to be passed as body parameter
     * @apiParam {String} comment comment string to be passed as a body parameter
     * 
     * @apiSuccessExample {json} Success-Response:
     * {
            "errorOccurred": false,
            "message": "comment created successfully",
            "status": 200,
            "data": {
                "createdOn": "2020-03-07T18:24:58.000Z",
                "commentId": "rsCswDe5",
                "commenterId": "pH4WJZvj",
                "comment": "new comment",
                "issueId": "Zk6ln5Q5"
            }
        }
     *
     * @apiErrorExample {json} Error-Response:
     * {
            "errorOccurred": true,
            "message": "issue details not found to add comment",
            "status": 404,
            "data": null
        }
     */

    //get all comments of issue
    //params : issueId - of the issue for which comments are being retreived to be passed as body parameter
    //params : skip integer which is a multiple of ten whose value defines number of values to skip to be passed as a body parameter optionally
    //queryParams : authToken to be passed as body, query or header parameter
    app.put(`${baseUrl}/getIssueComment`, auth.isAuthenticated, controller.getIssueComments);

    /**
     * @api {post} /issues/getIssueComment get issue comments
     * @apiVersion 1.0.0
     * @apiGroup issues
     * 
     * @apiParam {String} authToken authToken to be passed as body, query or header parameter
     * @apiParam {String} issueId issue id of the issue for which the comments are being retreived to be passed as body parameter
     * @apiParam {String} skip integer which is a multiple of ten whose value defines number of values to skip to be passed as a body parameter optionally
     * 
     * @apiSuccessExample {json} Success-Response:
     * {
            "errorOccurred": false,
            "message": "comments retreived successfully",
            "status": 200,
            "data": [
                {
                    "createdOn": "2020-03-07T18:48:27.000Z",
                    "commentId": "7DwqoazN",
                    "commenterId": "pH4WJZvj",
                    "comment": "new comment 3",
                    "issueId": "Zk6ln5Q5"
                },
                {
                    "createdOn": "2020-03-07T18:48:24.000Z",
                    "commentId": "w9K9ifyY",
                    "commenterId": "pH4WJZvj",
                    "comment": "new comment 2",
                    "issueId": "Zk6ln5Q5"
                },
                {
                    "createdOn": "2020-03-07T18:24:58.000Z",
                    "commentId": "rsCswDe5",
                    "commenterId": "pH4WJZvj",
                    "comment": "new comment",
                    "issueId": "Zk6ln5Q5"
                }
            ]
        }
     *
     * @apiErrorExample {json} Error-Response:
     * {
            "errorOccurred": true,
            "message": "no comments found on issue",
            "status": 404,
            "data": null
        }
     */

    //delete a comment
    //params : commentId - id of comment being deleted to be passed as body parameter
    //queryParams : authToken to be passed as body, query or header parameter
    app.put(`${baseUrl}/deleteComment`, auth.isAuthenticated, controller.deleteComment);

    /**
     * @api {post} /issues/deleteComment delete comment
     * @apiVersion 1.0.0
     * @apiGroup issues
     * 
     * @apiParam {String} authToken authToken to be passed as body, query or header parameter
     * @apiParam {String} commentId id of the comment being deleted to be passed as body parameter
     * 
     * @apiSuccessExample {json} Success-Response:
     * {
            "errorOccurred": false,
            "message": "comment deleted successfully",
            "status": 200,
            "data": {
                "createdOn": "2020-03-09T09:13:47.000Z",
                "commentId": "1K8HU9EM",
                "commenterId": "TuWUOF5B",
                "comment": "new comment 1",
                "issueId": "aKy6qo0p"
            }
        }
     *
     * @apiErrorExample {json} Error-Response:
     * {
            "errorOccurred": true,
            "message": "cannot delete others comments",
            "status": 400,
            "data": null
        }
     */

    
    //save file info
    //params : commentId - id of comment being deleted to be passed as body parameter
    //queryParams : authToken to be passed as body, query or header parameter
    app.post(`${baseUrl}/saveFileInfo`, auth.isAuthenticated, controller.saveFileInfo);

    /**
     * @api {post} /issues/saveFileInfo save file info
     * @apiVersion 1.0.0
     * @apiGroup issues
     * 
     * @apiParam {String} authToken authToken to be passed as body, query or header parameter
     * @apiParam {String} commentId id of the comment being deleted to be passed as body parameter
     * 
     * @apiSuccessExample {json} Success-Response:
     * {
                errorOccurred: false
                message: "file saved successfully"
                status: 200
                data: {
                    fileId: "yI9JHn63a"
                    fileFor: "comment"
                    fileForId: "XljL0obi"
                    fileName: "reported.png"
                }
            }
        }
     *
     * 
     */

    //get all files info
    //queryParams : authToken to be passed as body, query or header parameter
    app.get(`${baseUrl}/getAllFiles`, auth.isAuthenticated, controller.getAllFiles);

    /**
     * @api {post} /issues/getAllFiles get all files info
     * @apiVersion 1.0.0
     * @apiGroup issues
     * 
     * @apiParam {String} authToken authToken to be passed as body, query or header parameter
     * @apiParam {String} commentId id of the comment being deleted to be passed as body parameter
     * 
     * @apiSuccessExample {json} Success-Response:
     * {
                errorOccurred: false
                message: "file saved successfully"
                status: 200
                data: {
                    fileId: "yI9JHn63a"
                    fileFor: "comment"
                    fileForId: "XljL0obi"
                    fileName: "reported.png"
                }
            }
        }
     *
     * 
     */

     //download file
    //queryParams : authToken to be passed as body, query or header parameter
    //queryParams : fileId and fileName to be passed as query parameters
    app.get(`${baseUrl}/downloadFile`, auth.isAuthenticated, controller.downloadFile);

    /**
     * @api {post} /issues/downloadFile download file
     * @apiVersion 1.0.0
     * @apiGroup issues
     * 
     * @apiParam {String} authToken authToken to be passed as body, query or header parameter
     * @apiParam {String} fileId id of the the file to be passed as query parameter
     * @apiParam {string} fileName name of the file to be passed as query paremeter
     * 
     * @apiSuccessExample {json} Success-Response:
     * {
                errorOccurred: false
                message: "file saved successfully"
                status: 200
                data: {
                    fileId: "yI9JHn63a"
                    fileFor: "comment"
                    fileForId: "XljL0obi"
                    fileName: "reported.png"
                }
            }
        }
     *
     * 
     */


     // app.put(`${baseUrl}/testDeleteIssue`, auth.isAuthenticated, controller.testDeleteIssue);

}

module.exports = {
    setRouter : setRouter
}