
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const mongoPass = encodeURIComponent('Crtstr#21')
mongoose.connect(`mongodb+srv://martindzhonov:${mongoPass}@serverlessinstance0.hrhcm0l.mongodb.net/hd`)
const gameSchema = new mongoose.Schema({
    id: Number,
    faction: String,
    planet: String,
    difficulty: Number,
    mission: String,
    createdAt: Date,
    players: [],
    modifiers: [],
})
const GameModel = mongoose.model("matches", gameSchema);
const { factions, patchPeriods } = require('./constants');

const {
    parseTotals,
    filterByDateRange 
} = require('./utils.mjs');

app.use(express.json());
const port = process.env.PORT || 8080;

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
    const patch = patchPeriods[0];
    const options = factionName === "all" ? {} : {
        faction: factionName,
        createdAt: {
            $gte: new Date(patch.start),
            $lte: patch.end.toLowerCase() === 'present' ? new Date() : new Date(patch.end)
        }
    }
    GameModel.find(options).then(function (games) {
        res.send(games);
    });
});

app.get('/games/:faction/:id', (req, res) => {
    const factionName = req.params['faction'];
    const strategemName = req.params['id'];

    GameModel.find({
        faction: factionName,
        'players': {
            $elemMatch: { $elemMatch: { $in: [strategemName] } }
        }
    }).then(function (games) {
        res.send(games);
    });

});

app.get('/strategem', async (req, res) => {
    console.time('Execution Time');

    const patchesData = await Promise.all(patchPeriods.map(patch => GameModel.find({
        createdAt: {
            $gte: new Date(patch.start),
            $lte: patch.end.toLowerCase() === 'present' ? new Date() : new Date(patch.end)
        }
    })))

    const result = patchesData.map((patchData) => {
        return getFactionData(patchData);
    })
    console.timeEnd('Execution Time');

    res.send(result);
});

app.get('/strategem/filter', async (req, res) => {
    console.time('Execution Time');

    const mongoData = await GameModel.find({});

    const dataSegmented = factions.map((faction) =>
        patchPeriods.map((patch) => mongoData.filter((game) =>
            game.faction === faction &&
            filterByDateRange(patch.start, patch.end, game.createdAt)))
    );

    const result = factions.reduce((acc, key, index) => {
        acc[key] = dataSegmented[index].map(patchData => parseTotals(patchData));
        return acc;
    }, {});
    console.timeEnd('Execution Time');

    res.send(result);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


