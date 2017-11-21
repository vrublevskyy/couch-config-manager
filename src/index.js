'use strict';

const PouchDB = require('pouchdb');
PouchDB.plugin(require('pouchdb-adapter-memory'));
const LocalDB = new PouchDB('conf',{adapter:'memory'});


module.exports = (uri, auth) => {

  return new Promise((resolve, reject) => {

    const ajaxOpts = {
      ajax: {
        headers: {
          Authorization: 'Basic ' + Buffer.from(auth.user + ':' + auth.pass).toString('base64')
        },
        body: {
          name: auth.user,
          password: auth.pass
        }
      }
    };

    var db = new PouchDB(uri, ajaxOpts);
    LocalDB.sync(db, {
      live: true,
      retry: true
    }).on('change', function (change) {

      //console.log("Received change event");
    }).on('paused', function (info) {

      // replication was paused, usually because of a lost connection
      console.log("Replication paused");
    }).on('active', function (info) {

      console.log("Replication resumed");
      // replication was resumed
    }).on('error', function (err) {

      // totally unhandled error (shouldn't happen)
      console.log("Replication error");
      throw new Error('Couchdb replication error');
    });

    const getConfigById = (id) => {

      return LocalDB.get(id);
    }

    LocalDB.replicate.from(db)
      .on('complete', function (info) {
        resolve({
          getConfigById
        })
      }).on('denied', function (err) {
        reject(err);
      }).on('error', function (err) {
        reject(err);
      });

  });
};
