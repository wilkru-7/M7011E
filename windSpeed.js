var gaussian = require('gaussian');
const express = require('express')

var distribution = gaussian(4, 2);
var windSpeed = 0;
var x = distribution.ppf(Math.random());
var lol = gaussian(x, 2);

const app = express()
const port = 3001

update();
setInterval(update, 5000);

app.get('/', (req, res) => {
    res.json(getWindSpeed());
    /* res.send(getWindSpeed().toString()); */
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

function getWindSpeed() {
    return windSpeed;
};

function update() {
    windSpeed = lol.ppf(Math.random()).toFixed(2).toString();
};

