/* var gaussian = require('gaussian'); */
const express = require('express')
var request = require('request');

const app = express()
const port = 3004
var production;
var windSpeed;
app.get('/start', (req, res) => {
    createNewProducer()
})
app.get('/', (req, res) => {
    
    /* res.json(getWindSpeed()); */
    request('http://localhost:3001/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        windSpeed = res.body;
        console.log(res.body);
    });
/*     request('http://localhost:3001/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        windSpeed = res.body;
        console.log(res.body);
    }); */
    production = windSpeed * 2;
    res.json(production.toFixed(2));
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

function createNewProducer(user){


}
class Producer{
    constructor(user) {
        this.user = user;
    }
    production;
}