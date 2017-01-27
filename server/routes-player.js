var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

module.exports = function(app, sess, views, connect, db, handleError, STEPS_COLLECTION, GAMES_COLLECTION, USERS_COLLECTION, CLUES_COLLECTION){

    app
        .get('/player/login', function(req,res) {
            console.log("get login");
            sess = req.session;
            if(sess.username)
                res.sendFile(views + '/player/select-game.html');
            else
                res.sendFile( views + '/player/login.html');
        })
        .post('/player/login', function(req,res) {
            connect(req,res,'/player/select-game.html', 'player');
        })
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
        .get('/player/select-team/:idgame/:accesskey', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "player"){
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
                db.collection(GAMES_COLLECTION).find({"teams.players.userid" : sess.userid}).toArray(function(err, docs) {
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
                let filter = { "teams.players.userid":  { $ne: sess.userid } };

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
                //db.collection(GAMES_COLLECTION).findById({ new ObjectID(req.params.idgame) }, { $pull : { "teams.$.players" : { "userid" : sess.userid } }}, function(err, result) {
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
        .post('/data/player/teams', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "player"){
                console.log('Player: add a team');

            }
            else{
                console.log("fail");
                res.sendFile( views + '/player/login.html');
            }
        })
        .get('/data/player/check-team/:idteam/:accesskey', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "player"){
                console.log('Player: check access key to a team');

            }
            else{
                console.log("fail");
                res.sendFile( views + '/player/login.html');
            }
        })
        .get('/data/player/infos-user', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "player"){
                console.log('Player: get user infos');

            }
            else{
                console.log("fail");
                res.sendFile( views + '/player/login.html');
            }
        })
        .get('/data/player/current-step', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "player"){
                console.log('Player: Get current step with consumed clues');

            }
            else{
                console.log("fail");
                res.sendFile( views + '/player/login.html');
            }
        })
        .get('/data/player/send-answer', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "player"){
                console.log('Player: Send an answer for validation');

            }
            else{
                console.log("fail");
                res.sendFile( views + '/player/login.html');
            }
        })
        .get('/data/player/back-to-last-move', function(req,res) {
            sess = req.session;
            if(sess.username && sess.type == "player"){
                console.log('Player: Back to last move step');

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