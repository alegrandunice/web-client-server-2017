var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

module.exports = function(app, sess, views, connect, db, handleError, STEPS_COLLECTION, GAMES_COLLECTION, USERS_COLLECTION, CLUES_COLLECTION){


        /*.get('/player/login', function(req,res) {
            console.log("get login");
            sess = req.session;
            if(sess.username)
                res.sendFile(views + '/player/select-game.html');
            else
                res.sendFile( views + '/player/login.html');
        })
        .post('/player/login', function(req,res) {
            connect(req,res,'/player/select-game.html', 'player');
        })*/
    app
        .get('/player/logout', function(req,res) {
            console.log("Im the put");
            //res.redirect('/login');
            req.session.destroy(function(err) {
                if(err) {
                    console.log("failed to destroy session");
                    console.log(err);
                } else {
                    console.log("session destroyed");
                    res.redirect('/player/login');
                }
            });
        })
        .get('/player/select-game.html', function(req,res) {
            console.log("I'm here");
            sess = req.session;
            if(sess.username && sess.type == "player"){
                res.sendFile(views + '/player/select-game.html' );
            }
            else{
                console.log("fail");
                res.sendFile( views + '/player/login.html');
            }
        })
        .get('/player/select-team.html', function(req,res) {
            sess = req.session;
            if(sess.username && (sess.type == "player") && (sess.idGameChecked !== undefined) && (req.query.idgame === sess.idGameChecked)) {
                res.sendFile(views + '/player/select-team.html');
            }
            else{
                console.log("fail");
                res.sendFile( views + '/player/login.html');
            }
        })
        .get('/player/play.html', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "player"){
                res.sendFile(views + '/player/play.html');
            }
            else{
                console.log("fail");
                res.sendFile( views + '/player/login.html');
            }
        })
        .get('/data/player/games-in', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "player"){
                console.log('Player: Select games in');
                db.collection(GAMES_COLLECTION).find({status: "IN PROGRESS", "teams.players.userid" : sess.userid}).toArray(function(err, docs) {
                    if (err) {
                        handleError(res, err.message, "Failed to get contacts.");
                    } else {
                        res.status(200).json(docs);
                    }
                });
            }
            else{
                console.log("fail");
                res.sendFile( views + '/player/login.html');
            }
        })
        .post('/data/player/games-not', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "player"){
                console.log('Player: Select not in game with filters');
                let filter = { status: "IN PROGRESS", "teams.players.userid":  { $ne: sess.userid } };

                if ((req.body.name !== undefined) && (req.body.name.trim() != ""))
                    filter.name = {$regex : ".*" + req.body.name + ".*"};
                if (req.body.localisation !== undefined) {
                    if ((req.body.localisation.country !== undefined) && (req.body.localisation.country.trim() != ""))
                        filter["localisation.country"] = {$regex: ".*" + req.body.localisation.country + ".*"};
                    if ((req.body.localisation.region !== undefined) && (req.body.localisation.region.trim() != ""))
                        filter["localisation.region"] = {$regex: ".*" + req.body.localisation.region + ".*"};
                    if ((req.body.localisation.city !== undefined) && (req.body.localisation.city.trim() != ""))
                        filter["localisation.city"] = {$regex: ".*" + req.body.localisation.city + ".*"};
                }
                if ((req.body.game_type !== undefined) && (req.body.game_type.trim() != ""))
                    filter.game_type = {$regex : ".*" + req.body.game_type + ".*"};

                db.collection(GAMES_COLLECTION).find(filter).toArray(function(err, docs) {
                    if (err) {
                        handleError(res, err.message, "Failed to get contacts.");
                    } else {
                        res.status(200).json(docs);
                    }
                });
            }
            else{
                console.log("fail");
                res.sendFile( views + '/player/login.html');
            }
        })
        .delete('/data/player/exit-game/:idgame', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "player"){
                console.log('Player: Exit game');
                db.collection(GAMES_COLLECTION).find({_id: new ObjectID(req.params.idgame), "teams.players.userid" : sess.userid}).forEach(function(doc) {
                    for (t = 0; t < doc.teams.length; t++) {
                        var new_players = [];

                        for (p = 0; p < doc.teams[t].players.length; p++) {
                            if (doc.teams[t].players[p].userid != sess.userid)
                                new_players.push(doc.teams[t].players[p]);
                        }

                        let teamt = {};
                        teamt["teams." + t + ".players"] = new_players;
                        db.collection(GAMES_COLLECTION).updateOne({ _id : new ObjectID( req.params.idgame ) }, { $set : teamt }, undefined, function(err, doc) {
                            if (err) {
                                handleError(res, err.message, "Failed to exit player");
                            } else {
                                res.status(204).end();
                            }
                        });
                    }
                });
            }
            else{
                console.log("fail");
                res.sendFile( views + '/player/login.html');
            }
        })
        .post('/data/player/checkgame', function(req,res) {
            sess = req.session;
            if(sess.username && (sess.type == "player")
                && (req.body.idgame !== undefined) && (req.body.idgame.trim() != "")
                && (req.body.accesskey !== undefined) && (req.body.accesskey.trim() != "")) {

                console.log('Player: Check game');
                db.collection(GAMES_COLLECTION).find({_id: new ObjectID(req.body.idgame), accesskey: req.body.accesskey}).toArray(function(err, docs) {
                    if (err) {
                        handleError(res, err.message, "Failed to check game.");
                    } else {
                        if (docs.length > 0) {
                            sess.idGameChecked = req.body.idgame;
                            res.status(200).json({});
                        }
                        else
                            res.status(200).json({ result: "Wrong access key" });
                    }
                });
            }
            else{
                console.log("fail");
                res.sendFile( views + '/player/login.html');
            }
        })
        .get('/data/player/teams/:idgame', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "player"){
                console.log('Player: Select teams');
                db.collection(GAMES_COLLECTION).find({ _id: new ObjectID(req.params.idgame) }).toArray(function(err, docs) {
                    if (err) {
                        handleError(res, err.message, "Failed to get contacts.");
                    } else {
                        if ((docs.length > 0) && (docs[0].teams !== undefined))
                            res.status(200).json({ name: docs[0].name, teams: docs[0].teams });
                        else
                            res.status(200).json({});
                    }
                });
            }
            else{
                console.log("fail");
                res.sendFile( views + '/player/login.html');
            }
        })
        .post('/data/player/teams', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "player"){
                console.log('Player: Add teams');
                db.collection(GAMES_COLLECTION).find({ _id: new ObjectID(req.body.idgame), "teams.name" : req.body.teamname }).toArray(function(err, docs) {
                    if (err) {
                        handleError(res, err.message, "Failed to get team.");
                    } else {
                        if (docs.length > 0)
                            res.status(200).json({ result: "Team already exists" });
                        else {
                            db.collection(GAMES_COLLECTION).updateOne({ _id : new ObjectID( req.body.idgame ) }, { $push : {teams: { name: req.body.teamname, accesskey: req.body.accesskey, players: [ { userid: sess.userid, name: sess.username } ]} } }, undefined, function(err, doc) {
                                if (err) {
                                    handleError(res, err.message, "Failed to add team");
                                } else {
                                    res.status(201).json({});
                                }
                            });
                        }
                    }
                });
            }
            else{
                console.log("fail");
                res.sendFile( views + '/player/login.html');
            }
        })
        .post('/data/player/check-team', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "player"){
                console.log('Player: Check team');
                db.collection(GAMES_COLLECTION).find({ _id: new ObjectID(req.body.idgame), "teams.name" : req.body.teamname, "teams.accesskey": req.body.accesskey }).toArray(function(err, docs) {
                    if (err) {
                        handleError(res, err.message, "Failed to get team.");
                    } else {
                        if (docs.length > 0) {
                            for (t = 0; t < docs[0].teams.length; t++) {
                                if (docs[0].teams[t].name == req.body.teamname) {
                                    var new_players = [];

                                    for (p = 0; p < docs[0].teams[t].players.length; p++)
                                        new_players.push(docs[0].teams[t].players[p]);

                                    new_players.push({ userid: sess.userid, name: sess.username });

                                    let teamt = {};
                                    teamt["teams." + t + ".players"] = new_players;
                                    db.collection(GAMES_COLLECTION).updateOne({ _id : new ObjectID( req.body.idgame ) }, { $set : teamt }, undefined, function(err, doc) {
                                        if (err) {
                                            handleError(res, err.message, "Failed to add player");
                                        } else {
                                            res.status(201).json({});
                                        }
                                    });
                                }
                            }
                        }
                        else {
                            res.status(200).json({ result: "Wrong access key" });
                        }
                    }
                });
            }
            else{
                console.log("fail");
                res.sendFile( views + '/player/login.html');
            }
        })
        .get('/data/player/infos-user/:idgame', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "player"){
                console.log('Player: user info');
                db.collection(GAMES_COLLECTION).find({ _id: new ObjectID(req.params.idgame), "teams.players.userid": sess.userid }).toArray(function(err, docs) {
                    if (err) {
                        handleError(res, err.message, "Failed to get user info.");
                    } else {
                        if ((docs.length > 0) && (docs[0].teams !== undefined)) {
                            for (t = 0; t < docs[0].teams.length; t++) {
                                var new_players = [];

                                for (p = 0; p < docs[0].teams[t].players.length; p++) {
                                    if (docs[0].teams[t].players[p].userid == sess.userid) {
                                        //new_players.push(docs[0].teams[t].players[p]);
                                        res.status(200).json({ gamename: docs[0].name, username: sess.username, teamname: docs[0].teams[t].name, team_accesskey: docs[0].teams[t].accesskey });
                                    }
                                }
                            }
                        }
                        else {
                            console.log("fail");
                            res.sendFile( views + '/player/login.html');
                        }
                    }
                });
            }
            else{
                console.log("fail");
                res.sendFile( views + '/player/login.html');
            }
        })
        .get('/data/player/current-step/:idgame', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "player"){
                console.log('Player: Get current step with consumed clues');


                //TODO: Remove

//        currentStep = {
//            "name": "Step #1",
//            "explanation": "Goto BU...",
//            "move": true,
//            "coordonates" : {
//                "latitude" : 43.760854,
//                "longitude" : 7.202076
//            }
//        };

                currentStep = {
                    "name": "Step #2",
                    "type" : 2,
                    "explanation": "Tu dois faire quelque chose !...",
                    "move": false
                };

                res.status(200).json(currentStep);

            }
            else{
                console.log("fail");
                res.sendFile( views + '/player/login.html');
            }
        })
        .put('/data/player/send-answer', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "player"){
                console.log('Player: Send an answer for validation');

            }
            else{
                console.log("fail");
                res.sendFile( views + '/player/login.html');
            }
        })
        .put('/data/player/endpoint-reached', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "player"){
                console.log('Player: Send an answer for validation');

            }
            else{
                console.log("fail");
                res.sendFile( views + '/player/login.html');
            }
        })
        .get('/data/player/consume-clue', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "player"){
                console.log('Player: Consume a clue');

            }
            else{
                console.log("fail");
                res.sendFile( views + '/player/login.html');
            }
        })

}