var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

module.exports = function(app, sess, views, connect, db, handleError, STEPS_COLLECTION, GAMES_COLLECTION, USERS_COLLECTION, CLUES_COLLECTION) {

    app
        .get('/settings/select-game.html', function(req,res) {
            sess = req.session;
            console.log(sess.type);
            if(sess.username && sess.type == "gamemaster"){
                res.sendFile(views + '/settings/select-game.html');
            }
            else{
                console.log("fail");
                res.redirect('/login');
            }
        })

        .get('/settings/edit-account.html', function(req,res) {
            sess = req.session;
            if(sess.username){
                res.sendFile(views + '/settings/edit-account.html');
            }
            else{
                console.log("fail");
                res.redirect('/login');
            }
        })
        .get('/settings/edit-clue.html', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "gamemaster"){
                res.sendFile(views + '/settings/edit-clue.html');
            }
            else{
                console.log("fail");
                res.redirect('/login');
            }
        })
        .get('/settings/edit-game.html', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "gamemaster"){
                res.sendFile(views + '/settings/edit-game.html');
            }
            else{
                console.log("fail");
                res.redirect('/login');
            }
        })
        .get('/settings/edit-step.html', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "gamemaster"){
                res.sendFile(views + '/settings/edit-step.html');
            }
            else{
                console.log("fail");
                res.redirect('/login');
            }
        })
        .get('/settings/new-account.html', function(req,res) {
            sess = req.session;
            if(sess.username)
                res.redirect('/login');
            else
                res.sendFile(views + '/settings/new-account.html');

        });



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
        console.log(JSON.stringify(req.body));
        db.collection(STEPS_COLLECTION).updateOne({ _id : new ObjectID( req.params.id ) }, { $set : req.body }, function(err, doc) {
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
                        game_type : updateDoc.game_type,
                        accesskey: updateDoc.accesskey
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
                        ids.push(new ObjectID(game.steps[i])) ;
                    }
                }

                db.collection(STEPS_COLLECTION).find({ _id: { $in : ids}}).toArray(function(err, steps){
                    if (err) {
                        handleError(res, err.message, "Failed to get steps for game " + req.params.id);
                    } else {
                        var simple = {
                            name: game.name,
                            accesskey: game.accesskey,
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

        db.collection(STEPS_COLLECTION).findOne({ _id : new ObjectID(req.params.id)   }, function(err, step) {
            if (err) {
                handleError(res, err.message, "Failed to get step");
            } else {
                //console.log(game);
                if(step.clues){
                    console.log('get step id information: ' + req.params.id );
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
                            explanationType : step.explanationType,
                            answers : step.answers,
                            type : step.type,
                            coordinate : step.coordinate,
                            qcm: step.qcm,
                            picture : step.picture,
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


}