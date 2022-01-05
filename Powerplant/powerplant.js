var express = require('express');
const { MongoClient } = require("mongodb");
const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);
client.connect();
const database = client.db('M7011E');
const market = database.collection('Market');

const app = express()
const port = 3006
var isOn, buffer, power, status;

startPowerplant();

async function setStatus(_status) {
    if (_status) {
        status = "Starting"
        await new Promise(resolve => setTimeout(resolve, 5000));
        status = "Running"
    } else {
        status = "Stopped"
    }
    isOn = _status
}
function startPowerplant() {
    setStatus(true)
    updatePower()
}
function updatePower() {
    if (isOn) {
        power = 400000;
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
    res.send(status + "")
})
app.get('/test', (req, res) => {
    getMarket()
    res.send(status + "")
})

app.get('/start', (req, res) => {
    setStatus(true)
})

app.get('/stop', (req, res) => {
    setStatus(false)
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
            console.log("result is: " + result)
            if (amount > result) {
                removeFromMarket(result)
            }
            else {
                removeFromMarket(amount)
            }
        })

        res.send("ok")
    }
    else {
        res.send("not ok")
    }

})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

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
async function getMarket() {
    result = await market.findOne()
    return result.Market;
}