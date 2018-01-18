const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const config = require('./models/config');
const routes = require('./routes/routes');

// http://mongoosejs.com/docs/promises.html
mongoose.Promise = global.Promise;
mongoose.connect(config.dbUrl, {server: {socketOptions: {keepAlive: 120}}});

const app = express();

// run init script
if (app.get('env') === 'production') require('./init/init');

// log if in dev mode
else app.use(logger('dev'));

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// handle 404
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        console.log(err);
        res.status(err.status || 500).send();
    });
}

// production error handler
app.use(function(err, req, res, next) {
    res.status(err.status || 500).send();
});

var server = app.listen(config.port);
console.log('Listening at http://localhost:%s in %s mode',
    server.address().port, app.get('env'));

var socket = require('socket.io');

var io = socket(server)

var queueCounter = 0;
var night = true;
var gameOver = false;
let players = []

for(let i = 0; i < 10; i++){
    players.push(new Player())
}

io.sockets.on('connection', function (socket){
    socket.emit("id", queueCounter);
    socket.on("name", function(data) {
        players[queueCounter].name = data;
    })
	console.log("There are " + queueCounter + " players waiting to be placed in a room")
    queueCounter++;
    if(queueCounter === 9){
        
        

        queueCounter = 0;
        
        // Randomly assign 
        
        let ids = [0,1,2,3,4,5,6,7,8,9];
        //pick two mafia
        let numMafia = 2;
        for(let i = 0; i < 2; i++){
            let mafiaIndex = Math.floor(Math.random() * ids.length);
            console.log("Mafia:  " + ids[mafiaIndex])
            players[ids[mafiaIndex]].isMafia = true;
            io.local.emit(ids[mafiaIndex].toString(), "mafia")
            ids.splice(mafiaIndex,1)
        }
        //pick a detective
        let detectiveIndex = Math.floor(Math.random() * ids.length);
        console.log("Detective: " + ids[detectiveIndex])
        players[ids[detectiveIndex]].isDetective = true;
        io.local.emit(ids[detectiveIndex].toString(), "detective")
        ids.splice(detectiveIndex,1)

        //pick a doctor
        let numDoctor = 1
        let doctorIndex = Math.floor(Math.random() * ids.length);
        console.log("doctor: " + ids[doctorIndex])
        io.local.emit(ids[doctorIndex].toString(), "doctor")
        ids.splice(doctorIndex,1)

        //rest are just normals
        let numNormals = ids.length;
        for(let i = 0; i < ids.length; i++){
            io.local.emit(ids[i], "citizen")
        }
        //Game starts
        gameOver = false;
        io.local.emit("update", players)
        night = true;
        let mafiaVotes = [];
        let nightVotes = 0;
        let numAlive = 10;
        let healName  = ""
        let deadName = ""
        let dayVotes = [];


        // receieves message from client to kill a user. data is name of user
        socket.on("mafiakill", function(data){
            if(night){
                nightVotes++;
                mafiaVotes.push(data);
                if (mafiaVotes.length == numMafia){
                    deadName = mafiaVotes[Math.floor(Math.random() * numMafia)]
                    mafiaVotes = []
                }
                if (nightVotes == numDoctor + numMafia){
                    nightVotes = 0;
                    if(deadName == healName){
                        deadName = "";
                        // numAlive++;
                    }
                    for(let i = 1; i < players.length; i++){
                        if(deadName === players[i].name){
                            players[i].isAlive = false;
                            numAlive--;
                        }
                    }
                    io.local.emit("update", players)
                    night = false
                }
            }
        })

        socket.on("heal", function(data){
            if(night){
                healName = data;
                nightVotes++;
                if (nightVotes == numDoctor + numMafia){
                    nightVotes = 0;
                    if(deadName == healName){
                        deadName = "";
                        // numAlive++;
                    }
                    for(let i = 1; i < players.length; i++){
                        if(deadName === players[i].name){
                            numAlive--;
                            players[i].isAlive = false;
                        }
                    }
                    io.local.emit("update", players)
                    night = false
                }
            }
        })

        socket.on("dayVote", function(data){
            if(!night){
                dayVotes.push(data);
                if(dayVotes.length == numAlive){
                    deadName = mode(dayVotes);
                    dayVotes = [];
                    for(let i = 1; i < players.length; i++){
                        if(deadName === players[i].name){
                            numAlive--;
                            players[i].isAlive = false;
                        }
                    }
                    io.local.emit("update", players)
                    night = true
                }
            }
        })
    }
})

function mode(array)
{
    if(array.length == 0)
        return null;
    var modeMap = {};
    var maxEl = array[0], maxCount = 1;
    for(var i = 0; i < array.length; i++)
    {
        var el = array[i];
        if(modeMap[el] == null)
            modeMap[el] = 1;
        else
            modeMap[el]++;  
        if(modeMap[el] > maxCount)
        {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }
    return maxEl;
}

function Player(name, isMafia, isDetective, isDoctor){
    this.name = name;
    this.isAlive = true;
    this.isMafia = false;
    this.isDetective = false;
    this.isDoctor = false;
}

module.exports = app;
