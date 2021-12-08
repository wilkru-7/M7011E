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
app.get('/', (req, res) => {
    res.json(price.toFixed(2));
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})