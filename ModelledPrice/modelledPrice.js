const request = require('request');
const { MongoClient } = require("mongodb");
const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);
client.connect();
const database = client.db('M7011E');
const market = database.collection('Market');
var express = require('express');
const app = express()
const port = 3002

app.get('/', (req, res) => {
    getWindSpeed().then(windSpeed => {
        getMarketDemand().then(marketDemand => {
            var price = 2 * parseFloat(marketDemand) - parseFloat(windSpeed);
            console.log("wind: " + windSpeed + " marketDemand: " + marketDemand)
            if (price < 0) {
                res.send("0");
            } else {
                res.send(price.toFixed(2));
            }
        })
    })
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

async function getWindSpeed() {
    const windSpeed = await new Promise(function (resolve, reject) {
        request('http://localhost:3001/', { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            resolve(res.body)
        })
    });
    return windSpeed;
}

async function getMarketDemand() {
    result = await market.findOne()
    if(result) {
        return result.MarketDemand;
    }
}