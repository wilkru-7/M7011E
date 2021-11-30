/* var gaussian = require('gaussian'); */
const express = require('express')
var request = require('request');

const app = express()
const port = 3004
var price;
app.get('/', (req, res) => {
    
    /* res.json(getWindSpeed()); */
    request('http://localhost:3001/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        price = res.body;
    }); 
    res.send(price);
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
