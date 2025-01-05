
const express = require('express');
const app = express();
const mongoose = require('mongoose');

const mongoPass = encodeURIComponent('Crtstr#21')

mongoose.connect(`mongodb+srv://martindzhonov:${mongoPass}@serverlessinstance0.hrhcm0l.mongodb.net/hd`)

app.use(express.json());

const port = process.env.PORT || 8080;

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
const GameModel = mongoose.model("game", gameSchema);
const GameModel1 = mongoose.model("matches", gameSchema);

const { factions, patchPeriods, missionModifiers, missionNames, strategems } = require('./constants');


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

app.get('/faction/all', (req, res) => {
    GameModel.find({}).then(function (games) {
        res.send(games);
    });
});

app.get('/faction/:id', (req, res) => {
    const factionName = req.params['id'];
    GameModel.find({ faction: factionName }).then(function (games) {
        res.send(games);
    });
});

const getMissionsByLength = (type) => {
    return type === "All"
        ? missionNames
        : type === "Long"
            ? missionNames.slice(0, 14)
            : missionNames.slice(14, missionNames.length);
};

const getMissionLength = (missionName) => {
    const longMissions = getMissionsByLength("Long");
    return longMissions.includes(missionName) ? "long" : "short";
};

const getFactionsDict = () => {
    const strategemNames = Object.keys(strategems);

    return factions.reduce((acc, faction) => {
        acc[faction] = {
            totalGames: 0,
            totalLoadouts: 0,
            strategems: strategemNames.reduce((acc, strategem) => {
                acc[strategem] = {
                    loadouts: 0,
                    games: 0,
                    companions: {},
                    missions: { short: 0, long: 0 },
                    diffs: { 10: 0, 9: 0, 8: 0, 7: 0 },
                    modifiers: missionModifiers.reduce((acc, modifier) => {
                        acc[modifier] = 0;
                        return acc;
                    }, {})
                };
                return acc;
            }, {})
        };
        return acc;
    }, {});
}

const getItemsByCategory = (companions) => {
    const sorted = Object.entries(companions).sort(([, a], [, b]) => b - a).map((item)=> { return {name: item[0], value: item[1]}})

    return {
        all: sorted.slice(0, 4),
        eagle: sorted.filter((item)=> {
            return strategems[item.name].category === "Eagle/Orbital";
        }).slice(0, 4),
        support: sorted.filter((item)=> {
            return strategems[item.name].category === "Support";
        }).slice(0, 4),
        defensive: sorted.filter((item)=> {
            return strategems[item.name].category === "Defensive"
        }).slice(0, 4)
    }
};


function getFactionData(patchData) {
    const factionsDict = getFactionsDict();

    patchData.forEach((game) => {
        const uniqueItems = new Set(game.players.flat());
        const factionData = factionsDict[game.faction];
        factionData.totalGames++;

        game.players.forEach((loadout) => {
            factionData.totalLoadouts++;

            loadout.forEach((item) => {
                const strategem = factionData.strategems[item];
                strategem.loadouts++;
                strategem.diffs[game.difficulty]++;
                strategem.missions[getMissionLength(game.mission)]++;

                game.modifiers?.forEach((modifier) => {
                    strategem.modifiers[modifier]++;
                })

                loadout.forEach((otherItem) => {
                    if (otherItem !== item)
                        if (strategem.companions[otherItem]) {
                            strategem.companions[otherItem]++;
                        } else {
                            strategem.companions[otherItem] = 1;
                        }
                })
            });
        });
        uniqueItems.forEach((item) => {
            factionData.strategems[item].games++;
        });
    });

    for (const key in factionsDict) {
        const strategems = factionsDict[key].strategems;

        for (const strategemKey in strategems) {
            const companions = strategems[strategemKey].companions;
            strategems[strategemKey].companions = getItemsByCategory(companions);
            
            const modifiers = strategems[strategemKey].modifiers;
            strategems[strategemKey].modifiers = Object.fromEntries(
                Object.entries(modifiers).filter(([key, value]) => value !== 0)
            );
        }
    }
    
    return factionsDict;
}

app.get('/strategem', async (req, res) => {
    console.time('Execution Time');

    const patchesData = await Promise.all(patchPeriods.map(patch => GameModel1.find({
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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


