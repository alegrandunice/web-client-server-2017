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
  require('./routes-settings')(app, sess, views, connect, db, handleError, STEPS_COLLECTION, GAMES_COLLECTION, USERS_COLLECTION, CLUES_COLLECTION);
  require('./routes-player')(app, sess, views, connect, db, handleError, STEPS_COLLECTION, GAMES_COLLECTION, USERS_COLLECTION, CLUES_COLLECTION);

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
    console.log(room, message);
    io.sockets.in(room).emit('message', { room: room, message: message });

    res.end('message sent');
});

/**
*   Definition classe player
*/

function PlayerBB(n, t, lat, long) {
  var name = n;
  var team = t;
  
  var lat = lat;
  var long = long;
  
  var roomsList = {};
  roomsList['only'] = "only"+t;
  roomsList['withMaster'] = "Master"+t;
  
  // ----- API -----
  return {
    name:name,
    team:team,
    lat:lat,
    long:long,
    roomsList:roomsList
  }
}



// usernames which are currently connected to the chat
var usernames = {};
//list of players currently in the game (username, team and position)
var listOfPlayers = {};
//list of teams
var listOfTeams = {};


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
        console.log('ici');
	});
    
    //permet de gere les messages dans les rooms spécifiques
    socket.on('send', function(data) {
        io.sockets.in(data.room).emit('message', socket.username, data);
        console.log('la');
    });

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(userdata){
	       console.log("Hello " + userdata['username']);
        username = userdata['username'];
        
        listOfPlayers[username] = new PlayerBB(userdata['username'], userdata['team'], userdata['lat'], userdata['long']);

        if(typeof(listOfTeams[userdata['team']]) === "undefined")
        {
            listOfTeams[userdata['team']]= listOfPlayers[username].roomsList;
           
        }
        
        //On envoie la liste des joueurs sur la room master
        io.sockets.in("master").emit('newPlayer', listOfPlayers[username]);

		socket.username = username;
		// add the client's username to the global list
		usernames[username] = username;
		// echo to the current client that he is connecter
		socket.emit('updatechat', 'SERVER', 'you have connected');

        //on envoie les rooms que l'utilisateur doit rejoindre
        socket.emit('joinRooms', listOfPlayers[username].roomsList);
		// echo to all client except current, that a new person has connected
		socket.broadcast.emit('updatechat', username + ' has connected');
		// tell all clients to update the list of users on the GUI
		io.sockets.emit("updateusers", usernames);
	});
    
    socket.on('addAdmin', function(username){
        socket.username = username;
        usernames[username] = username;
        io.sockets.in('master').emit('players', listOfPlayers);
    });
    
    socket.on("updatePlayerPosition", function(data){ 
        if(typeof(listOfPlayers[data.username]) !== "undefined")
        {
            listOfPlayers[data.username].lat = data.lat;
            listOfPlayers[data.username].long = data.lng;
            io.sockets.in("master").emit("updatePlayersPosition", listOfPlayers[data.username]);
        }
        
    });
    
    socket.on("validationStep", function(team, message){
        io.sockets.in("master").emit("validate", team, message);
    });
    
    socket.on("ValidateStep", function(team, isValid){
        console.log(listOfTeams[team]['only']);
        io.sockets.in(listOfTeams[team]['only']).emit("resultValidationStep", isValid);
    });
    

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
				// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
        
        io.sockets.in("master").emit('deleteUser', listOfPlayers[socket.username]);

		// Remove the player too
		delete listOfPlayers[socket.username];		
		io.sockets.emit('updatePlayers',listOfPlayers);
		
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
	});
};

