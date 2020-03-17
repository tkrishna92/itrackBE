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
                    console.log("current user id :"+currentUser.userId);
                    socket.userId = currentUser.userId;
                    socket.email = currentUser.email;
                    socket.emit("user-loggedin", "loggedin");
                    // let userWatchList = currentUser.watchingIssues;
                    // userWatchList.forEach((issue)=>{
                    //     console.log(issue);
                    //     socket.join(issue);
                    // })
                }
            })
        })

        //on receiving "check-user-login" it will check if the user is logged in
        // and emits "loggedin" on event "user-loggedin"
        // socket.on("check-user-login",(userId)=>{
        //     console.log("check-user-login received");
        //     console.log(userId);
        //     console.log(socket.userId);
        //     if(socket.userId == userId){
        //         socket.emit("user-loggedin", "loggedin");
        //     }
        // })

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

       // on disconnect leave all the issue rooms the user is watching
        socket.on('disconnect', ()=>{
            console.log("received disconnect event")
            console.log(socket.userId);
           userModel.find({userId : socket.userId})
            .lean()
            .exec((err, result)=>{
                console.log(result);
                if(err){
                    logger.error("error while retreiving users watch list", "socketLib : on disconnect event - while retreiving user watch list", 9);
                    socket.emit("error-occurred", {status : 500, error : "unable to disconnect from issue notifications"})
                }else if(check.isEmpty(result)){
                    logger.info("user is not watching any issues", "socketLib : on disconnect event - while retreiving user watch list", 9);
                }else {
                    console.log(result);
                    result[0].watchingIssues.map((issue)=>{
                        console.log("leaving issue room : "+issue);
                        socket.leave(issue);
                    })
                }
            })
        })

    })
}

module.exports = {
    setServer : setServer
}