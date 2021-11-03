const fetch = require('node-fetch');
//import fetch from 'node-fetch';
var express = require('express');
const app = express()
const port = 3002

app.get('/', (req, res) => {
    fetch('localhost:3001')
        .then(response => response.json())
        .then(data => console.log(data));
    res.send("data");
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})