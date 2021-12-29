var express = require('express');
const app = express()
const port = 3006
var isOn, buffer, power, market = 0, status;

startPowerplant();

async function setStatus(_status) {
    if(_status){
        status = "Starting"
        await new Promise(resolve => setTimeout(resolve, 5000));
        status = "Running"
    } else {
        status = "Stopped"
    }
    isOn = _status
}
function startPowerplant() {
    setStatus(true)
    updatePower()
}
function updatePower() {
    if (isOn) {
        power = 400000;
    }
    setTimeout(updatePower, 1000)
}
app.get('/', (req, res) => {
    if (isOn) {
        res.send(power + "")
    } else {
        res.send("0")
    }
})

app.get('/status', (req, res) => {
    res.send(status + "")
})

app.get('/start', (req, res) => {
    setStatus(true)
})

app.get('/stop', (req, res) => {
    setStatus(false)
})
/* Maybe send to db? */
app.get('/sellToMarket/:amount', (req, res) => {
    amount = parseFloat(req.params['amount'])
    if (amount > 0) {
        market += amount
    }
    console.log("Current market is: " + market);
    //res.send("req.params")
})
app.get('/buyFromMarket/:amount', (req, res) => {
    amount = req.params['amount']
    market -= amount
    //res.send("req.params")
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})