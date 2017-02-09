var express = require("express");

var session = require('express-session');
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var url = 'mongodb://localhost:27017/game';

//var STEPS_COLLECTION = "steps";
var STEPS_COLLECTION = "steps";
var GAMES_COLLECTION = "games";
var USERS_COLLECTION = "users";
var CLUES_COLLECTION = "clues";

var encoded = "";
var decoded = "";


var dirApp = __dirname + "/public";
var views = __dirname + "/views";
console.log('express directory: ' + dirApp);
var app = express()
    , http = require('http')
    , server = http.createServer(app);
app.use(session({secret: 'ssshhhhh', resave: true, saveUninitialized: true}));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(express.static(dirApp));


var sess = undefined;

// Create a database variable outside of the database and socketIO connection callback to reuse the connection pool in your app.
var db = undefined;
var io = undefined;
var startedGames = {};





//*********************** UPLOADS IMAGES ***************************
var fs = require("fs");
var multer  = require("multer");
var storage = multer.diskStorage({
    destination: dirApp + "/uploads",
    filename: function (req, file, cb) {
        cb(null, file.originalname + '-' + Date.now());
    }
});

var upload = multer({ storage: storage });

app.post('/api/file', upload.array('file'), function (req, res) {

    console.log("received " + req.files.length + " files");// form files
    for(var i=0; i < req.files.length; i++) {
        console.log("### " + req.files[i].path);
    }
    //console.log("The URL for the file is:" + "localhost:3000\\"+req.file.path);

    res.status(204).end();

});


 //******************* DATA ***************************
 //****************************************************
 function connect(req, res) {
    console.log(req.body.username + " : " + req.body.password);
    //console.log(redirectHome);
    new Promise(function(resolve, reject) {
        db.collection(USERS_COLLECTION).findOne({ username : req.body.username, password: req.body.password }, function(err, doc) {
            if (err) {
                reject("error while getting account");
            } else {
                if(doc != null){
                    resolve(doc);
                }
                else{
                    reject("enable to find this account !");
                }
            }
        });
    }).then(function(response) {
        console.log("doc retreived from db : " + JSON.stringify(response));
        sess = req.session;
        sess.userid=response._id;
        sess.username=response.username;
        sess.type=response.type;
        if(response.type == "gamemaster")
            res.status(201).end('/gamemaster/select-game.html');
        else if(response.type == "player")
            res.status(201).end('/player/select-game.html');

    }, function(error) {
        console.error(error);
    });
}

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({"error": message});
}

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI || url, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");
  
  init();

  //required routes files
  require('./routes-settings')(app, sess, views, connect, db, handleError, STEPS_COLLECTION, GAMES_COLLECTION, USERS_COLLECTION, CLUES_COLLECTION, fs, multer, storage, upload, startedGames);
  require('./routes-player')(app, sess, views, connect, db, handleError, STEPS_COLLECTION, GAMES_COLLECTION, USERS_COLLECTION, CLUES_COLLECTION, fs, multer, storage, upload);

});



function init()
{

    // Initialize the app.
    server = app.listen(process.env.PORT || 8080, function () {
        var port = server.address().port;
        console.log("App now running on port", port);
    });
    

    io = require('socket.io').listen(server);
    io.sockets.on('connection', connectSocketFunction);
}

/********************************************************************************************************************************************************************************************************
*************************************************************************************  API ROUTES BELOW *************************************************************************************************
*********************************************************************************************************************************************************************************************************
*/


//******************* VIEWS ***************************
//*****************************************************

// ******************* gamemaster *********************
//*****************************************************

app
    .get('/gamemaster/select-game.html', function(req,res) {
        console.log("select game master");
        sess = req.session;
        if(sess.username && sess.type == "gamemaster"){
            res.sendFile(views + '/gamemaster/select-game.html');
        }
        else{
            console.log("fail");
            res.redirect('/login');
        }
    })

    .get('/gamemaster/master.html', function(req,res) {
        console.log("master.html");
        sess = req.session;
        if(sess.username && sess.type == "gamemaster"){
            console.log("master.html ok");
            res.sendFile(views + '/gamemaster/master.html');
        }
        else{
            console.log("master.html ko");
            res.redirect('/login');
        }
    });

    /*.get('/gamemaster/new-account.html', function(req,res) {
        sess = req.session;
        if(sess.username && sess.type == "gamemaster"){
            console.log("master.html ok");
            res.sendFile(views + '/gamemaster/master.html');
        }
        else{
            console.log("master.html ko");
            res.redirect('/login');
        }
    })*/

//************************************************************************************ ACCOUNTS ****************************************************************************************/

app.get('/login', function(req,res) {
    sess = req.session;
    if(sess.username){
        if(sess.type == "gamemaster")
            res.redirect('/gamemaster/select-game.html');
        else if(sess.type == "player")
            res.redirect('/player/select-game.html');
    }
    else
        res.sendFile( views + '/settings/login.html');
})

    .post('/login', function(req,res) {
        connect(req,res);
    })

    .get('/logout', function(req,res) {
        req.session.destroy(function(err) {
            if(err) {
                console.log("failed to destroy session");
                console.log(err);
            } else {
                console.log("session destroyed");
                res.redirect('/login');
            }
        });
    })

    .get('/data/user/get/', function(req,res) {
        sess = req.session;
        console.log("GET USER !");
        if(sess.username){
            db.collection(USERS_COLLECTION).findOne( { username : sess.username }, function(err, doc) {
                if (err) {
                    handleError(res, err.message, "Failed to get user to update account");
                } else {
                    console.log("GOT USER !");
                    res.status(200).json(doc);
                }
            });
        }
        else{
            res.redirect('/login');
        }
    })

    .post("/data/users/create/", function(req, res) {

        var newUser = req.body;

        console.log("user :" + JSON.stringify(newUser));

        var username = newUser.username;
        var email = newUser.email;

        db.collection(USERS_COLLECTION).findOne({ $or : [ { username : username }, { email : email }]}, function(err, doc) {
            if (err) {
                handleError(res, err.message, "Failed to get username or email for verification");
            } else {
                if(doc != null){
                    //handleError(res, "username or email already exists !");
                    res.status(201).end("username or email already exists !");
                }
                else{
                    db.collection(USERS_COLLECTION).insertOne(newUser, function(err, docInserted) {
                        if (err) {
                            handleError(res, err.message, "Failed to create new user.");
                        } else {
                            console.log("account successfully created !");
                            res.status(201).end("account successfully created !");
                        }
                    });
                }

            }
        });
    })

    .post("/data/users/update/", function(req, res) {

        sess = req.session;

        var newUser = req.body;
        newUser.type = sess.type;
        console.log("updated user :" + JSON.stringify(newUser));

        db.collection(USERS_COLLECTION).updateOne({ username : sess.username }, newUser, function(err, doc) {
            if (err) {
                handleError(res, err.message, "Failed to update account");
            } else {
                sess.username = newUser.username;
                res.status(201).end("account successfully updated !");
            }
        });
    });




/************************************************************************************************
****************************************     SOCKET      ****************************************
************************************************************************************************/
// routing
app.get('/test', function (req, res) {
  res.sendFile(__dirname + '/public/player/play.html');
});


app.get('/master',function (req, res) {
  res.sendFile(__dirname + '/public/player/master.html');
});

app.post('/send/:room/', function(req, res) {
    var room = req.params.room
        message = req.body;
    io.sockets.in(room).emit('message', { room: room, message: message });

    res.end('message sent');
});

/**
*   Definition classe player
*/

function PlayerBB(n, t, lat, long, game) {
  var name = n;
  var team = t;
  
  var lat = lat;
  var long = long;
  
  var roomsList = {};
  roomsList['only'] = game+"_only"+t;
  roomsList['withMaster'] = game+"_Master"+t;
  roomsList['all'] = game;
  
  // ----- API -----
  return {
    name:name,
    team:team,
    lat:lat,
    long:long,
    roomsList:roomsList
  }
}


var connectSocketFunction = function connectSocket(socket) {
    
    //Permet à un utilisateur de rejoindre une room
    socket.on('subscribe', function(room) { 
        console.log('joining room', room);
        socket.join(room); 
    });
    
    //permet à un utilisateur de quitter une room
    socket.on('unsubscribe', function(room) {  
        console.log('leaving room', room);
        socket.leave(room); 
    })

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		io.sockets.emit('updatechat', socket.username, data);
	});
    
    //permet de gere les messages dans les rooms spécifiques
    socket.on('send', function(data) {
        io.sockets.in(data.room).emit('message', socket.username, data);
        var splitTab = data.room.split("_");
        var idgame = splitTab[0];
        var destinationRoom = '';

        for(t=1;t<splitTab.lengh; t++)
        {
            destinationRoom += splitTab[t];
        }

        db.collection(GAMES_COLLECTION).updateOne({_id: new ObjectID(idgame) }, {
            $push: {
                "trace":{ "user_name": socket.username, "destination_room":data.room, "text" : data.message }
            }
        }, undefined, function (err, doc) {
            if (err) {
                handleError(res, err.message, "Failed to store chat message");
            } else {
                console.log("done !");
            }
        });
    });

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(idgame, userdata){
        if(typeof(startedGames[idgame]) != "undefined")
        {
            console.log("Hello " + userdata['username']);
            username = userdata['username'];
            
            startedGames[idgame].listOfPlayers[username] = new PlayerBB(userdata['username'], userdata['team'], userdata['lat'], userdata['long'], idgame);

            if(typeof(startedGames[idgame].listOfTeams[userdata['team']]) === "undefined")
            {
                startedGames[idgame].listOfTeams[userdata['team']]= startedGames[idgame].listOfPlayers[username].roomsList;
               
            }
            
            //On envoie la liste des joueurs sur la room master
            io.sockets.in(idgame + "_master").emit('newPlayer', idgame, startedGames[idgame].listOfPlayers[username]);

            socket.username = username;
            socket.idGame = idgame;
            // add the client's username to the global list
            startedGames[idgame].usernames[username] = username;

            //on envoie les rooms que l'utilisateur doit rejoindre
            socket.emit('joinRooms', startedGames[idgame].listOfPlayers[username].roomsList);

            // tell all clients to update the list of users on the GUI
            io.sockets.in(idgame).emit("updateusers", startedGames[idgame].usernames);
        }
	});
    
    socket.on('addAdmin', function(idGame, username){
        if(typeof(idGame) != "undefined" && typeof(startedGames[idGame]) != "undefined")
        {
            socket.username = username;
            startedGames[idGame].usernames[username] = username;
            io.sockets.in(idGame+'_master').emit('players', startedGames[idGame].listOfPlayers);
        }
    });
    
    socket.on("updatePlayerPosition", function(idgame, data){ 
        if(typeof(idgame) != "undefined" && typeof(startedGames[idgame]) !== "undefined" && typeof(startedGames[idgame].listOfPlayers[data.username]) !== "undefined")
        {
            startedGames[idgame].listOfPlayers[data.username].lat = data.lat;
            startedGames[idgame].listOfPlayers[data.username].long = data.lng;
            io.sockets.in(idgame+"_master").emit("updatePlayersPosition", startedGames[idgame].listOfPlayers[data.username]);
        }
        
    });
    
    function getCurrentStep(gameid, teamName)
    {
        db.collection(GAMES_COLLECTION).findOne({_id: new ObjectID(gameid)}, { steps: 1, teams: 1 }, function(err, doc) {
            if (err) {
                handleError(res, err.message, "Failed to get current step.");
            } else {
                let team;
                let indexTeam;
                
                for (t = 0; t < doc.teams.length; t++) {
                    if (doc.teams[t].name !== undefined) {
                        if (doc.teams[t].name == teamName) {
                            team = doc.teams[t];
                            indexTeam = t;
                        }
                    }
                }

                if ((team !== undefined) && (doc.steps !== undefined)) {
                    let teamstep = {};
                    let newstep = false;

                    var liststeps = [];

                    if (team.steps !== undefined) {
                        for (p = 0; p < team.steps.length; p++)
                            liststeps.push(team.steps[p]);
                    }

                    if (team.steps === undefined) {
                        if (doc.steps.length >= 1) {
                            teamstep = {
                                "stepid": doc.steps[0],
                                "time_began": new Date(),
                                "used_clues": 0
                            };
                            liststeps.push(teamstep);

                            newstep = true;
                        }
                    }
                    else if (team.steps[team.steps.length - 1].time_ended !== undefined) {
                        if (doc.steps.length >= team.steps.length + 1) {
                            teamstep = {
                                "stepid": doc.steps[team.steps.length],
                                "time_began": new Date(),
                                "used_clues": 0
                            };
                            liststeps.push(teamstep);

                            newstep = true;
                        }
                    }
                    else {
                        teamstep = team.steps[team.steps.length - 1]
                    }

                    if (newstep && (indexTeam !== undefined)) {
                        let teamt = {};
                        teamt["teams." + indexTeam + ".steps"] = liststeps;
                        db.collection(GAMES_COLLECTION).updateOne({_id: new ObjectID(gameid)}, {$set: teamt}, undefined, function (err, doc) {
                            if (err) {

                            } else {

                            }
                        });
                    }

                    if (teamstep.stepid !== undefined) {
                        db.collection(STEPS_COLLECTION).findOne({ _id : teamstep.stepid }, function(err, doc) {
                            if (err) {
                                io.sockets.in(gameid+"_master").emit("currentStep", teamName, "erreur", "Failed to get step");
                            } else {
                                if (doc == null) {
                                    io.sockets.in(gameid+"_master").emit("currentStep", teamName, "erreur", "Failed to get step");
                                }
                                else {
                                    console.log(doc);
                                    let stepgame = doc.name;
                                    let idStep = team.steps.length;
                                    let coordinate = doc.coordinate;
                                    
                                    
                                    io.sockets.in(gameid+"_master").emit("currentStep", teamName, idStep, stepgame, coordinate);
                                }
                            }
                        });
                    }
                    else
                        io.sockets.in(gameid+"_master").emit("currentStep", teamName, "erreur", "");
                }
                else{
                    io.sockets.in(gameid+"_master").emit("currentStep", teamName, "erreur", "Failed to get current step.");
                }
                
            }
                
        });
    }
    
    socket.on("getTeamStep", function(gameid, teamName){
        
        getCurrentStep(gameid, teamName);
        
    });
    
    socket.on("validationStep", function(idgame, team, message){
        io.sockets.in(idgame+"_master").emit("validate", team, message);
    });
    
    socket.on("ValidateStep", function(idgame, team, isValid){
        if(typeof(startedGames[idgame]) != "undefined")
        {
            io.sockets.in(startedGames[idgame].listOfTeams[team]['only']).emit("resultValidationStep", isValid);
            
            if(isValid)
            {
                getCurrentStep(idgame, team);
            }
                
        }
    });
    

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		if(typeof(startedGames[socket.idGame]) != "undefined")
        {
            // remove the username from global usernames list
            delete startedGames[socket.idGame].usernames[socket.username];
                    // update list of users in chat, client-side
            io.sockets.emit('updateusers', startedGames[socket.idGame].usernames);
            
            io.sockets.in(socket.idGame+"_master").emit('deleteUser', startedGames[socket.idGame].listOfPlayers[socket.username]);

            // Remove the player too
            delete startedGames[socket.idGame].listOfPlayers[socket.username];		
            io.sockets.emit('updatePlayers',startedGames[socket.idGame].listOfPlayers);
        }
		
	});
};

