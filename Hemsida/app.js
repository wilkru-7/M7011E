var request = require('request');
var express = require('express');
var path = require('path');
var ejs = require('ejs');
var $ = require('jquery')
var fs = require('fs');

var bcrypt = require('bcrypt');
const saltRounds = 10;

var bodyParser = require('body-parser');
var session = require('express-session');
const fileUpload = require('express-fileupload');

const app = express()
const port = 3003
var modelledPrice, price, windspeed, consumption, production, netProduction, ratio1 = 0.5, ratio2 = 0.5, buffer, power, isOn;

const { MongoClient } = require("mongodb");
const { syncBuiltinESMExports } = require('module');

const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);

client.connect();
const database = client.db('M7011E');
const users = database.collection('Users');

app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));

app.use(express.urlencoded({
    extended: true
}))

app.use(
    fileUpload()
);

app.use(express.static('public'));
app.use(express.static('public/images'));

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
    getWindspeed().then(res.send(windspeed))
    //res.send(windspeed);
})
app.get('/getModelledPrice', (req, res) => {
    getModelledPrice().then(res.send(modelledPrice))
    //res.send(modelledPrice);
})
// app.get('/getPrice', (req, res) => {
//     getPrice()
//     res.send(price);
// })
app.get('/getConsumption', (req, res) => {
    getConsumption().then(res.send(consumption))
    //res.send(consumption);
})
app.get('/getProduction', (req, res) => {
    getProduction().then(res.send(production))
    //res.send(production);
})
app.get('/getNetProduction', (req, res) => {
    getNetProduction().then(res.send(netProduction + ""))
    //res.send(netProduction + "");
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
    getPower().then(res.send(power + ""));
    //res.send(power + "")
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
    login(username).then(result => {
        bcrypt.compare(password, result.password, function (err, response) {
            if (err) {
                // handle error
            }
            if (response) {
                // Send JWT
                req.session.loggedin = true;
                console.log("result: " + result.role)
                req.session.role = result.role;
                req.session.username = username;
                res.redirect('/')
            } else {
                res.redirect('login')
            }
        });
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
    if (req.session.role == "manager") {
        res.render('admin')
    } else {
        res.redirect('/')
    }
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
        });
    
        netProduction = (consumption - production).toFixed(2)
    
        buffer += netProduction; */

    /* findUsers().then(value => {
        res.render('admin', {
            users: value, modelledPrice: modelledPrice, windspeed: windspeed, consumption: consumption, production: production, netProduction: netProduction
        })
    }); */
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
            bcrypt.hash(password, saltRounds, (err, hash) => {
                // Now we can store the password hash in db.
                insert(username, hash)
                res.redirect('/login')
            });
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

    insertImg(req.session.username, file).then(() => {
        //return res.send({ status: "success", path: path });
        res.redirect('/')
    })
})
app.get('/getImg', (req, res) => {
    console.log("1")
    getImg(req.session.username).then(imgPath => {
        console.log("imgPath: " + imgPath)
        res.send(imgPath)
        /*         const path = __dirname + "/files/" + img.name;
                img.mv(path, (err) => {
                    console.log("3")
                    if (err) {
                        return res.status(500).send(err);
                    }
                }); */
        /*         return img */
    })


})

app.post('/sendToBuffer', (req, res) => {
    ratio1 = req.body.sendToBuffer / 100
})

app.post('/useFromBuffer', (req, res) => {
    ratio2 = req.body.useFromBuffer / 100
})

app.post('/setPrice', (req, res) => {
    request('http://localhost:3007/setPrice/' + req.body.setPrice, { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
    });
    price = req.body.setPrice
})

app.post('/switch', (req, res) => {
    console.log("req.body.switch :" + req.body.switch)
    if (req.body.switch == "on") {
        request('http://localhost:3006/start/', { json: true }, (err, res, body) => {
            if (err) {
                return console.log(err);
            }
        });
    } else {
        request('http://localhost:3006/stop/', { json: true }, (err, res, body) => {
            if (err) {
                return console.log(err);
            }
        });
    }
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

async function insert(_username, _password) {
    const insert = { username: _username, password: _password, buffer: 0, role: "prosumer" };
    const result = await users.insertOne(insert);
}

async function getWindspeed() {
    request('http://localhost:3001/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        windspeed = res.body;
    });
    return windspeed;
}

async function getConsumption() {
    request('http://localhost:3000/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        consumption = res.body;
    })
    return consumption;
}
async function getProduction() {
    request('http://localhost:3004/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        production = res.body;
    });
    return production;
}
async function getModelledPrice() {
    request('http://localhost:3002/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        modelledPrice = res.body;
    })
    return modelledPrice;
}
async function getPrice() {
    request('http://localhost:3007/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        price = res.body;
    })
    return price;
}
async function getPower() {
    request('http://localhost:3006/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        power = res.body;
    })
    return power;
}

async function getStatus() {
    request('http://localhost:3006/status', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        isOn = res.body;
        console.log("isOn: " + isOn)
    })
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
                //Over-Production
                if (netProduction >= 0) {
                    var toBuffer = parseFloat(ratio1 * netProduction)
                    var toMarket = netProduction - toBuffer
                    buffer = (parseFloat(bufferTemp) + toBuffer).toFixed(2)
                }
                //In case of excessive production, Prosumer should be 
                //able to control the ratio of how much should be 
                //sold to the market and how much should be sent to 
                //the buffer
                else {
                    var fromBuffer = parseFloat(ratio2 * netProduction)
                    var toMarket = netProduction - fromBuffer
                    buffer = (parseFloat(bufferTemp) + fromBuffer).toFixed(2)
                }
                setBufferForUser(username, buffer)
                sendToMarket(toMarket);
                return buffer;
            } else {
                return 0;
            }
        })
    })
}
async function sendToMarket(toMarket) {
    request('http://localhost:3006/sellToMarket/' + toMarket, { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
    })
}

async function login(_username) {
    const search = { username: _username };
    const result = await users.findOne(search);
    return result
}

async function search(_username) {
    const search = { username: _username };
    const result = await users.findOne(search);
    if (result == null) {
        return true
    } else {
        return false
    }
}
async function loginDB(_username) {
    const filter = { username: _username };
    const options = { upsert: true };
    const updateDoc = {
        $set: {
            status: "Online"
        },
    };
    const result = await users.updateOne(filter, updateDoc, options);
    return result;
}
async function logoutDB(_username) {
    const filter = { username: _username };
    const options = { upsert: true };
    const updateDoc = {
        $set: {
            status: "Offline"
        },
    };
    const result = await users.updateOne(filter, updateDoc, options);
    return result;
}
async function findUsers() {
    result = await users.find().toArray();
    return result;
}
async function getBufferForUser(_username) {
    const search = { username: _username };
    var user = await users.findOne(search)
    console.log("user.buffer: " + user.buffer)
    return user.buffer;
}
async function setBufferForUser(_username, buffer) {
    const filter = { username: _username };
    const options = { upsert: true };
    const updateDoc = {
        $set: {
            buffer: buffer
        },
    };
    const result = await users.updateOne(filter, updateDoc, options);
    return result;
}

async function deleteUser(_username) {
    const search = { username: _username };
    await users.deleteOne(search);
}

async function insertImg(_username, file) {
    const filter = { username: _username };
    const options = { upsert: true };
    const updateDoc = {
        $set: {
            img: file
        },
    };
    const result = await users.updateOne(filter, updateDoc, options);
    return result;
}

async function getImg(_username) {
    const search = { username: _username };
    var user = await users.findOne(search)

    if (user.img) {
        var path = __dirname + "/public/images/" + user.img.name;
        var path2 = "images/" + user.img.name;
        const buffer = Buffer.from(user.img.data.toString('base64'), 'base64');
        fs.writeFile(path.toString(), buffer, err => {
            if (err) {
                console.log(err)
            }
        })
        return path2;
    }
}
