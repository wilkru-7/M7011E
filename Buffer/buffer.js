var request = require('request');
const express = require('express')
const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);

client.connect();
const database = client.db('M7011E');
const users = database.collection('Users');

const app = express()
const port = 3005

app.get('/', (req, res) => {
    res.json(getBuffer());
})
app.get('/startUser/:username', (req, res) => {
    username = req.params['username']
    var newUser = new Buffer(username)
    console.log("newUser " + newUser.username)
    setInterval(updateBuffer, 1000, newUser.username)
    res.json("New User Started: " + newUser.username);
})

app.get('/addToBuffer/:username/:amount', (req, res) => {
    username = req.params['username']
    amount = parseFloat(req.params['amount'])
    addToBuffer(username, amount)
    res.json("ok");
})

app.get('/getFromBuffer/:username/:amount', (req, res) => {
    username = req.params['username']
    amount = parseFloat(req.params['amount'])
    getBuffer(username).then(buffer => {
        if (amount > buffer) {
            addToBuffer(username, -buffer)
            //Rest should be bought from market...
        }
        addToBuffer(username, -amount)
        res.json("ok");
    })
})
app.get('/getBuffer/:username/', (req, res) => {
    username = req.params['username']
    getBuffer(username).then(buffer => {
        res.send(buffer + "");
    })
})
app.get('/getNetProduction/:username/', (req, res) => {
    username = req.params['username']
    console.log("username: " + username)
    getNetProduction(username).then(result => {
        res.send(result + "");
    })
})
app.get('/setRatio/:number/:username/:value', (req, res) => {
    number = parseFloat(req.params['number'])
    username = req.params['username']
    value = parseFloat(req.params['value'])
    setRatio(number, username, value)
    res.json("ok");
})

app.get('/getRatio/:number/:username', (req, res) => {
    number = parseFloat(req.params['number'])
    username = req.params['username']
    getRatio(number, username).then(ratio => {
        res.send(ratio + "");
    })
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

async function sendToMarket(amount) {
    request('http://localhost:3006/sellToMarket/' + amount, { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
    })
}
async function buyFromMarket(amount) {
    request('http://localhost:3006/buyFromMarket/' + amount, { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
    })
}
/* async function setBufferForUser(username, amount) {
    request('http://localhost:3005/addToBuffer/' + username + "/" + amount, { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
    })
} */

async function addToBuffer(_username, amount) {
    const filter = { username: _username };
    const options = { upsert: true };
    const updateDoc = {
        $set: {
            buffer: parseFloat(amount)
        },
    };
    const result = await users.updateOne(filter, updateDoc, options);
    return result;
}

async function getRatio(number, _username) {
    const search = { username: _username };
    var user = await users.findOne(search)
    if (user) {
        if (parseFloat(number) == 1) {
            return user.ratio1;
        } else {
            return user.ratio2;
        }
    }
}

async function setRatio(number, _username, value) {
    const filter = { username: _username };
    const options = { upsert: true };
    if (parseFloat(number) == 1) {
        var updateDoc = {
            $set: {
                ratio1: parseFloat(value)
            },
        };
    } else {
        var updateDoc = {
            $set: {
                ratio2: parseFloat(value)
            },
        };
    }
    const result = await users.updateOne(filter, updateDoc, options);
    return result;
}

async function getBuffer(_username) {
    const search = { username: _username };
    var user = await users.findOne(search)
    if (user) {
        return user.buffer;
    }
}
async function updateBuffer(username) {
    var buffer;
    var netProduction = await getNetProduction(username)
    if (netProduction) {
        console.log("B4: " + username)
        var bufferTemp = await getBuffer(username)
        console.log("bufferTemp: " + bufferTemp)
        if (!isNaN(netProduction) && bufferTemp != undefined) {
            //Over-Production
            if (netProduction >= 0) {
                var ratio1 = parseFloat(await getRatio(1, username))
                console.log("ratio1: " + ratio1)
                var toBuffer = parseFloat(ratio1 * netProduction)
                console.log("toBuffer: " + toBuffer)
                var toMarket = parseFloat(netProduction - toBuffer)
                console.log("toMarket: " + toMarket)
                buffer = parseFloat(bufferTemp) + toBuffer
                console.log("buffer: " + buffer)
                sendToMarket(toMarket);
                setMarketDemand(username, 0)
            }
            //In case of excessive production, Prosumer should be 
            //able to control the ratio of how much should be 
            //sold to the market and how much should be sent to 
            //the buffer
            else {
                var ratio2 = parseFloat(await getRatio(2, username))
                console.log("ratio2: " + ratio2)
                var fromBuffer = parseFloat(ratio2 * netProduction)
                console.log("fromBuffer: " + fromBuffer)
                var fromMarket = parseFloat(netProduction - fromBuffer)
                console.log("fromMarket: " + fromMarket)
                buffer = parseFloat(bufferTemp) + fromBuffer
                if (buffer < 0) {
                    fromMarket = parseFloat(netProduction - fromBuffer - buffer)
                    buffer = 0
                }
                console.log("buffer: " + buffer)
                buyFromMarket(fromMarket)
                setMarketDemand(username, fromMarket)
            }
            console.log("buffer is: " + buffer)
            addToBuffer(username, buffer.toFixed(2))
            return buffer.toFixed(2);
        } else {
            return 0;
        }
    }
}

async function getNetProduction(username) {
    console.log("Username22: " + username)
    /*     var consumption = await getConsumption(username);
    
        consumption = parseFloat(consumption)
        console.log("Consumption: " + consumption)
        var production = await getProduction(username);
    
        production = parseFloat(production)
        console.log("production:" + production)
        var netProduction;
        if (!isNaN(production - consumption)) {
            netProduction = (production - consumption).toFixed(2);
            console.log("netProduction:" + netProduction)
        }
        return netProduction; */
    const netProduction = await new Promise(function (resolve, reject) {
        request('http://localhost:3003/getNetProduction/' + username, { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            //netProduction = res.body;
            console.log("netProduction: " + res.body)
            resolve(res.body)
        })
    });

    return netProduction;

}

async function getConsumption(username) {
    if (username != undefined) {
        console.log("Username: " + username)
        var consumption;
        request('http://localhost:3000/getUser/' + username, { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            consumption = res.body;
        })
        return consumption;
    }
}

async function getProduction(username) {
    var production;
    request('http://localhost:3004/getUser/' + username, { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        production = res.body;
    });
    return production;
}

async function setMarketDemand(_username, demand) {
    const filter = { username: _username };
    const options = { upsert: true };
    const updateDoc = {
        $set: {
            market: demand
        },
    };
    const result = await users.updateOne(filter, updateDoc, options);
    return result;
}

class Buffer {
    constructor(username) {
        this.username = username;
        this.buffer = 0;
    }
}