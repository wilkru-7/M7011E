const express = require('express')
var gaussian = require('gaussian');
/* const Influx = require('influxdb-nodejs');

const client = new Influx('http://127.0.0.1:8086/'); */

const { MongoClient } = require("mongodb");
const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);
client.connect();
const database = client.db('M7011E');
const users = database.collection('Users');

const app = express()
const port = 3000

var intervals = new Map()

var consumption = 0;
var consumptionDistribution = gaussian(11, 3);

app.get('/', (req, res) => {
    res.json("Consumption Service");
})

app.get('/startUser/:user', (req, res) => {
    var user = req.params['user']
    var newUser = new Consumer(user)
    console.log("newUser " + newUser.username)
    var interval = setInterval(updateConsumption, 1000, newUser)
    intervals.set(newUser.username, interval)
    res.json("ok");
})

app.get('/getUser/:user', (req, res) => {
    var user = req.params['user']
    getUserConsumption(user).then(consumption => {
        console.log("getting: " + consumption)
        res.send(consumption);
    })

})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

function getConsumption() {
    return consumption;
}

class Consumer {
    constructor(username) {
        this.username = username
        this.consumption = 0
        this.consuming = true;
    }
}

async function updateConsumption(consumer) {
    if (await isUserDeleted(consumer.username) == true) {
        console.log("Deleting: " + consumer.username)
        clearInterval(intervals.get(consumer.username))
        deleteUser(consumer.username)
        return
    }
    consumer.consumption = consumptionDistribution.ppf(Math.random()).toFixed(2);
    insertConsumption(consumer.username, consumer.consumption)
}
function updateConsumptionTest() {
    return consumptionDistribution.ppf(Math.random()).toFixed(2);
}

module.exports = updateConsumptionTest;

async function insertConsumption(_username, value) {
    const filter = { username: _username };
    const options = { upsert: true };
    const updateDoc = {
        $set: {
            consumption: value
        },
    };
    const result = await users.updateOne(filter, updateDoc, options);
    return result;
}
async function getUserConsumption(_username) {
    const search = { username: _username };
    var user = await users.findOne(search)
    if (user) {
        return user.consumption
    }
}

async function isUserDeleted(_username) {
    const search = { username: _username };
    const options = { $exists: false }
    /* const result = await users.findOne(search, options); */
    const result = await users.findOne({
        $and: [
            { 'role': { $exists: false } },
            { 'username': _username }
        ]
    })
    if (result) {
        return true
    } return false
}

async function deleteUser(_username) {
    const search = { username: _username };
    await users.deleteOne(search);
}