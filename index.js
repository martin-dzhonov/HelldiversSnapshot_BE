
const express = require('express');
const dotenv = require('dotenv')
const { exec } = require("child_process");
const mongoose = require('mongoose');
const redis = require('redis');
const { factions, patchPeriods, missionModifiers, missionNames, strategemsDict, weaponsDict } = require('./constants');

dotenv.config();
const app = express();
app.use(express.json());

const port = process.env.PORT || 8080;
 
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
    weapons: [],
    modifiers: [],
})

const model_name = "matches";
const model_test = "matches_test";

const GameModel = mongoose.model(model_name, gameSchema);
const TestModel = mongoose.model(model_test, gameSchema); // Different model name

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

// const redisClient = redis.createClient({
//     socket: {
//         host: "127.0.0.1",
//         port: 6379,
//         tls: {}
//     }
// });

// redisClient.on("error", function (err) {
//     throw err;
// });
// (async () => {
//     try {
//         await redisClient.connect();
//         console.log('Connected to Redis');
//     } catch (err) {
//         console.error('Failed to connect to Redis:', err);
//     }
// })();


// app.get('/strategem', async (req, res) => {
//     const startTime = Date.now();

//     const { diff, mission } = req.query;
//     const validMissions = getMissionsByLength(mission);

//     const filter = {
//         ...((diff && diff !== "0") && { difficulty: Number(diff) }),
//         ...((mission && mission !== "All") && { 'mission': { $in: validMissions } }),
//     };

//     const isEmptyFilter = Object.keys(filter).length === 0;

//     const cacheKey = `key_${model_name}:${isEmptyFilter ? 'all' : JSON.stringify(filter)}`;

//     const cachedData = await redisClient.hGetAll(cacheKey);
//     const cacheHit = Object.keys(cachedData).length > 0;
//     console.log('------------------')
//     console.log(`Cache ${cacheHit ? 'Hit' : 'Miss'}: ${Date.now() - startTime}ms`);

//     if (cacheHit) {
//         const parsedData = Object.fromEntries(
//             Object.entries(cachedData).map(([key, value]) => [key, JSON.parse(value)])
//         );

//         console.log(`Total: ${Date.now() - startTime}ms`);

//         return res.send(parsedData);
//     } else {
//         const mongoData = await GameModel.find(filter);
//         console.log(`Mongo GET: ${Date.now() - startTime}ms`);

//         const filtered = getDataFiltered(mongoData);

//         console.log(`Filter: ${Date.now() - startTime}ms`);

//         for (const [key, value] of Object.entries(filtered)) {
//             await redisClient.hSet(cacheKey, key, JSON.stringify(value), 'NX');
//         }
//         console.log(`Redis SET: ${Date.now() - startTime}ms`);

//         await redisClient.expire(cacheKey, 36000);

//         console.log(`Total: ${Date.now() - startTime}ms`);

//         return res.send(filtered);
//     }
// });

// app.get('/flush_cache', async (req, res) => {
//     try {
//         await redisClient.flushDb();
//         return res.send("Success");
//     } catch (err) {
//         console.error('Failed to flush Redis:', err);
//     }
// });

app.get('/games', async (req, res) => {
    const { faction, patch } = req.query;

    const patchRes = patchPeriods.find((item) => item.id === Number(patch));

    const mongoData = await GameModel.find({
        faction: faction,
        createdAt: {
            $gte: new Date(patchRes.start),
            $lte: patchRes.end.toLowerCase() === 'present' ? new Date() : new Date(patchRes.end)
        }
    })

    res.send(mongoData);
});

app.get('/gamesall', async (req, res) => {
    const { faction, patch } = req.query;
    const patchRes = patchPeriods.find((item) => item.id === Number(patch));
    const mongoData = await GameModel.find({
    })
    res.send(mongoData);
});

app.get('/report', async (req, res) => {
    const startTime = Date.now();
    const mongoData = await GameModel.find({});
    console.log(`Mongo Count ${mongoData.length}: ${Date.now() - startTime}`);

    const filtered = getDataFiltered(mongoData);
    console.log(`Filter: ${Date.now() - startTime}`);

    return res.send(filtered);
});

async function removeDuplicateIds(Model) {
    const duplicates = await Model.aggregate([
      {
        $group: {
          _id: "$id",
          ids: { $push: "$_id" },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);
  
    let totalDeleted = 0;
  
    for (const doc of duplicates) {
      const idsToRemove = doc.ids.slice(1);
      const result = await Model.deleteMany({ _id: { $in: idsToRemove } });
      totalDeleted += result.deletedCount;
    }
  
    return totalDeleted;
  }
  
  app.get('/remove_dups', async (req, res) => {
    const deletedCount = await removeDuplicateIds(GameModel);
    res.send(`Removed ${deletedCount} duplicate documents.`);
  });


app.get('/seed_new', async (req, res) => {
    const matches = await GameModel.find(); // Get all documents
  if (matches.length === 0) {
    console.log("No documents to copy.");
    return;
  }

  const copied = await TestModel.insertMany(matches.map(doc => {
    const obj = doc.toObject();
    delete obj._id; // Remove _id to avoid duplication issues
    return obj;
  }));

  res.send(`Copied ${copied.length} documents.`)
});

app.get('/', (req, res) => {
    res.send('Welcome to my server!');
});

const getDataFiltered = (mongoData) => {
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
            return strategemsDict[item.name].category === "Eagle/Orbital";
        }).slice(0, 4),
        support: sorted.filter((item) => {
            return strategemsDict[item.name].category === "Support";
        }).slice(0, 4),
        defensive: sorted.filter((item) => {
            return strategemsDict[item.name].category === "Defensive"
        }).slice(0, 4)
    }
};

const parseTotals = (games) => {
    let data = getDictObj();

    if (games.length > 0) {
        games.forEach((game) => {

            data.total.games++;
            data.diffs[game.difficulty].games++;
            data.missions[getMissionLength(game.mission)].games++;

            const uniqueStrats = new Set(game.players.flat());
            uniqueStrats.forEach((item) => {
                data.strategems[item].total.games++;
                data.strategems[item].diffs[game.difficulty].games++;
                data.strategems[item].missions[getMissionLength(game.mission)].games++;
            });

            const uniqueWeapons = new Set(game.weapons.flat());
            uniqueWeapons.forEach((item) => {
                data.weapons[item].total.games++;
                data.weapons[item].diffs[game.difficulty].games++;
                data.weapons[item].missions[getMissionLength(game.mission)].games++;

            });

            game.players.forEach((loadout) => {
                data.total.loadouts++;
                data.diffs[game.difficulty].loadouts++;
                data.missions[getMissionLength(game.mission)].loadouts++;

                loadout.forEach((item) => {
                    const strategem = data.strategems[item];
                    strategem.total.loadouts++;
                    strategem.diffs[game.difficulty].loadouts++;
                    strategem.missions[getMissionLength(game.mission)].loadouts++;

                    game.modifiers?.forEach((modifier) => {
                        strategem.modifiers[modifier]++;
                    })

                    loadout.forEach((otherItem) => {
                        if (otherItem !== item) {
                            if (strategem.companions[otherItem]) {
                                strategem.companions[otherItem]++;
                            } else {
                                strategem.companions[otherItem] = 1;
                            }
                        }
                    })
                });
            });

            game.weapons.forEach((loadout, loadoutIndex) => {
                loadout.forEach((item) => {
                    const weapon = data.weapons[item];
                    weapon.total.loadouts++;
                    weapon.diffs[game.difficulty].loadouts++;
                    weapon.missions[getMissionLength(game.mission)].loadouts++;

                    game.modifiers?.forEach((modifier) => {
                        weapon.modifiers[modifier]++;
                    })

                    if (game.players.length === game.weapons.length) {
                        game.players[loadoutIndex].forEach((strategem) => {
                            if (weapon.companions[strategem]) {
                                weapon.companions[strategem]++;
                            } else {
                                weapon.companions[strategem] = 1;
                            }
                        })
                    }
                });
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
            .filter(([key, value]) => value.total.loadouts > 0)
            .sort(([, a], [, b]) => b.total.loadouts - a.total.loadouts));
        data.strategems = sorted;

        const weapons = data.weapons;

        for (const weaponKey in weapons) {
            const companions = weapons[weaponKey].companions;
            weapons[weaponKey].companions = getItemsByCategory(companions);

            const modifiers = weapons[weaponKey].modifiers;
            weapons[weaponKey].modifiers = Object.fromEntries(
                Object.entries(modifiers).filter(([key, value]) => value !== 0)
            );
        }

        const weaponsSorted = Object.fromEntries(Object.entries(weapons)
            .filter(([key, value]) => value.total.loadouts > 0)
            .sort(([, a], [, b]) => b.total.loadouts - a.total.loadouts));

        data.weapons = weaponsSorted;

        return data;
    }
    return null;
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.get('/test', (req, res) => {
    res.send('Welcome to my server!');
});


const getDictObj = () => {
    const strategemNames = Object.keys(strategemsDict);
    const weaponNames = Object.keys(weaponsDict);

    return {
        total: {
            loadouts: 0,
            games: 0
        },
        missions: {
            short: {
                loadouts: 0,
                games: 0
            },
            long: {
                loadouts: 0,
                games: 0
            },
        },
        diffs: {
            10: {
                loadouts: 0,
                games: 0
            }, 9: {
                loadouts: 0,
                games: 0
            }, 8: {
                loadouts: 0,
                games: 0
            }, 7: {
                loadouts: 0,
                games: 0
            }
        },
        strategems: strategemNames.reduce((acc, strategem) => {
            acc[strategem] = {
                total: {
                    loadouts: 0,
                    games: 0
                },
                missions: {
                    short: {
                        loadouts: 0,
                        games: 0
                    },
                    long: {
                        loadouts: 0,
                        games: 0
                    },
                },
                diffs: {
                    10: {
                        loadouts: 0,
                        games: 0
                    }, 9: {
                        loadouts: 0,
                        games: 0
                    }, 8: {
                        loadouts: 0,
                        games: 0
                    }, 7: {
                        loadouts: 0,
                        games: 0
                    }
                },
                companions: {},
                modifiers: missionModifiers.reduce((acc, modifier) => {
                    acc[modifier] = 0;
                    return acc;
                }, {})
            };
            return acc;
        }, {}),
        weapons: weaponNames.reduce((acc, weapon) => {
            acc[weapon] = {
                total: {
                    loadouts: 0,
                    games: 0
                },
                missions: {
                    short: {
                        loadouts: 0,
                        games: 0
                    },
                    long: {
                        loadouts: 0,
                        games: 0
                    },
                },
                diffs: {
                    10: {
                        loadouts: 0,
                        games: 0
                    }, 9: {
                        loadouts: 0,
                        games: 0
                    }, 8: {
                        loadouts: 0,
                        games: 0
                    }, 7: {
                        loadouts: 0,
                        games: 0
                    }
                },
                companions: {},
                modifiers: missionModifiers.reduce((acc, modifier) => {
                    acc[modifier] = 0;
                    return acc;
                }, {})
            };
            return acc;
        }, {}),
    };
}