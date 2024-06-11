
const express = require('express'); 
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser')

const mongoPass = encodeURIComponent('Crtstr#21')

mongoose.connect(`mongodb+srv://martindzhonov:${mongoPass}@serverlessinstance0.hrhcm0l.mongodb.net/hd`)

app.use(express.json());
const port = 8080;

const gameSchema = new mongoose.Schema({
    faction: String,
    loadoutImg: String,
    difficulty: Number,
    missionName: String,
    createdAt: String,
    players: [],
})
const GameModel = mongoose.model("game", gameSchema);

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.get('/', (req, res) => {
    res.send('Welcome to my server!');
});

app.get('/test', (req, res) => {
    res.send('Welcome to my server!');
});

app.get('/faction/:id', (req, res) => {
    const factionName = req.params['id'];
    GameModel.find({ faction: factionName }).then(function (games) {
        res.send(games);
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


