var express = require('express');
const { MongoClient } = require("mongodb");
const uri = "mongodb://mongodb:27017/";
const client = new MongoClient(uri);
client.connect();
const database = client.db('M7011E');
const market = database.collection('Market');
const users = database.collection('Users');

const app = express()
const port = 3006
var isOn, power;

startPowerplant();

async function setStatus(_status) {
    var status;
    if (_status) {
        status = "Starting"
        const filter = {};
        const options = { upsert: true };
        var updateDoc = {
            $set: {
                status: status
            },
        };
        const result = await market.updateOne(filter, updateDoc, options);
        await new Promise(resolve => setTimeout(resolve, 5000));
        status = "Running"
    } else {
        status = "Stopped"
    }
    isOn = _status

    const filter = {};
    const options = { upsert: true };
    var updateDoc = {
        $set: {
            status: status
        },
    };
    const result = await market.updateOne(filter, updateDoc, options);
    return result;
}

async function getStatus() {
    var status = await market.findOne()
    if (status) {
        return status.status
    }
}

function startPowerplant() {
    setStatus(true)
    setRatio(0.5)
    updatePower()
    setInterval(updateDemand, 1000)
}

async function updateDemand() {
    var getUsers = await findUsers()
    var amount = 0;
    getUsers.forEach(element => {
        if (element.role == 'prosumer') {
            amount += parseFloat(element.market)
        }
    })
    updateMarketDemand(amount.toFixed(2))
}

async function updatePower() {
    if (isOn) {
        power = 40000;
        var ratio = await getRatio()
        updateBuffer(power * parseFloat(ratio))
    }
    setTimeout(updatePower, 1000)
}

app.get('/', (req, res) => {
    if (isOn) {
        res.send(power + "")
    } else {
        res.send("0")
    }
})

app.get('/status', (req, res) => {
    getStatus().then(result => {
        res.send(result + "");
    })
})

app.get('/test', (req, res) => {
    getMarket()
    getStatus().then(result => {
        res.send(result + "");
    })
})

app.get('/start', (req, res) => {
    setStatus(true)
})

app.get('/stop', (req, res) => {
    setStatus(false)
})

app.get('/getBuffer', (req, res) => {
    getBuffer().then(result => {
        res.send(result + "");
    })
})

/* Maybe send to db? */
app.get('/sellToMarket/:amount', (req, res) => {
    amount = parseFloat(req.params['amount'])
    if (amount > 0) {
        addToMarket(amount)
        res.send("ok")
    }
    else {
        res.send("not ok")
    }
})

app.get('/buyFromMarket/:amount', (req, res) => {
    amount = req.params['amount']
    if (amount > 0) {
        getMarket().then(result => {
            if (amount > result) {
                getStatus().then(status => {
                    if (status) {
                        removeFromMarket(result)
                    } else {
                        removeFromBuffer(result)
                    }
                })
                res.send("empty")
            }
            else {
                getStatus().then(status => {
                    if (status) {
                        removeFromMarket(amount)
                    } else {
                        removeFromBuffer(amount)
                    }
                })
                res.send("0")
            }
        })
    }
    else {
        res.send("not ok")
    }
})

app.get('/setRatio/:value', (req, res) => {
    value = parseFloat(req.params['value'])
    setRatio(value)
    res.json("ok");
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

async function updateMarketDemand(amount) {
    const filter = {};
    const options = { upsert: true };
    const updateDoc = {
        $set: {
            MarketDemand: amount
        },
    };
    const result = await market.updateOne(filter, updateDoc, options);
    return result;
}

async function addToMarket(demand) {
    const filter = {};
    const options = { upsert: true };
    const updateDoc = {
        $inc: {
            Market: demand
        },
    };
    const result = await market.updateOne(filter, updateDoc, options);
    return result;
}

async function removeFromMarket(demand) {
    const filter = {};
    const options = { upsert: true };
    const updateDoc = {
        $inc: {
            Market: -demand
        },
    };
    const result = await market.updateOne(filter, updateDoc, options);
    return result;
}


async function removeFromBuffer(amount) {
    const filter = {};
    const options = { upsert: true };
    const updateDoc = {
        $inc: {
            buffer: -amount
        },
    };
    const result = await market.updateOne(filter, updateDoc, options);
    return result;
}

async function getMarket() {
    result = await market.findOne()
    return result.Market;
}

async function getBuffer() {
    result = await market.findOne()
    return result.buffer;
}


async function updateBuffer(amount) {
    const filter = {};
    const options = { upsert: true };
    var updateDoc = {
        $inc: {
            buffer: parseFloat(amount)
        },
    };
    const result = await market.updateOne(filter, updateDoc, options);
    return result;
}

async function getRatio() {
    var ratio = await market.findOne()
    if (ratio) {
        return ratio.ratio
    }
}

async function setRatio(value) {
    const filter = {};
    const options = { upsert: true };
    var updateDoc = {
        $set: {
            ratio: parseFloat(value)
        },
    };
    const result = await market.updateOne(filter, updateDoc, options);
    return result;
}

async function findUsers() {
    result = await users.find().toArray();
    return result;
}