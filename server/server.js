var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var url = 'mongodb://localhost:27017/game';

var STEPS_COLLECTION = "steps";
var GAMES_COLLECTION = "games";

var app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
var dirApp = __dirname + "/public";
console.log('express directory: ' + dirApp);
app.use(express.static(dirApp));
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(url, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(8080, function () {
     var port = server.address().port;
     console.log("App now running on port", port);
  });
});

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

app.get("/data/game/:id/simple", function(req, res) {
  var ids = [];

  db.collection(GAMES_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, game) {
    if (err) {
      handleError(res, err.message, "Failed to get game");
    } else {
      //console.log(game);
      if(game.steps){
        for (i = 0; i < game.steps.length; i++) {

          ids.push( game.steps[i].id_objectif);
        }
      }
      console.log("ids :" + ids);
      db.collection(STEPS_COLLECTION).find({ id: { $in : ids}}).toArray(function(err, steps){
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

app.get("/data/games/:id/simple", function(req, res) {
  var ids = [];

  db.collection(GAMES_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, game) {
    if (err) {
      handleError(res, err.message, "Failed to get game");
    } else {
      //console.log(game);
      for (i = 0; i < game.steps.length; i++) {
        ids.push(new ObjectID(game.steps[i]));
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
  insertStep(req,res);
  db.collection(GAMES_COLLECTION).updateOne({ _id: new ObjectID(req.params.idGame) },{ $addToSet : { steps : new ObjectID(req.params.idStep) }}, function(err, result) {
    if (err) {
      handleError(res, err.message, 'Delete step for game: ' + req.params.idGame);
    } else {
      res.status(204).end();
    }
  });
});



function insertStep(req, res) {
  var id;
  var newContact = req.body;

  db.collection(STEPS_COLLECTION).insertOne(newContact, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to create new step.");
    } else {
      res.status(201).json(doc.ops[0]);
      id = doc._id;
    }
  });
}


