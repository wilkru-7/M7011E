const express = require('express')
var gaussian = require('gaussian');
var request = require('request');
const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);
client.connect();
const database = client.db('M7011E');
const users = database.collection('Users');

const app = express()
const port = 3004


var productionDistribution = gaussian(2, 1);

app.get('/startUser/:user', (req, res) => {
    var username = req.params['user']
    var newUser = new Producer(username)
    setInterval(updateProduction, 1000, newUser)
    res.json("ok");
})

app.get('/getUser/:user', (req, res) => {
    var user = req.params['user']
    if (user != "undefined") {
        getUserProduction(user).then(production => {
            res.send(production + "");
        })
    }
})

app.get('/', (req, res) => {
    res.json("Production Service");
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

class Producer {
    constructor(username) {
        this.username = username
        this.production = 0
    }
}

function updateProduction(producer) {
    var windSpeed;
    request('http://localhost:3001/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        windSpeed = res.body;
        var random = productionDistribution.ppf(Math.random())
        if (random < 0) {
            random = 0;
        }
        producer.production = (windSpeed * random).toFixed(2);
    });

    insertProduction(producer.username, producer.production)
}

async function insertProduction(_username, value) {
    const filter = { username: _username };
    const options = { upsert: true };
    const updateDoc = {
        $set: {
            production: parseFloat(value)
        },
    };
    const result = await users.updateOne(filter, updateDoc, options);
    return result;
}
async function getUserProduction(_username) {
    const search = { username: _username };
    var user = await users.findOne(search)
    if (user) {
        console.log("user.production: " + user.production)
        return user.production
    }
}