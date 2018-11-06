/*
*
*
*       FILL IN EACH ROUTE BELOW COMPLETELY
*       
*       
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;

module.exports = function (app) {

  app.route('/api/books')
    .get(function (req, res){
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        expect(err, 'database error').to.not.exist;
        var collection = db.collection('books');
        collection.find().toArray(function(err, result) {
          expect(err, 'database find error').to.not.exist;
          expect(result).to.exist;
          expect(result).to.be.a('array');
          for(var i=0;i<result.length;i++) {
            result[i].commentcount = result[i].comments.length;
            delete result[i].comments;
          }
          res.json(result);
        });
      });
    })
    .post(function (req, res){
      var title = req.body.title;
      if(!title) {
        res.send('missing title');
      } else {
        expect(title, 'posted title').to.be.a('string');
        MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
          expect(err, 'database error').to.not.exist;
          var collection = db.collection('books');
          var doc = {title:title, comments:[]};
          collection.insert(doc, {w:1}, function(err, result) {
            expect(err, 'database insert error').to.not.exist;
            res.json(result.ops[0]);
          });
        });
      }
    })
    .delete(function(req, res){
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        expect(err, 'database error').to.not.exist;
        var collection = db.collection('books');
        collection.remove();
        res.send("complete delete successful");
      });
    });
    
  app.route('/api/books/:id')
    .get(function (req, res){
      var bookid = req.params.id;
      //expect(bookid).to.have.lengthOf(24);
      var oid = new ObjectId(bookid); //Must convert to mongo object id to search by it in db
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        expect(err, 'database error').to.not.exist;
        var collection = db.collection('books');
        collection.find({_id:oid}).toArray(function(err, result) {
          expect(err, 'database find error').to.not.exist;
          if(result.length === 0) {
            res.send('no book exists');
          } else {
            res.json(result[0]);
          }
        });
      });
      //format: {"bookid": bookid, "title": book_title, "comments": [comment,comment,...]}
    })
    .post(function(req, res){
      var bookid = req.params.id;
      var oid = new ObjectId(bookid); //Must convert to mongo object id to search by it in db
      var comment = req.body.comment;
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        expect(err, 'database error').to.not.exist;
        var collection = db.collection('books');
        collection.findAndModify(
          {_id: oid},
          {},
          {$push: { comments: comment }},
          {new: true, upsert: false},
          function(err, result){
            expect(err, 'database findAndModify error').to.not.exist;
            res.json(result.value);
          });
      });
    })
    .delete(function(req, res){
      var bookid = req.params.id;
      var oid = new ObjectId(bookid); //Must convert to mongo object id to search by it in db
      MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {
        expect(err, 'database error').to.not.exist;
        var collection = db.collection('books');
        collection.findOneAndDelete({_id:oid}, function(err, result) {
          expect(err, 'database findOneAndDelete error').to.not.exist;
          expect(result, 'result error').to.exist;
          res.send("delete successful");
        });
      });
    });
  
};
