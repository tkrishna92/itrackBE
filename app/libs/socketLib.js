const mongoose = require('mongoose');
const events = require('events');
const socketio = require('socket.io');
const eventEmitter = new events.EventEmitter();

//libs and modules
const logger = require('./loggerLib');
const check = require('./checkLib');
const token = require('./tokenLib');
const response = require('./responseLib');
const shortid = require('shortid');

//models
const userModel = mongoose.model('User');

let setServer = (server)=>{

    let io = socketio.listen(server);

    let myIo = io.of('');

    myIo.on('connection', (socket)=>{
        console.log("connection established successfully - emitting verify user");

        let userGroups = [];
        
        socket.emit('verifyUser', '');

        socket.on('auth-user', (authToken)=>{

            token.verifyWithoutSecretKey(authToken, (err, user)=>{
                if(err){
                    socket.emit("error-occurred", {status : 500, error : "invalid token provided"});
                }else {
                    let currentUser = user.data;
                    socket.userId = currentUser.userId;
                    socket.email = currentUser.email;
                    // let userWatchList = currentUser.watchingIssues;
                    // userWatchList.forEach((issue)=>{
                    //     console.log(issue);
                    //     socket.join(issue);
                    // })
                }
            })
        })

        //as soon as the user is verified the client emits "join-issue-room" for every issue the user is watching
        // this will help create a communication of all the notifications of the group
        socket.on('join-issue-room',(issueId)=>{
            console.log("joining issue : "+issueId);
            socket.join(issueId);
        })

        //on any action on issue receive event "issue-action" and emit "action-notification" on the issue room
        socket.on("issue-action",(data)=>{
            console.log("issue action event received : "+data);
            let issueId = data.issueId;
            socket.to(issueId).broadcast.emit('action-notification', data);
        })

        //on disconnect leave all the group rooms the user is a part of
        // socket.on('disconnect', ()=>{
        //    groupModel.find({groupUsers : socket.email})
        //     .lean()
        //     .exec((err, result)=>{
        //         if(err){
        //             logger.error("error while retreiving groups of users", "socketLib : on disconnect event - while retreiving user groups", 9);
        //             socket.emit("error-occurred", {status : 500, error : "unable to disconnect from group notifications"})
        //         }else if(check.isEmpty(result)){
        //             logger.info("user has not joined any group rooms", "socketLib : on disconnect event - while retreiving user groups", 9);
        //         }else {
        //             result.map((group)=>{
        //                 socket.leave(group.groupId);
        //             })
        //         }
        //     })
        // })

    })
}

module.exports = {
    setServer : setServer
}