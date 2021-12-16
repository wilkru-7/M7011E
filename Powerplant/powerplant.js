var express = require('express');
const app = express()
const port = 3006
var isOn, buffer, power = 0;

startPowerplant();

function setStatus(status) {
    isOn = status
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
    res.send(isOn + "")
})

app.get('/start', (req, res) => {
    setStatus(true)
})

app.get('/stop', (req, res) => {
    setStatus(false)
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})