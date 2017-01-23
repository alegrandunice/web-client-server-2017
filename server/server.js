var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var url = 'mongodb://localhost:27017/game';

var STEPS_COLLECTION = "steps";
var GAMES_COLLECTION = "games";

var app = express()
    , http = require('http')
    , server = http.createServer(app);
    
app.use(bodyParser.urlencoded({
  extended: true
}));
var dirApp = __dirname + "/public";
console.log('express directory: ' + dirApp);
app.use(express.static(dirApp));
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;
var io;

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


// STEP API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

/*  "/data/steps"
 *    GET: finds all steps
 *    POST: creates a new step
 */

app.get("/data/steps", function(req, res) {
  db.collection(STEPS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get step.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post("/data/steps", insertStep);

/*  "/data/step/:id"
 *    GET: find step by id
 *    PUT: update step by id
 *    DELETE: delete step by id
 */

app.get("/data/step/:_id", function(req, res) {
  db.collection(STEPS_COLLECTION).findOne({ id : req.params._id }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get step");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.put("/data/step/:id", function(req, res) {
  var updateDoc = req.body;
  delete updateDoc.id;

  db.collection(STEPS_COLLECTION).updateOne({ _id : req.params.id }, updateDoc, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update step");
    } else {
      res.status(204).end();
    }
  });
});

app.delete("/data/step/:id", function(req, res) {
  console.log('Delete step: ' + req.params._id);
  db.collection(STEPS_COLLECTION).deleteOne({ _id: new ObjectID(req.params.id) }, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete step");
    } else {
      res.status(204).end();
    }
  });
});

app.get("/data/games", function(req, res) {
  console.log('Select games');
  db.collection(GAMES_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get contacts.");
    } else {
      res.status(200).json(docs);
    }
  });
});

/*  "/game/add"
 *    POST: add a new game
 */
app.post("/data/games", function(req, res) {
  console.log('add games');
  var newGame = req.body;

  newGame.createDate = new Date();

  //if (!(newGame.name && newGame.nbPlayers)) {
  //  handleError(res, "Invalid user input", "Must provide a name and the number of players.", 400);
  //}
  //else{
    db.collection(GAMES_COLLECTION).insertOne(newGame, function(err, doc) {
      if (err) {
        handleError(res, err.message, "Failed to create new game.");
      } else {
        res.status(201).json(doc.ops[0]);
      }
    });
  //}
});

/*  "/games/:id"
 *    GET: find game by id
 *    POST: update game by id
 */

app.get("/data/games/:id", function(req, res) {
  db.collection(GAMES_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get game");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.post("/data/games/:id", function(req, res) {
  var updateDoc = req.body;

  // TODO: get game by id , add trace or chat and update it

  db.collection(GAMES_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update game");
    } else {
      res.status(204).end();
    }
  });
});

app.delete("/data/game/:id", function(req, res) {
  console.log('Delete game: ' + req.params._id);
  db.collection(GAMES_COLLECTION).deleteOne({ _id: new ObjectID(req.params.id) }, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete game");
    } else {
      res.status(204).end();
    }
  });
});

app.put("/data/game/:id", function(req, res) {
  console.log("update game")
  var updateDoc = req.body;
  console.log(JSON.stringify(req.body));
  //delete updateDoc._id;
  console.log("name : " + updateDoc.name);
  console.log("id :" + req.params.id);
  db.collection(GAMES_COLLECTION).updateOne({ _id : new ObjectID(req.params.id) },
      {$set :
        { name : updateDoc.name,
          localisation : updateDoc.localisation,
          status: updateDoc.status,
          game_type : updateDoc.game_type
        }
      }, function(err, doc) {
          if (err) {
            handleError(res, err.message, "Failed to update step");
          } else {
            console.log("doc updated : " + doc.name );
            res.status(204).end();
          }
        });
});

app.get("/data/game/:id/simple", function(req, res) {
  var ids = [];

  db.collection(GAMES_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, game) {
    if (err) {
      handleError(res, err.message, "Failed to get game");
    } else {
      //console.log(game);
      if(game.steps){
        for (i = 0; i < game.steps.length; i++) {
          ids.push(new ObjectID(game.steps[i]));
        }
      }

      db.collection(STEPS_COLLECTION).find({_id: { $in : ids}}).toArray(function(err, steps){
        if (err) {
          handleError(res, err.message, "Failed to get steps for game " + req.params.id);
        } else {
          var simple = {
            name: game.name,
            status: game.status,
            localisation : game.localisation,
            game_type : game.game_type,
            steps : steps
          };
          res.status(200).json(simple);
        }
      });
    }
  });
});

app.delete("/data/game/:idGame/step/:idStep", function(req, res) {
  console.log('Delete step: ' + req.params.idStep + ' from game: ' + req.params.idGame);
  db.collection(GAMES_COLLECTION).updateOne({ _id: new ObjectID(req.params.idGame) },{ $pull : { steps : new ObjectID(req.params.idStep) }}, function(err, result) {
    if (err) {
      handleError(res, err.message, 'Delete step: ' + req.params.idStep + ' from game: ' + req.params.idGame);
    } else {
      res.status(204).end();
    }
  });
});

app.post("/data/game/:idGame/steps/", function(req, res) {
  console.log('Add step for game: ' + req.params.idGame);
  var newStepId = insertStep(req,res);
  db.collection(GAMES_COLLECTION).updateOne({ _id: new ObjectID(req.params.idGame) },{ $addToSet : { steps : new ObjectID(newStepId) }}, function(err, result) {
    if (err) {
      handleError(res, err.message, 'Delete step for game: ' + req.params.idGame);
    } else {
      res.status(204).end();
    }
  });
});

function insertStep(req, res) {
  var id;
  var newStep = req.body;
  console.log(JSON.stringify(req.body));
  db.collection(STEPS_COLLECTION).insertOne(newStep, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to create new step.");
    } else {
      res.status(201).json(doc.ops[0]);
      id = doc._id;

    }
  });
  return newStep._id;
}

/************************************************************************************************
****************************************     SOCKET      ****************************************
************************************************************************************************/
// routing
app.get('/test', function (req, res) {
  res.sendFile(__dirname + '/public/settings/simpleChat.html');
});


app.get('/master',function (req, res) {
  res.sendFile(__dirname + '/public/settings/master.html');
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
	});
    
    //permet de gere les messages dans les rooms spécifiques
    socket.on('send', function(data) {
        io.sockets.in(data.room).emit('message', socket.username, data);
    });

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(userdata){
	       
        username = userdata['username'];
        
        listOfPlayers[username] = new PlayerBB(userdata['username'], userdata['team'], userdata['lat'], userdata['long']);

        if(typeof(listOfTeams[userdata['team']]) === "undefined")
        {
            listOfTeams[userdata['team']]= userdata['team'];
            
            io.sockets.in("master").emit('addRoom', listOfPlayers[username].roomsList["withMaster"]);
           
        }
        
        //On envoie la liste des joueurs sur la room master
        io.sockets.in("master").emit('newPlayer', listOfPlayers[username]);

		socket.username = username;
		// add the client's username to the global list
		usernames[username] = username;
		// echo to the current client that he is connecter
		socket.emit('updatechat', 'SERVER', 'you have connected');

        //on envoie les rooms que l'utilisateur doit rejoindre
        socket.emit('joinRooms', 'SERVER', listOfPlayers[username].roomsList);
		// echo to all client except current, that a new person has connected
		socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
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

