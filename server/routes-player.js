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
        .get('/player/select-game.html?:idGame', function(req,res) {
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
                db.collection(GAMES_COLLECTION).find({}).toArray(function(err, docs) {
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
        .get('/data/player/games-not', function(req,res) {

        });

}