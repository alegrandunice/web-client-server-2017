var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/buffa';


//Inserer un document objectif

var insertDocument = function(db, callback) {
   db.collection('objectifs').insertOne( 
   {
    "id" : "19",
    "name": "objectif16",
    "type" : "question",
    "explanation": "explication16",
    "move" : "False",
    "localization" : {
    		"country" : "France",
    		"region" : "Cote d'azure",
    		"city" : "Sophia-Antipolis"
    		},
    "previous_step" : "0",
    "coordonates" : {    
		"latitude" : "1",
                "longitude" : "1"
   		},
  "coordonatesFrom" : {    
	        "latitude" : "0",
                "longitude" : "0"
               },
   "media" : 
    [ 
	{
	        "type" : "photo",
	        " url" : "url1"
	},
	{
	        "type" : "photo",
	        " url" : "url1"
	}
   ],
   "total_points" : "178",
   "clues" : 
    [
        {
           "description" : "clue1",
          " cost" : "1"
        },
        {
           "description" : "clue2",
          " cost" : "1"
        }
    ]
}, function(err, result) {
    assert.equal(err, null);
    console.log("Inserted a document into the restaurants collection.");
    callback();
  });
};

// Read all document in the objectifs collection

var findObjectifs = function(db, callback) {
   var cursor =db.collection('objectifs').find( );
   cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null) {
         console.dir(doc);
      } else {
         callback();
      }
   });
};



// trouver les document en se basant sur un champ de premier niveau en specifiant une condition d'égalité

var findSpecificObjectifs = function(db, callback) {
   var cursor =db.collection('objectifs').find( { "id" : "19" } );
   cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null) {
         console.dir(doc);
      } else {
         callback();
      }
   });
};


// trouver les document qui contiennent un champ embarqué et un champ dans un tableau en specifiant

var findMoreSpecificObjectifs = function(db, callback) {
   var cursor =db.collection('objectifs').find( { "media.type": "photo", "localization.country" : "Maroc" } );
   cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null) {
         console.dir(doc);
      } else {
         callback();
      }
   });
};



// mettre a jour un champ de deux documents

var updateObjectifs = function(db, callback) {
   db.collection('objectifs').updateMany(
      { "id" : "19"  , "localization.country" : " France" },
      { $set: { "localization.country" : "Maroc" } },
      function(err, results) {
        console.log(results);
	console.log(err);
        callback();
   });
};



// mettre a jour un objectif complet ou le remplacer

var updateDocumentObjectifs = function(db, callback) {
   db.collection('objectifs').replaceOne(
      { "id" : "10" },
      {
    "id" : "19",
    "name": "objectif16",
    "type" : "question",
    "explanation": "explication16",
    "move" : "true",
    "localization" : {
    		"country" : "France",
    		"region" : "Cote d'azure",
    		"city" : "Sophia-Antipolis"
    		},
    "previous_step" : "0",
    "coordonates" : {    
		"latitude" : "1",
                "longitude" : "1"
   		},
  "coordonatesFrom" : {    
	        "latitude" : "0",
                "longitude" : "0"
               },
   "media" : 
    [ 
	{
	        "type" : "photo",
	        " url" : "url1"
	},
	{
	        "type" : "photo",
	        " url" : "url1"
	}
   ],
   "total_points" : "178",
   "clues" : 
    [
        {
           "description" : "clue1",
          " cost" : "1"
        },
        {
           "description" : "clue2",
          " cost" : "1"
        }
    ]
},
      function(err, results) {
        console.log(results);
        callback();
   });
};


// supprimer tous les documents qui verifient une condition 

var removeObjetifs = function(db, callback) {
   db.collection('objectifs').deleteMany(
      { "id": "1" },
      function(err, results) {
         console.log(results);
         callback();
      }
   );
};

// supprimer un seul document objectif qui verifie une condition

var removeOneObjetifs = function(db, callback) {
   db.collection('objectifs').deleteOne(
      { "move" : "False" },
      function(err, results) {
         console.log(results);
	//console.log(err);
         callback();
      }
   );
};


// connection a la base de donnée et execution de chacune des methodes

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected correctly to server.");
  assert.equal(null, err);
  insertDocument(db, function() {
	console.log("End of instert Document.");
        assert.equal(null, err);
        findObjectifs(db, function() {
	   console.log("End of findObjectifs.");
      	   assert.equal(null, err);
	   findSpecificObjectifs(db, function() {
	      console.log("End of findSpecificObjectifs.");
      	      assert.equal(null, err);
  	      findMoreSpecificObjectifs(db, function() {
      	         console.log("End of findMoreSpecificObjectifs.");
	         assert.equal(null, err);
  	         updateObjectifs(db, function() {
      	           console.log("End of updateObjectifs.");
	           assert.equal(null, err);
  	           updateDocumentObjectifs(db, function() {
      	              console.log("End of updateDocumentObjectifs.");
	              assert.equal(null, err);
  	              removeObjetifs(db, function() {
      	                  console.log("End of removeObjetifs.");
	                  db.close();
			  assert.equal(null, err);
  	                  removeOneObjetifs(db, function() {
      	                     console.log("End of removeOneObjetifs.");
	                     db.close();
				 });                     
			 });
		 });
	      });
	   });
        });
     });
  });
});
