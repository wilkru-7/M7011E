const express = require('express')
var gaussian = require('gaussian');

const app = express()
const port = 3000

var consumption = 0;
var consumptionDistribution = gaussian(11, 3);
update();

app.get('/', (req, res) => {
    res.json(getConsumption());
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

function getConsumption() {
    return consumption;
}
function update() {
    consumption = consumptionDistribution.ppf(Math.random()).toFixed(2);
};

setInterval(update, 5000);
