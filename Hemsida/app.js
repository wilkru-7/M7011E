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
var modelledPrice, price, windspeed, consumption, production, netProduction, ratio1 = 0.5, ratio2 = 0.5, buffer, users, power, isOn;

const { MongoClient } = require("mongodb");

const uri = "mongodb://83.209.178.176:27017/M7011E";
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
// app.get('/getData', (req, res) => {
//     getWindspeed()
//     res.send(windspeed);
// })
app.get('/getWindspeed', (req, res) => {
    getWindspeed()
    res.send(windspeed);
})
app.get('/getModelledPrice', (req, res) => {
    getModelledPrice()
    res.send(modelledPrice);
})
// app.get('/getPrice', (req, res) => {
//     getPrice()
//     res.send(price);
// })
app.get('/getConsumption', (req, res) => {
    getConsumption()
    res.send(consumption);
})
app.get('/getProduction', (req, res) => {
    getProduction()
    res.send(production);
})
app.get('/getNetProduction', (req, res) => {
    getNetProduction()
    res.send(netProduction + "");
})
app.get('/getBuffer', (req, res) => {
    getBuffer(req.session.username).then(result => {
        res.send(buffer + "");
    })
})
app.get('/getUsers', (req, res) => {
    findUsers().then(result => {
        res.send(result)
    })
})
app.get('/getPowerplant', (req, res) => {
    getPower();
    res.send(power + "")
})
app.get('/getPrice', (req, res) => {
    getPrice().then(result => {
        res.send(result + "")
    });
    //res.send(price + "")
})
app.get('/', (req, res) => {
    if (req.session.loggedin) {
        console.log(req.session.loggedin)
        if (req.session.role == "manager") {
            res.redirect('admin')
        } else {
            res.render('index')
        }
    } else {
        res.redirect("login")
    }
})
app.get('/getStatus', (req, res) => {
    getStatus().then(result => {
        res.send(result + "")
    });
    //res.send(isOn + "")
})

app.post('/login', (req, res) => {
    /* TODO:
        Check input so no hacking */
    var username = req.body.username;
    var password = req.body.password;
    /* TODO:
        Catch and no input should return false */
    login(username, password).catch(console.dir).then(result => {
        if (result != "") {
            req.session.loggedin = true;
            req.session.role = result;
            req.session.username = username;
            loginDB(username)
            res.redirect('/')
        }
        else {
            res.redirect('login')
        }
    })
})
app.post('/redirectregister', (req, res) => {
    res.redirect('/register')
})
app.post('/redirectlogin', (req, res) => {
    res.redirect('/login')
})
app.get('/logout', (req, res) => {
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
    request('http://modelledprice:3002/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        modelledPrice = res.body;
    });

    request('http://windspeed:3001/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        windspeed = res.body;
    });
    request('http://consumption:3000/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        consumption = res.body;
    });

    request('http://producer:3004/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        production = res.body;
    });
    /*     request('http://localhost:3002/', { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            modelledPrice = res.body;
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
        }); */

    netProduction = (consumption - production).toFixed(2)

    buffer += netProduction;

    findUsers().then(value => {
        res.render('admin', {
            users: value, modelledPrice: modelledPrice, windspeed: windspeed, consumption: consumption, production: production, netProduction: netProduction
        })
    });
})
app.post('/delete', (req, res) => {
    var username = req.body.username;
    deleteUser(username);
})
app.post('/register', (req, res) => {
    var username = req.body.registerUsername;
    var password = req.body.registerPassword;
    var password2 = req.body.registerPassword2;

    search(username).then(exists => {
        if (exists && password == password2) {
            insert(username, password)
            res.redirect('/login')
        } else {
            console.log("Something was entered wrong")
            res.redirect('/register')
        }
    })
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

app.post('/sendToBuffer', (req, res) => {
    ratio1 = req.body.sendToBuffer / 100
})

app.post('/useFromBuffer', (req, res) => {
    ratio2 = req.body.useFromBuffer / 100
})

app.post('/setPrice', (req, res) => {
    request('http://price:3007/setPrice/' + req.body.setPrice, { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
    });
    /*     request('http://localhost:3007/setPrice/' + req.body.setPrice, { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
        }); */
    price = req.body.setPrice
})

app.post('/switch', (req, res) => {
    console.log("req.body.switch :" + req.body.switch)
    if (req.body.switch == "on") {
        request('http://powerplant:3006/start/', { json: true }, (err, res, body) => {
            if (err) {
                return console.log(err);
            }
        });
        /*         request('http://localhost:3006/start/', { json: true }, (err, res, body) => {
                    if (err) {
                        return console.log(err);
                    }
                }); */
        /*         request('http://localhost:3006/start/', { json: true }, (err, res, body) => {
                    if (err) {
                        return console.log(err);
                    }
                }); */
    } else {
        request('http://powerplant:3006/stop/', { json: true }, (err, res, body) => {
            if (err) {
                return console.log(err);
            }
        });
        /*         request('http://localhost:3006/stop/', { json: true }, (err, res, body) => {
                    if (err) {
                        return console.log(err);
                    }
                }); */
    }
    // request('http://localhost:3006/setPrice/' + req.body.setPrice, { json: true }, (err, res, body) => {
    //     if (err) { return console.log(err); }
    // });
    // price = req.body.setPrice
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

async function insert(_username, _password) {
    try {
        await client.connect();
        const database = client.db('M7011E');
        const users = database.collection('Users');
        const insert = { username: _username, password: _password, buffer: 0, role: "prosumer" };
        const result = await users.insertOne(insert);
    } finally {
        await client.close();
    }
}

async function getWindspeed() {
    request('http://windspeed:3001/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        windspeed = res.body;
    });
    /*     request('http://localhost:3001/', { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            windspeed = res.body;
        }); */
    return windspeed;
}
async function getConsumption() {
    request('http://consumption:3000/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        consumption = res.body;
    })
    /*     request('http://localhost:3000/', { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            consumption = res.body;
        }) */
    return consumption;
}
async function getProduction() {
    request('http://producer:3004/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        production = res.body;
    });
    /*     request('http://localhost:3004/', { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            production = res.body;
        }); */
    return production;
}
async function getModelledPrice() {
    request('http://modelledprice:3002/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        modelledPrice = res.body;
    })
    /*     request('http://localhost:3002/', { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            modelledPrice = res.body;
        }) */
    return modelledPrice;
}
async function getPrice() {
    request('http://price:3007/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        price = res.body;
    })
    /*     request('http://localhost:3007/', { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            price = res.body;
        }) */
    return price;
}
async function getPower() {
    request('http://powerplant:3006/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        power = res.body;
    })
    /*     request('http://localhost:3006/', { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            power = res.body;
        }) */
    return power;
}

async function getStatus() {
    request('http://powerplant:3006/status', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        isOn = res.body;
        console.log("isOn: " + isOn)
    })
    /*     request('http://localhost:3006/status', { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            isOn = res.body;
            console.log("isOn: " + isOn)
        }) */
    if (isOn) {
        return "running";
    } else {
        return "stopped";
    }
}

async function getNetProduction() {
    consumption = await getConsumption();
    console.log("Consumption: " + consumption)
    production = await getProduction();
    console.log("production:" + production)
    netProduction = (production - consumption).toFixed(2);
    console.log("netProduction:" + netProduction)
    return netProduction;
}

async function getBuffer(username) {
    getNetProduction().then(netProduction => {
        getBufferForUser(username).then(bufferTemp => {
            if (!isNaN(netProduction) && bufferTemp != undefined) {
                buffer = (parseFloat(bufferTemp) + parseFloat(ratio1 * netProduction)).toFixed(2)
                console.log("IN BUFFER:")
                console.log("bufferTemp: " + bufferTemp)
                console.log("netProduction: " + netProduction)
                console.log("buffer: " + typeof buffer)
                setBufferForUser(username, buffer)
                return buffer;
            } else {
                return 0;
            }
        })
    })
}

async function login(_username, _password) {
    try {
        await client.connect();
        const database = client.db('M7011E');
        const users = database.collection('Users');
        const search = { username: _username };
        const result = await users.findOne(search);
        var response;
        if (result != null && _password == result.password) {
            console.log("You are logged in")
            response = true
        } else {
            console.log("Wrong password (or wrong username)!!!")
            response = false
        }
        return response
    } finally {
        await client.close();
    }
}

async function search(_username) {
    try {
        await client.connect();
        const database = client.db('M7011E');
        const users = database.collection('Users');
        const search = { username: _username };
        const result = await users.findOne(search);
        if (result == null) {
            return true
        } else {
            return false
        }
    } finally {
        await client.close();
    }
}
async function loginDB(_username) {
    try {
        await client.connect();
        const database = client.db('M7011E');
        const users = database.collection('Users');
        const filter = { username: _username };
        const options = { upsert: true };
        const updateDoc = {
            $set: {
                status: "Online"
            },
        };
        const result = await users.updateOne(filter, updateDoc, options);
        return result;
    } finally {
        await client.close();
    }
}
async function logoutDB(_username) {
    try {
        await client.connect();
        const database = client.db('M7011E');
        const users = database.collection('Users');
        const filter = { username: _username };
        const options = { upsert: true };
        const updateDoc = {
            $set: {
                status: "Offline"
            },
        };
        const result = await users.updateOne(filter, updateDoc, options);
        return result;
    } finally {
        await client.close();
    }
}
async function findUsers() {
    try {
        await client.connect();
        const database = client.db('M7011E');
        const users = database.collection('Users');
        result = await users.find().toArray();
        return result;
    } finally {
        await client.close();
    }
}
async function getBufferForUser(_username) {
    try {
        await client.connect();
        const database = client.db('M7011E');
        const users = database.collection('Users');
        const search = { username: _username };
        // await users.findOne(search).then(user => {
        //     console.log("user.buffer: " + user.buffer)
        //     return user.buffer;
        // });
        var user = await users.findOne(search)
        console.log("user.buffer: " + user.buffer)
        return user.buffer;
    } finally {
        await client.close();
    }
}
async function setBufferForUser(_username, buffer) {
    try {
        await client.connect();
        const database = client.db('M7011E');
        const users = database.collection('Users');
        const filter = { username: _username };
        const options = { upsert: true };
        const updateDoc = {
            $set: {
                buffer: buffer
            },
        };
        const result = await users.updateOne(filter, updateDoc, options);
        return result;
    } finally {
        await client.close();
    }
}
async function deleteUser(_username) {
    try {
        await client.connect();
        const database = client.db('M7011E');
        const users = database.collection('Users');
        const search = { username: _username };
        await users.deleteOne(search);
    } finally {
        await client.close();
    }
}