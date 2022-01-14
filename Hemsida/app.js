var request = require('request');
var express = require('express');
var path = require('path');
var ejs = require('ejs');
var $ = require('jquery');
var fs = require('fs');
var jwt = require('jsonwebtoken');

var bcrypt = require('bcrypt');
const saltRounds = 10;

var session = require('express-session');
const fileUpload = require('express-fileupload');

const app = express()
const port = 3003

const dotenv = require('dotenv');
dotenv.config()

function generateAccessToken(username) {
    return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: '1800s' });
}

var price, windspeed, consumption, production, netProduction, power, isOn;

const { MongoClient } = require("mongodb");

const uri = "mongodb://mongodb:27017/";
const client = new MongoClient(uri);

client.connect();
const database = client.db('M7011E');
const users = database.collection('Users');
const market = database.collection('Market')

//Create admin on deployment
search("admin").then(dontExists => {
    if (dontExists) {
        bcrypt.hash("hej", saltRounds, (err, hash) => {
            insert("admin", hash, true)
        })
    }
})

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

app.get('/getWindspeed', (req, res) => {
    getWindspeed().then(res.send(windspeed + ""))
})

app.get('/getModelledPrice', (req, res) => {
    getModelledPrice().then(result => {
        res.send(result + "");
    })
})

app.get('/getConsumption', (req, res) => {
    getConsumption(req.session.username).then(res.send(consumption + ""))
})

app.get('/getProduction', (req, res) => {
    getProduction(req.session.username).then(res.send(production + ""))
})

app.get('/getNetProduction', (req, res) => {
    getNetProduction(req.session.username).then(res.send(netProduction + ""))
})

app.get('/getNetProduction/:username', (req, res) => {
    var username = req.params['username']
    getNetProduction(username).then(res.send(netProduction + ""))
})

app.get('/getBuffer', (req, res) => {
    getBuffer(req.session.username).then(result => {
        res.send(result + "");
    })
})

app.get('/getBufferManager', (req, res) => {
    getBufferManager().then(result => {
        res.send(result + "");
    })
})

app.get('/getUsers', (req, res) => {
    findUsers().then(result => {
        res.send(result)
    })
})

app.get('/getRatio', (req, res) => {
    getRatio().then(result => {
        res.send(result + "")
    })
})

app.get('/getRatio/:number/', (req, res) => {
    number = parseFloat(req.params['number'])
    getRatioUser(number, req.session.username).then(ratio => {
        res.send(ratio + "");
    })
})

app.get('/getMarketDemand', (req, res) => {
    getMarketDemand().then(result => { res.send(result + "") });
})

app.get('/getPowerplant', (req, res) => {
    getPower().then(res.send(power + ""));
})

app.get('/getPrice', (req, res) => {
    getPrice().then(result => {
        res.send(result + "")
    });
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
})

app.post('/checkUpdateCredentials', (req, res) => {
    var oldUsername = req.body.username;
    console.log("oldUsername " + oldUsername)
    var username = req.body.registerUsername;
    var password = req.body.registerPassword;
    var password2 = req.body.registerPassword2;

    search(username).then(dontExists => {
        if (dontExists && username != "" && password == "" && password2 == "") {
            updateUsername(oldUsername, username).then(result => {
                res.redirect('/admin')
            })
        } else if (username == "" && password == password2 && password != "") {
            bcrypt.hash(password, saltRounds, (err, hash) => {
                // Now we can store the password hash in db.
                updatePassword(oldUsername, hash)
                res.redirect('/admin')
            });
        } else if (dontExists && username != "" && password == password2 && password != "") {
            bcrypt.hash(password, saltRounds, (err, hash) => {
                // Now we can store the password hash in db.
                updatePassword(oldUsername, hash).then(result => {
                    updateUsername(oldUsername, username).then(result => {
                        res.redirect('/admin')
                    })
                })
            });
        } else {
            console.log("Something was entered wrong")
            res.render('updateCredentials', { user: oldUsername })
        }
    })
})
app.post('/login', (req, res) => {
    /* TODO:
        Check input so no hacking */
    var username = req.body.username;
    var password = req.body.password;
    if (username != "" && password != "") {
        login(username).then(result => {
            if (result) {
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
                        setStatusUser(username, "Online")
                        res.redirect('/')
                    } else {
                        res.redirect('login')
                    }
                });
            } else {
                res.redirect('/login')
            }
        })
    } else {
        res.redirect('/login')
    }
})

app.post('/redirectregister', (req, res) => {
    res.redirect('/register')
})

app.post('/redirectlogin', (req, res) => {
    res.redirect('/login')
})

app.get('/logout', (req, res) => {
    req.session.loggedin = false
    setStatusUser(req.session.username, "Offline")
    res.redirect('/login')
})

app.get('/login', (req, res) => {
    res.render('login', {})
})

app.get('/register', (req, res) => {
    res.render('register', {})
})

app.post('/updateCredentials', (req, res) => {
    var username = req.body.username;
    res.render('updateCredentials', { user: username })
})

app.get('/admin', (req, res) => {
    if (req.session.role == "manager") {
        res.render('admin')
    } else {
        res.redirect('/')
    }
})

app.post('/delete', (req, res) => {
    var username = req.body.username;
    console.log("Deleting: " + username)
    deleteUser(username).then(() => {
        res.redirect('/admin')
    })
})

app.post('/block', (req, res) => {
    var username = req.body.username;
    blockUser(username, true).then(() => {
        res.redirect('/admin')
    })
    setTimeout(function () { blockUser(username, false) }, 10000);
})

app.post('/register', (req, res) => {
    var username = req.body.registerUsername;
    var password = req.body.registerPassword;
    var password2 = req.body.registerPassword2;

    search(username).then(exists => {
        if (exists && password == password2) {
            bcrypt.hash(password, saltRounds, (err, hash) => {
                // Now we can store the password hash in db.
                var token = insert(username, hash, false)
                request('http://consumption:3000/startUser/' + username, { json: true }, (err, res, body) => {
                    if (err) { return console.log(err); }
                });
                request('http://producer:3004/startUser/' + username, { json: true }, (err, res, body) => {
                    if (err) { return console.log(err); }
                });
                request('http://buffer:3005/startUser/' + username, { json: true }, (err, res, body) => {
                    if (err) { return console.log(err); }
                });
                /*                 res.cookie('token', token){
                                    httpOnly: true
                                } */
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
        res.redirect('/')
    })
})

app.get('/getImg', (req, res) => {
    console.log("1")
    getImg(req.session.username).then(imgPath => {
        console.log("imgPath: " + imgPath)
        res.send(imgPath)
    })
})

app.post('/sendToBuffer', (req, res) => {
    let ratio1 = req.body.sendToBuffer / 100
    request('http://buffer:3005/setRatio/1/' + req.session.username + "/" + ratio1, { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
    });
    res.redirect('/')
})

app.post('/sendRatioManager', (req, res) => {
    let ratio1 = req.body.sendToBuffer / 100
    request('http://powerplant:3006/setRatio/' + ratio1, { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
    });
    res.redirect('/')
})

app.post('/useFromBuffer', (req, res) => {
    let ratio2 = req.body.useFromBuffer / 100
    request('http://buffer:3005/setRatio/2/' + req.session.username + "/" + ratio2, { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
    });
    res.redirect('/')
})

app.post('/setPrice', (req, res) => {
    request('http://price:3007/setPrice/' + req.body.setPrice, { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
    });
    price = req.body.setPrice
    res.redirect('/')
})

app.post('/switch', (req, res) => {
    console.log("req.body.switch :" + req.body.switch)
    if (req.body.switch == "on") {
        request('http://powerplant:3006/start/', { json: true }, (err, res, body) => {
            if (err) {
                return console.log(err);
            }
        });
    } else {
        request('http://powerplant:3006/stop/', { json: true }, (err, res, body) => {
            if (err) {
                return console.log(err);
            }
        });
    }
    res.redirect('/')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

async function insert(_username, _password, admin) {
    const token = generateAccessToken({ username: _username })
    if (!admin) {
        var insert = { username: _username, password: _password, buffer: 0, ratio1: 0.5, ratio2: 0.5, blocked: false, role: "prosumer", token: token };
    } else {
        var insert = { username: _username, password: _password, buffer: 0, ratio1: 0.5, ratio2: 0.5, blocked: false, role: "manager", token: token };
    }


    const result = await users.insertOne(insert);
    return token
}

async function getWindspeed() {
    request('http://windspeed:3001/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        windspeed = res.body;
    });
    return windspeed;
}

async function getConsumption(username) {
    if (username != undefined) {
        request('http://consumption:3000/getUser/' + username, { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            consumption = res.body;
        })
        return consumption;
    }
}

async function getBuffer(username) {
    if (username != undefined) {
        const buffer = await new Promise(function (resolve, reject) {
            request('http://buffer:3005/getBuffer/' + username, { json: true }, (err, res, body) => {
                if (err) { return console.log(err); }
                resolve(res.body)
            })
        });
        return buffer;
    }
}

async function getProduction(username) {
    request('http://producer:3004/getUser/' + username, { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        production = res.body;
    });
    return production;
}

async function getModelledPrice() {
    const modelledPrice = await new Promise(function (resolve, reject) {
        request('http://modelledprice:3002/', { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            resolve(res.body)
        })
    });
    return modelledPrice;
}

async function getPrice() {
    request('http://price:3007/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        price = res.body;
    })
    return price;
}

async function getPower() {
    request('http://powerplant:3006/', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        power = res.body;
    })
    return power;
}

async function getStatus() {
    request('http://powerplant:3006/status', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        isOn = res.body;

        console.log("isOn: " + isOn)
    })
    return isOn;
}

async function getMarketDemand() {
    result = await market.findOne()
    return result.MarketDemand;
}

async function getRatio() {
    result = await market.findOne()
    return result.ratio;
}

async function getNetProduction(username) {
    consumption = await getConsumption(username);
    consumption = parseFloat(consumption)
    production = await getProduction(username);
    production = parseFloat(production)
    if (!isNaN(production - consumption)) {
        netProduction = (production - consumption).toFixed(2);
    }
    return netProduction;
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
async function setStatusUser(_username, status) {
    const filter = { username: _username };
    const options = { upsert: true };
    const updateDoc = {
        $set: {
            status: status
        },
    };
    const result = await users.updateOne(filter, updateDoc, options);
    return result;
}

async function findUsers() {
    result = await users.find().toArray();
    return result;
}

async function deleteUser(_username) {
    const filter = { username: _username };
    await users.deleteOne(filter);
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

async function getBufferManager() {
    const market = await new Promise(function (resolve, reject) {
        request('http://powerplant:3006/getBuffer/', { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            resolve(res.body)
        })
    });
    return market.toFixed(2);
}

async function blockUser(_username, _blocked) {
    console.log("blockUser: " + _blocked)
    const filter = { username: _username };
    const options = { upsert: true };
    const updateDoc = {
        $set: {
            blocked: _blocked
        },
    };
    const result = await users.updateOne(filter, updateDoc, options);
    return result;
}

async function updatePassword(_username, _password) {
    console.log("blockUser: " + _password)
    const filter = { username: _username };
    const options = { upsert: true };
    const updateDoc = {
        $set: {
            password: _password
        },
    };
    const result = await users.updateOne(filter, updateDoc, options);
    return result;
}

async function updateUsername(oldUsername, newUsername) {
    const filter = { username: oldUsername };
    const options = { upsert: true };
    const updateDoc = {
        $set: {
            username: newUsername
        },
    };
    const result = await users.updateOne(filter, updateDoc, options);
    return result;
}

async function getRatioUser(number, _username) {
    const search = { username: _username };
    var user = await users.findOne(search)
    if (user) {
        if (parseFloat(number) == 1) {
            return user.ratio1;
        } else {
            return user.ratio2;
        }
    }
}