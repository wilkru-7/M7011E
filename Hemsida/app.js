var request = require('request');
var express = require('express');
var path = require('path');
var ejs = require('ejs');
var bodyParser = require('body-parser');
var session = require('express-session');

const app = express()
const port = 3003
var price, windspeed, consumption;

const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

app.use(express.urlencoded({
    extended: true
  }))

/* TODO:
  Change secret to something(?) */
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.get('/', (req, res) => {
    if(req.session.loggedin){
    request('http://localhost:3002/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        price = res.body;
    }); 
    
    request('http://localhost:3001/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        windspeed = res.body;
    });
    request('http://localhost:3000/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        consumption = res.body;
    });

    res.render('index', {price: price, windspeed: windspeed, consumption: consumption})
    }else{
        res.redirect("login")
    }
})
app.post('/login', (req,res) => {
    /* TODO:
        Check input so no hacking */
    var username = req.body.username;
    var password = req.body.password;
    /* TODO:
        Catch and no input should return false */
    var loggedin = login(username, password).catch(console.dir)
    if(loggedin){
        req.session.loggedin = true;
        res.redirect('/')
    }
    //console.log(username)
})
app.post('/redirectregister', (req,res) => {
    res.redirect('/register')
})
app.post('/redirectlogin', (req,res) => {
    res.redirect('/login')
})
app.get('/login', (req, res) => {
    res.render('login', {})
})
app.get('/register', (req, res) => {
    res.render('register', {})
})
app.post('/register', (req, res) => {
    var username = req.body.registerUsername;
    var password = req.body.registerPassword;
    var password2 = req.body.registerPassword2;
    console.log(username)
    console.log(password)
    console.log(password2)

    var exists = search(username)
    console.log(exists)
    if(exists && password==password2){
        insert(username, password)
        res.redirect('/login')
    } else{
        console.log("Something was entered wrong")
    }
    //res.render('register', {})
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

async function insert(_username, _password){
    try{
        await client.connect();
        console.log(1)
        const database = client.db('M7011E');
        console.log(2)
        const users = database.collection('Users');
        console.log(3)
        const insert = { username: _username, password: _password };
        console.log(4)
        const result =  await users.insertOne(insert);
        console.log(5)
        console.log(result)
    } finally{
        await client.close();
    }

}

async function login(_username, _password){
    try{
        await client.connect();
        const database = client.db('M7011E');
        const users = database.collection('Users');
        const search = { username: _username};
        const result =  await users.findOne(search);
        if(result != null && _password == result.password){
            console.log("You are logged in")
            return true
        } else{
            console.log("Wrong password (or wrong username)!!!")
            return false
        }
    } finally{
        await client.close();
    }
}

async function search(_username){
    try{
        await client.connect();
        const database = client.db('M7011E');
        const users = database.collection('Users');
        const search = {username: _username};
        const result =  await users.findOne(search);
        console.log(result)
        if(result == null){
            return true
        }else{
            return false
        }
    } finally{
        await client.close();
    }
}