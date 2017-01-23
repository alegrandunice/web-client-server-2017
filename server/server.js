var express = require("express");
var session = require('express-session');
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var url = 'mongodb://localhost:27017/game';

var STEPS_COLLECTION = "steps";
var GAMES_COLLECTION = "games";
var GAMEMASTERS_COLLECTION = "gamemasters";
var CLUES_COLLECTION = "clues";

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


// Create a database variable outside of the database and socketIO connection callback to reuse the connection pool in your app.
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

/********************************************************************************************************************************************************************************************************
*************************************************************************************  API ROUTES BELOW *************************************************************************************************
*********************************************************************************************************************************************************************************************************
*/


//******************* VIEWS ***************************
//*****************************************************
var sess;
app.get('/login', function(req,res) {
    sess = req.session;
    if(sess.username)
        res.sendFile(views + '/settings/master.html');
    else
        res.sendFile( views + '/settings/login.html');
    })

    .post('/login', function(req,res) {
        connect(req,res);
    })

    .get('/logout', function(req,res) {
        console.log("Im the put");
        //res.redirect('/login');
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

    .get('/account/edit', function(req,res) {
        sess = req.session;
        if(sess.username)
            res.sendFile( views + '/settings/edit-account.html');
        else
            res.sendFile( views + '/settings/login.html');

    })
    .get('/account/new', function(req,res) {
        sess = req.session;
        if(sess.username)
            res.sendFile( views + '/settings/new-account.html');
        else
            res.sendFile( views + '/settings/login.html');
    })
    .get('/game/edit', function(req,res) {
        sess = req.session;
        if(sess.username)
            res.sendFile( views + '/settings/edit-game.html');
        else
            res.sendFile( views + '/settings/login.html');
    })
    .get('/game/select', function(req,res) {
        sess = req.session;
        if(sess.username)
            res.sendFile( views + '/settings/select-game.html');
        else
            res.sendFile( views + '/settings/login.html');
    })


    .get('/', function(req,res) {
        sess = req.session;
        if(sess.username)
            res.sendFile(views + '/settings/master.html');
        else
            res.redirect('/login');
    })

    .get('/*', function(req,res) {
        res.sendFile( views + '/settings/login.html');
    });

//******************* DATA ***************************
//****************************************************
function connect(req, res) {
    new Promise(function(resolve, reject) {
        db.collection(GAMEMASTERS_COLLECTION).findOne({ username : req.body.username, password: req.body.password }, function(err, doc) {
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
        sess.username=req.body.username;
        res.redirect('/');
    }, function(error) {
        console.error(error);
        res.sendFile( views + '/gamemaster/login.html');
    });
}


// STEP API ROUTES BELOW

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}




//************************************************************************************* STEP API ROUTES BELOW *********************************************************************************************

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

function insertStep(req, res) {
	
  var id;
  var newStep = req.body;
  
  console.log(JSON.stringify(newStep));
  
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

/*  "/data/steps/:id"
 *    GET: find step by id
 *    PUT: update step by id
 *    DELETE: delete step by id
 */

app.get("/data/steps/:id", function(req, res) {
  db.collection(STEPS_COLLECTION).findOne({ _id : new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get step");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.put("/data/steps/:id", function(req, res) {
  var updateDoc = req.body;
  //delete updateDoc.id;

  db.collection(STEPS_COLLECTION).updateOne({ _id : new ObjectID( req.params.id ) },	
	{
	  $set :
        { name : updateDoc.name,
          explanation : updateDoc.explanation,
          total_points: updateDoc.total_points
        }
    }, updateDoc, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update step");
    } else {
      res.status(204).end();
    }
  });
});

app.delete("/data/steps/:id", function(req, res) {
  console.log('Delete step: ' + req.params._id);
  db.collection(STEPS_COLLECTION).deleteOne({ _id: new ObjectID(req.params.id) }, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete step");
    } else {
      res.status(204).end();
    }
  });
});





//************************************************************************************* GAME API ROUTES BELOW *****************************************************************************************************


/*  "/data/games"
 *    GET: finds all games
 *    POST: creates a new game
 */


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


app.post("/data/games", function(req, res) {
	
  console.log('add games');
  var newGame = req.body;
  newGame.createDate = new Date();
  db.collection(GAMES_COLLECTION).insertOne(newGame, function(err, doc) {
      if (err) {
        handleError(res, err.message, "Failed to create new game.");
      } else {
        res.status(201).json(doc.ops[0]);
      }
    });
});

/*  "data/games/:id"
 *    GET: find game by id
 *    PUT: update game by id
 *    DELETE : DELETE A GAME
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


app.put("/data/games/:id", function(req, res) {
	
  console.log("update game");
	
  var updateDoc = req.body;
  console.log(JSON.stringify(req.body));
	
  //delete updateDoc._id;
  console.log("name : " + updateDoc.name);
  console.log("id :" + req.params.id);
	
  db.collection(GAMES_COLLECTION).updateOne({ _id : new ObjectID(req.params.id) },
      
	{
	  $set :
        { name : updateDoc.name,
          localisation : updateDoc.localisation,
          status: updateDoc.status,
          game_type : updateDoc.game_type
        }
    }, 
	function(err, doc) {
          if (err) {
            handleError(res, err.message, "Failed to update game");
          } else {
            console.log("game updated : " + doc.name );
            res.status(204).end();
          }
        });
});

app.delete("/data/games/:id", function(req, res) {
  console.log('Delete game: ' + req.params._id);
  db.collection(GAMES_COLLECTION).deleteOne({ _id: new ObjectID(req.params.id) }, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete game");
    } else {
      res.status(204).end();
    }
  });
});




//**************************************************************************** CLUE API ROUTES BELOW *******************************************************************************************************


/*  "/data/clues"
 *    GET: finds all clues
 *    POST: creates a new clue
 */


app.get("/data/clues", function(req, res) {
  console.log('Select clues');
  db.collection(CLUES_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get clues.");
    } else {
      res.status(200).json(docs);
    }
  });
});


app.post("/data/clues", insertClue);

function insertClue(req,res) {

	var id;
	var newClue = req.body;
	
  console.log('add clues');
	

  newClue.createDate = new Date();
  db.collection(CLUES_COLLECTION).insertOne(newClue, function(err, doc) {
      if (err) {
        handleError(res, err.message, "Failed to create new clue.");
      } else {
        res.status(201).json(doc.ops[0]);
      }
    });
	return newClue._id;
}



/*  "data/clues/:id"
 *    GET: find clue by id
 *    POST: update clue by id
 */

app.get("/data/clues/:id", function(req, res) {
  db.collection(CLUES_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get clue");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.put("/data/clues/:id", function(req, res) {
  var updateDoc = req.body;

  // TODO: get game by id , add trace or chat and update it

  db.collection(CLUES_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update clue");
    } else {
      res.status(204).end();
    }
  });
});

app.delete("/data/clues/:id", function(req, res) {
  console.log('Delete game: ' + req.params._id);
  db.collection(CLUES_COLLECTION).deleteOne({ _id: new ObjectID(req.params.id) }, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete clue");
    } else {
      res.status(204).end();
    }
  });
});


//********************************************************************************************************************************************************************************************/
//******************************************************************************** GENERAL WORKFLOW API BELOW*********************************************************************************/
//********************************************************************************************************************************************************************************************/

//************************************************************************************ GAMES && STEPS ****************************************************************************************/


/*  "/data/games/:id/simple"
 *    GET : GET A GAME WITH ITS REGISTRED STEPS
 */


app.get("/data/games/:id/simple", function(req, res) {
	
  var ids = [];

  db.collection(GAMES_COLLECTION).findOne({ _id: new ObjectID( req.params.id ) }, function(err, game) {
    
	if (err) {
      handleError(res, err.message, "Failed to get game");
    } else {
      //console.log(game);
      if(game.steps){
        for (i = 0; i < game.steps.length; i++) {
          ids.push( new ObjectID( game.steps[i].id ) ) ;
        }
      }

      db.collection(STEPS_COLLECTION).find({ _id: { $in : ids}}).toArray(function(err, steps){
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



/*  "/data/game/:idGame/step/:idStep"
 *    DELETE : DELETE A STEP WITHIN A GAME 
 */


app.delete("/data/games/:idGame/step/:idStep", function(req, res) {
  console.log('Delete step: ' + new ObjectID( req.params.idStep ) + ' from game: ' + new ObjectID( req.params.idGame ));
  db.collection(GAMES_COLLECTION).findOneAndUpdate({ _id: new ObjectID( req.params.idGame ) },{ $pull : { steps : { id : req.params.idStep    } }}, function(err, result) {
    if (err) {
      handleError(res, err.message, 'Delete step: ' + req.params.idStep + ' from game: ' + req.params.idGame);
    } else {
      res.status(204).end();
    }
  });
	db.collection(STEPS_COLLECTION).deleteOne({ _id:  new ObjectID( req.params.idStep ) }, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete step");
    } else {
      res.status(204).end();
    }
  });
});


/*  "/data/game/:idGame/step/:idStep"
 *    POST : ADD A NEW STEP TO A GAME 
 */

app.post("/data/games/:idGame/steps/", function(req, res) {
  console.log('Add step for game: ' + req.params.idGame);
  var newStepId = insertStep(req,res);
  db.collection(GAMES_COLLECTION).updateOne({ _id: new ObjectID( req.params.idGame ) },{ $addToSet : { steps : newStepId }}, function(err, result) {
    if (err) {
      handleError(res, err.message, 'Delete step for game: ' + req.params.idGame);
    } else {
      res.status(204).end();
    }
  });
});




//************************************************************************************ CLUES && STEPS ****************************************************************************************/


/*  "/data/steps/:id/simple"
 *    GET : GET A STEP WITH ITS REGISTRED CLUES
 */


app.get("/data/steps/:id/simple", function(req, res) {
	
  var ids = [];

	
	 console.log('get step id information: ' + req.params.id );
	
  db.collection(STEPS_COLLECTION).findOne({ _id :new ObjectID ( req.params.id )   }, function(err, step) {
    
	if (err) {
      handleError(res, err.message, "Failed to get step");
    } else {
      //console.log(game);
      if(step.clues){
        for (i = 0; i < step.clues.length; i++) {
          ids.push(  new ObjectID( step.clues[i].id )  )   ;
        }
      }

      db.collection(CLUES_COLLECTION).find({ _id : { $in : ids } } ).toArray(function(err, clues){
        if (err) {
          handleError(res, err.message, "Failed to get clues for step " + req.params.id);
        } else {
          var simple = {
            name: step.name,
            explanation: step.explanation,
            total_points : step.total_points,
            clues : clues
          };
          res.status(200).json(simple);
        }
      });
    }
  });
});



/*  "/data/game/:idGame/step/:idStep"
 *    DELETE : DELETE A CLUE WITHIN A STEP 
 */


app.delete("/data/steps/:idStep/clues/:idClue", function(req, res) {
  console.log('Delete clue: ' + req.params.idClue + ' from step: ' + req.params.idStep);
  db.collection(STEPS_COLLECTION).findOneAndUpdate({ id: req.params.idStep },{ $pull : { clues : { id : req.params.idClue } }}, function(err, result) {
    if (err) {
      handleError(res, err.message, 'Delete clue: ' + req.params.idClue + ' from step: ' + req.params.idStep);
    } else {
      res.status(204).end();
    }
  });
	db.collection(CLUES_COLLECTION).deleteOne({ _id: new ObjectID(req.params.idClue) }, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete step");
    } else {
      res.status(204).end();
    }
  });
});


/*  "/data/game/:idGame/step/:idStep"
 *    POST : ADD A NEW CLUE TO A STEP 
 */

app.post("/data/steps/:idStep/clues/", function(req, res) {
  console.log('Add clue for step: ' + req.params.idStep);
  
  
  var newClueId = insertClue(req,res);
  db.collection(STEPS_COLLECTION).updateOne({ _id: new ObjectID (req.params.idStep) },{ $addToSet : { clues :  newClueId  }}, function(err, result) {
    if (err) {
      handleError(res, err.message, 'Add clue for step: ' + req.params.idStep);
    } else {
      res.status(204).end();
    }
  });
});






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

