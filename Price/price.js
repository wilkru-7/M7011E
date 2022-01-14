const { MongoClient } = require("mongodb");
const uri = "mongodb://mongodb:27017/";
const client = new MongoClient(uri);
client.connect();
const database = client.db('M7011E');
const market = database.collection('Market');

const request = require('request');
var express = require('express');
const app = express()
const port = 3007

app.use(express.urlencoded({
    extended: true
}))
app.get('/', (req, res) => {
    getPrice().then(result => {
        if (result != undefined) {
            res.send(result + "");
        } else {
            res.send("0")
        }
    })
})

app.get('/setPrice/:price', (req, res) => {
    var price = req.params['price']
    insertPrice(price)
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

async function insertPrice(value) {
    const filter = {};
    const options = { upsert: true };
    const updateDoc = {
        $set: {
            price: value
        },
    };
    const result = await market.updateOne(filter, updateDoc, options);
    return result;
}

async function getPrice() {
    result = await market.findOne()
    return result.price;
}
