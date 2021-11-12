const request = require('request');
var express = require('express');
var path = require('path');
var ejs = require('ejs');
const app = express()
const port = 3003
var price, windspeed, consumption;

app.set('view engine', 'ejs');
app.get('/', (req, res) => {
    
    request('http://localhost:3002/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        price = res.body;
    });
    request('http://localhost:3001/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        windspeed = res.body;
    });
    request('http://localhost:3000/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        consumption = res.body;
    });

    res.render('index', {price: price, windspeed: windspeed, consumption: consumption})
    // res.sendFile(path.join(__dirname, '/index.html'));
})

app.get('/login', (req, res) => {
    res.render('login', {})
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})