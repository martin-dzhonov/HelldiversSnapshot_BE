
const express = require('express');
const app = express();
const dotenv = require('dotenv')
const mongoose = require('mongoose');
const redis = require('redis');
const { factions, patchPeriods, missionModifiers, missionNames, strategems } = require('./constants');

dotenv.config();
app.use(express.json());

const port = process.env.PORT || 8080;

const mongoPass = encodeURIComponent(process.env.MONGO_KEY)

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

const redisClient = redis.createClient({
    socket: {
      host: 'awsredis-reraqc.serverless.use1.cache.amazonaws.com:63791',
      port: 6379
    }
  });

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

(async () => {
  try {
    await redisClient.connect(); 
    console.log('Connected to Redis');
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
})();

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

const getDataFiltered = (mongoData) =>{
    const dataSegmented = factions.map((faction) =>
        patchPeriods.map((patch) => mongoData.filter((game) =>
            game.faction === faction &&
            filterByDateRange(patch.start, patch.end, game.createdAt)))
    );

    const result = factions.reduce((acc, key, index) => {
        acc[key] = dataSegmented[index].map(patchData => parseTotals(patchData));
        return acc;
    }, {});

    return result;   
}
app.get('/strategem', async (req, res) => {
    const startTime = Date.now();
   
    const { diff, mission } = req.query;
    const validMissions = getMissionsByLength(mission);
    const filter = {
        ...((diff && diff !== "0") && { difficulty: Number(diff) }),
        ...((mission && mission !== "All") && { 'mission': { $in: validMissions } }),
    };

    const isEmptyFilter = Object.keys(filter).length === 0;
    const cacheKey = `strategem:${isEmptyFilter ? 'all' : JSON.stringify(filter)}`;

    try {
        const cachedData = await redisClient.get(cacheKey);
        console.log(`Redit Get: ${Date.now() - startTime}`);

        if (cachedData) {
            console.log(`Cache hit: ${Date.now() - startTime}`);

            const filtered = getDataFiltered(JSON.parse(cachedData));
            console.log(`Filter: ${Date.now() - startTime}`);

            return res.send(filtered);
        } else {
            console.log(`Cache miss: ${Date.now() - startTime}`);

            const mongoData = await GameModel.find(filter);
            console.log(`Mongo: ${Date.now() - startTime}`);

            await redisClient.set(cacheKey, JSON.stringify(mongoData), {
                EX: 3600,
            });
            console.log(`Redis Set: ${Date.now() - startTime}`);

            const filtered = getDataFiltered(mongoData);
            console.log(`Filter: ${Date.now() - startTime}`);

            return res.send(filtered);
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }
});

app.get('/', (req, res) => {
    res.send('Welcome to my server!');
});

app.get('/games', async (req, res) => {
    const { faction, patch } = req.query;

    const patchRes = patchPeriods.find((item)=> item.id === Number(patch));

     const mongoData = await GameModel.find({
        faction: faction,
        createdAt: {
            $gte: new Date(patchRes.start),
            $lte: patchRes.end.toLowerCase() === 'present' ? new Date() : new Date(patchRes.end)
        }
    })

    res.send(mongoData);
});

const getDictObj = () => {
    const strategemNames = Object.keys(strategems);

    return {
        totalGames: 0,
        totalLoadouts: 0,
        missions: { short: 0, long: 0 },
        diffs: { 10: 0, 9: 0, 8: 0, 7: 0 },
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
}

const filterByDateRange = (startDateStr, endDateStr, createdAt) => {
    const startDate = new Date(startDateStr);
    const endDate = endDateStr === "Present" ? new Date() : new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    const createdAtDate = new Date(createdAt);
    return createdAtDate >= startDate && createdAtDate <= endDate;
}

const getMissionsByLength = (type) => {
    return type === "All"
        ? missionNames[0].concat(missionNames[1])
        : type === "Long" ? missionNames[0] : missionNames[1];
};

const getMissionLength = (missionName) => {
    const longMissions = getMissionsByLength("Long");
    return longMissions.includes(missionName) ? "long" : "short";
};

const getItemsByCategory = (companions) => {
    const sorted = Object.entries(companions).sort(([, a], [, b]) => b - a).map((item) => { return { name: item[0], total: item[1] } })
    return {
        all: sorted.slice(0, 4),
        eagle: sorted.filter((item) => {
            return strategems[item.name].category === "Eagle/Orbital";
        }).slice(0, 4),
        support: sorted.filter((item) => {
            return strategems[item.name].category === "Support";
        }).slice(0, 4),
        defensive: sorted.filter((item) => {
            return strategems[item.name].category === "Defensive"
        }).slice(0, 4)
    }
};

const parseTotals = (games) => {
    let data = getDictObj();

    if (games.length > 0) {
        games.forEach((game) => {
            const uniqueItems = new Set(game.players.flat());
            data.totalGames++;
            game.players.forEach((loadout) => {
                data.totalLoadouts++;
                data.diffs[game.difficulty]++;
                data.missions[getMissionLength(game.mission)]++;

                loadout.forEach((item) => {
                    const strategem = data.strategems[item];
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
                data.strategems[item].games++;
            });
        });

        const strategems = data.strategems;

        for (const strategemKey in strategems) {
            const companions = strategems[strategemKey].companions;
            strategems[strategemKey].companions = getItemsByCategory(companions);

            const modifiers = strategems[strategemKey].modifiers;
            strategems[strategemKey].modifiers = Object.fromEntries(
                Object.entries(modifiers).filter(([key, value]) => value !== 0)
            );
        }
        const sorted = Object.fromEntries(Object.entries(strategems)
            .filter(([key, value]) => value.loadouts > 0)
            .sort(([, a], [, b]) => b.loadouts - a.loadouts));
        data.strategems = sorted;

        return data;
    }
    return null;
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.get("/debug", (req, res) => {
    exec("nslookup awsredis-reraqc.serverless.use1.cache.amazonaws.com", (error, stdout, stderr) => {
      if (error) {
        res.send(`Error: ${error.message}\nStderr: ${stderr}`);
      } else {
        res.send(`Success: \n${stdout}`);
      }
    });
  });
  
//  app.get('/test', (req, res) => {
    //     res.send('Welcome to my server!');
    // });
    
    // app.get('/faction/:id', (req, res) => {
    //     const factionName = req.params['id'];
    //     const patch = patchPeriods[0];
    //     const options = factionName === "all" ? {} : {
    //         faction: factionName,
    //         createdAt: {
    //             $gte: new Date(patch.start),
    //             $lte: patch.end.toLowerCase() === 'present' ? new Date() : new Date(patch.end)
    //         }
    //     }
    //     GameModel.find(options).then(function (games) {
    //         res.send(games);
    //     });
    // });
    
    // app.get('/games/:faction/:id', (req, res) => {
    //     const factionName = req.params['faction'];
    //     const strategemName = req.params['id'];
    
    //     GameModel.find({
    //         faction: factionName,
    //         'players': {
    //             $elemMatch: { $elemMatch: { $in: [strategemName] } }
    //         }
    //     }).then(function (games) {
    //         res.send(games);
    //     });
    
    // });


