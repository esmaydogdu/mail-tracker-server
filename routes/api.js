const express = require("express");
const router = express.Router();
const geoip = require("geoip-lite");
const parser = require("ua-parser-js");
const Datastore = require("nedb");
const db = new Datastore({ filename: "db", autoload: true });
const { getRandomString } = require("../utils/random-string");


/* GET home page. */
router.get("/", (req, res) => {
  const key = getRandomString(5);
  db.insert({ key, views: [] }, (err) => {
    if (!err) {
      res.json({
        key,
      });
    }
    else {
      res.json({
        message: 'could not get the key'
      })
    }
  });
});

//the only response is the image
router.get("/track/:key", (req, res) => {
  const key = req.params.key;
  const ua = parser(req.headers["user-agent"]);
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let location = {};
  if (ip != "::1") {
    location = geoip.lookup(ip);
  } else {
    location = { city: "localhost" };
  }
  console.log(ip);
  db.findOne({key}, (err, doc) => {
    if(!err && doc){
      const views = doc.views
      views.push({date: Date.now(), location, ua})
      db.update(
        { key },
        { $set: { views } },
        { multi: true },
        (err, numReplaced) => {
        }
      );
    }
  })
  res.sendfile("public/0.png");
});

router.get('/check/:key', (req, res) => {
  const key = req.params.key;
  db.findOne({key}, (err, doc) => {
    if(!err){
      res.json(doc)
    }
  })
}) 

module.exports = router;

//produce a random key on te get request
//put that key on the screen form db with a link
