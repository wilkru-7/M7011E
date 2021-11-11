var gaussian = require('gaussian');
const express = require('express')

var distributionYear = gaussian(4, 2);
var windSpeed = 0;
var meanDay = distributionYear.ppf(Math.random());
var distributionDay = gaussian(meanDay, 2);

const app = express()
const port = 3001

updatePerHour();
setInterval(updatePerHour, 5000);
setInterval(updatePerDay, 5000 * 24);
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

function updatePerHour() {
    windSpeed = distributionDay.ppf(Math.random()).toFixed(2);
};

function updatePerDay() {
    meanDay = distributionYear.ppf(Math.random());
}
