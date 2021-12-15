const express = require('express')

const app = express()
const port = 3005

var buffer = 0;
//update();

app.get('/', (req, res) => {
    res.json(getBuffer());
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

function getBuffer() {
    return buffer;
}
