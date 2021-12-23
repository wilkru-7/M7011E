//const fetch = require('node-fetch');
//const fetch = require("node-fetch");
//import fetch from "node-fetch";
//import fetch from 'node-fetch';
//var $ = require("jquery");
const request = require('request');
var express = require('express');
const app = express()
const port = 3007
var price = 0;

app.use(express.urlencoded({
    extended: true
}))
app.get('/', (req, res) => {
    res.send(price + "");
})

app.get('/setPrice/:price', (req, res) => {
    price = req.params['price']
    //res.send("req.params")
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})