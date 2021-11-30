var request = require('request');
var express = require('express');
var path = require('path');
var ejs = require('ejs');
var $ = require('jquery')
var bodyParser = require('body-parser');
var session = require('express-session');
const fileUpload = require('express-fileupload');

const app = express()
const port = 3003
var price, windspeed, consumption, production, netProduction, ratio, buffer, users;

const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));

app.use(express.urlencoded({
    extended: true
  }))

app.use(
  fileUpload()
);

app.use(express.static('public'));

/* TODO:
  Change secret to something(?)  */
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.set('view engine', 'ejs');

app.get('/test', (req, res) => {
    res.render("test")
})
app.get('/getWindspeed', (req, res) => {
    getWindspeed()
    res.send(windspeed);
})
app.get('/getPrice', (req, res) => {
    getPrice()
    res.send(price);
})
app.get('/getConsumption', (req, res) => {
    getConsumption()
    res.send(consumption);
})
app.get('/getProduction', (req, res) => {
    getProduction()
    res.send(production);
})
app.get('/', (req, res) => {
    if(req.session.loggedin){
    console.log(req.session.loggedin)
  
 /*    netProduction = (consumption - production).toFixed(2)

    buffer += netProduction; */

    res.render('index')
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
    login(username, password).catch(console.dir).then(result => {
        console.log("Result is: ", result)
        if(result == true){
            req.session.loggedin = true;
            req.session.username = username;
            loginDB(username)
            res.redirect('/')
        }
        else{
            res.redirect('login')
        }
    })
    /* console.log("Loggedin is: ", loggedin)
    if(loggedin == true){
        req.session.loggedin = true;
        res.redirect('/')
    }
    else{
        res.redirect('login')
    } */
    //console.log(username)
})
app.post('/redirectregister', (req,res) => {
    res.redirect('/register')
})
app.post('/redirectlogin', (req,res) => {
    res.redirect('/login')
})
app.get('/logout', (req,res) => {
    req.session.loggedin = false
    logoutDB(req.session.username)
    res.redirect('/login')
})
app.get('/login', (req, res) => {
    res.render('login', {})
})
app.get('/register', (req, res) => {
    res.render('register', {})
})
app.get('/admin', (req, res) => {
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

    request('http://localhost:3004/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        production = res.body;
    });

    netProduction = (consumption - production).toFixed(2)

    buffer += netProduction;
    console.log("users is: ", users)
    findUsers().then(value => { 
        console.log(value)
        res.render('admin', {users: value, price: price, windspeed: windspeed, consumption: consumption, production: production, netProduction: netProduction
        })
});
    //res.render('admin', {users: users, price: price, windspeed: windspeed, consumption: consumption, production: production, netProduction: netProduction})
})
app.post('/delete', (req,res) => {
    var username = req.body.username;
    deleteUser(username);
})
app.post('/register', (req, res) => {
    var username = req.body.registerUsername;
    var password = req.body.registerPassword;
    var password2 = req.body.registerPassword2;

    search(username).then(exists => {
        if(exists && password==password2){
            insert(username, password)
            res.redirect('/login')
        } else{
            console.log("Something was entered wrong")
            res.redirect('/register')
        }
    })


    //res.render('register', {})
})

app.post('/imageupload', (req, res) => {
    console.log(req.files.filename);
    if (!req.files) {
        return res.status(400).send("No files were uploaded.");
    }
    const file = req.files.filename;
    const path = __dirname + "/files/" + file.name;

    file.mv(path, (err) => {
        if (err) {
            return res.status(500).send(err);
        }
            return res.send({ status: "success", path: path });
    });
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

async function insert(_username, _password){
    try{
        await client.connect();
        const database = client.db('M7011E');
        const users = database.collection('Users');
        const insert = { username: _username, password: _password };
        const result =  await users.insertOne(insert);
    } finally{
        await client.close();
    }

}

async function getWindspeed(){
    request('http://localhost:3001/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        windspeed = res.body;
    });
    return windspeed;
}
async function getConsumption(){
    request('http://localhost:3000/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        consumption = res.body;
    })
    return consumption;
}
async function getProduction(){
    request('http://localhost:3004/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        production = res.body;
    }); 
    return production;
}
async function getPrice(){
    request('http://localhost:3002/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        price = res.body;
    })
    return price;
}
/* async function bufferUpdate(){
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
} */

async function login(_username, _password){
    try{
        await client.connect();
        const database = client.db('M7011E');
        const users = database.collection('Users');
        const search = { username: _username};
        const result =  await users.findOne(search);
        var response;
        if(result != null && _password == result.password){
            console.log("You are logged in")
            response = true
        } else{
            console.log("Wrong password (or wrong username)!!!")
            response = false
        }
        return response
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
        if(result == null){
            return true
        }else{
            return false
        }
    } finally{
        await client.close();
    }
}
async function loginDB(_username){
    try{
        await client.connect();
        const database = client.db('M7011E');
        const users = database.collection('Users');
        const filter = { username : _username };
        const options = { upsert: true };
        const updateDoc = {
            $set: {
              status: "Online"
            },
          };
        const result = await users.updateOne(filter, updateDoc, options);
        return result;
    } finally{
        await client.close();
    }
}
async function logoutDB(_username){
    try{
        await client.connect();
        const database = client.db('M7011E');
        const users = database.collection('Users');
        const filter = { username : _username };
        const options = { upsert: true };
        const updateDoc = {
            $set: {
              status: "Offline"
            },
          };
        const result = await users.updateOne(filter, updateDoc, options);
        return result;
    } finally{
        await client.close();
    }
}
async function findUsers(){
    try{
        await client.connect();
        const database = client.db('M7011E');
        const users = database.collection('Users');
        result = await users.find().toArray();
        return result;
    } finally{
        await client.close();
    }
}

async function deleteUser(_username){
    try{
        await client.connect();
        const database = client.db('M7011E');
        const users = database.collection('Users');
        const search = {username: _username};
        await users.deleteOne(search);
    } finally{
        await client.close();
    }
}