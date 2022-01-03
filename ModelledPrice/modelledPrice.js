//const fetch = require('node-fetch');
//const fetch = require("node-fetch");
//import fetch from "node-fetch";
//import fetch from 'node-fetch';
//var $ = require("jquery");
const request = require('request');
var express = require('express');
const app = express()
const port = 3002
var windSpeed;
var consumption;
var price;
app.get('/', (req, res) => {

    request('http://localhost:3001/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        windSpeed = res.body;
        console.log(res.body);
    });
    /* request('http://localhost:3001/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        windSpeed = res.body;
        console.log(res.body);
    }); */
    request('http://localhost:3000/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        consumption = res.body;
        console.log(res.body);
    });
    /* request('http://localhost:3000/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        consumption = res.body;
        console.log(res.body);
    }); */
    price = consumption - windSpeed;
    if (price < 0) {
        price = 0
    }

    res.json(price.toFixed(2));
    // res.send("Windspeed is: " + windSpeed + " Consumption is: " + consumption + " And price is: " + price);
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})