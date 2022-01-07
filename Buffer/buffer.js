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

var intervals = new Map()

app.get('/', (req, res) => {
    res.json(getBuffer());
})
app.get('/startUser/:username', (req, res) => {
    username = req.params['username']
    var newUser = new Buffer(username)
    console.log("newUser " + newUser.username)
    var interval = setInterval(updateBuffer, 1000, newUser.username)
    intervals.set(newUser.username, interval)

    res.json("interval:" + interval)
    //res.json("New User Started: " + newUser.username);
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
    var result
    request('http://localhost:3006/buyFromMarket/' + amount, { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        result = res.body
    })
    return result
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
    if (await getUserRole(username) == "manager") {
        var buffer;
        var bufferTemp = await getBuffer(username)
        var production = await getPowerPlantProduction()
        var ratio = await getRatio(1, username)
        var toBuffer = parseFloat(ratio) * parseFloat(production)
        var toMarket = parseFloat(production) - toBuffer
        buffer = parseFloat(bufferTemp) + toBuffer
        addToBuffer(username, buffer.toFixed(2))
        sellToMarket(toMarket)
        return buffer.toFixed(2);
    } else {
        if (await isUserDeleted(username) == true) {
            clearInterval(intervals.get(username))
            await deleteUser(username)
            return
        }
        var buffer;
        var netProduction = await getNetProduction(username)
        if (netProduction) {
            var bufferTemp = await getBuffer(username)
            if (!isNaN(netProduction) && bufferTemp != undefined) {
                //Over-Production
                if (netProduction >= 0) {
                    var ratio1 = parseFloat(await getRatio(1, username))
                    var toBuffer = parseFloat(ratio1 * netProduction)
                    var toMarket = parseFloat(netProduction - toBuffer)
                    buffer = parseFloat(bufferTemp) + toBuffer
                    if (! await userIsBlocked(username)) {
                        sendToMarket(toMarket);
                    } else {
                        buffer = netProduction
                    }
                    setMarketDemand(username, 0)
                }
                //In case of excessive production, Prosumer should be 
                //able to control the ratio of how much should be 
                //sold to the market and how much should be sent to 
                //the buffer
                else {
                    var ratio2 = parseFloat(await getRatio(2, username))
                    var fromBuffer = parseFloat(ratio2 * netProduction)
                    var fromMarket = -parseFloat(netProduction - fromBuffer)
                    buffer = parseFloat(bufferTemp) + fromBuffer
                    if (buffer < 0) {
                        fromMarket = -parseFloat(netProduction - fromBuffer - buffer)
                        buffer = 0
                    }
                    var result = buyFromMarket(fromMarket)
                    if (result == "empty") {

                        setUserBlackOut(username, true)
                    }
                    else {
                        setUserBlackOut(username, false)
                    }
                    setMarketDemand(username, fromMarket)
                }
                addToBuffer(username, buffer.toFixed(2))
                return buffer.toFixed(2);
            } else {
                return 0;
            }
        }
    }
}

async function deleteUser(_username) {
    const search = { username: _username };
    await users.deleteOne(search);
}

async function getNetProduction(username) {
    const netProduction = await new Promise(function (resolve, reject) {
        request('http://localhost:3003/getNetProduction/' + username, { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            resolve(res.body)
        })
    });
    return netProduction;
}

async function sellToMarket(amount) {
    const market = await new Promise(function (resolve, reject) {
        request('http://localhost:3006/sellToMarket/' + amount, { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            resolve(res.body)
        })
    });
    return market;
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

async function getPowerPlantProduction() {
    const production = await new Promise(function (resolve, reject) {
        request('http://localhost:3006/', { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            resolve(res.body)
        })
    });
    return production;
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

async function getUserRole(_username) {
    const search = { username: _username };
    var user = await users.findOne(search)
    if (user) {
        return user.role
    }
}

async function userIsBlocked(_username) {
    const search = { username: _username };
    var user = await users.findOne(search)
    if (user) {
        return user.blocked
    }
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

async function setUserBlackOut(_username, check) {
    const filter = { username: _username };
    const options = { upsert: true };
    const updateDoc = {
        $set: {
            blackedOut: check
        },
    };
    const result = await users.updateOne(filter, updateDoc, options);
    return result;
}

class Buffer {
    constructor(username) {
        this.username = username;
        this.buffer = 0;
        this.active = true;
    }
}