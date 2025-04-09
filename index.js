
const express = require('express');
const dotenv = require('dotenv')
const { exec } = require("child_process");
const mongoose = require('mongoose');
const redis = require('redis');
const { factions, patchPeriods, missionModifiers, missionNames, strategemsDict, weaponsDict } = require('./constants');
const { count } = require('console');

dotenv.config();
const app = express();
app.use(express.json());

const port = process.env.PORT || 8080;

const mongoPass = encodeURIComponent('Crtstr#21')

mongoose.connect(`mongodb+srv://martindzhonov:${mongoPass}@serverlessinstance0.hrhcm0l.mongodb.net/hd`)

const gameSchema =  new mongoose.Schema({
    id: { type: Number, unique: true },
    faction: String,
    planet: String,
    difficulty: Number,
    mission: String,
    createdAt: Date,
    players: [
        {
            strategem: [String],
            weapons: [String],
            level: String
        }
    ],
    modifiers: [],
});

const GameModel = mongoose.model("matches", gameSchema);
const GameModel_1 = mongoose.model("matches_test1", gameSchema);

// const gameSchema = new mongoose.Schema({
//     id: Number,
//     faction: String,
//     planet: String,
//     difficulty: Number,
//     mission: String,
//     createdAt: Date,
//     players: [],
//     weapons: [],
//     modifiers: [],
// })

// const model_name = "matches";
// const model_test = "matches_test";

// const GameModel = mongoose.model(model_name, gameSchema);
// const TestModel = mongoose.model(model_test, gameSchema); // Different model name

// const TestModel1 = mongoose.model("matches_test1", new mongoose.Schema({
//     id: { type: Number, unique: true },
//     faction: String,
//     planet: String,
//     difficulty: Number,
//     mission: String,
//     createdAt: Date,
//     players: [
//         {
//             strategem: [String],
//             weapons: [String],
//             level: String
//         }
//     ],
//     modifiers: [],
// }));

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});


app.get('/games', async (req, res) => {
    const startTime = Date.now();
    const { faction, patch, difficulty, mission } = req.query;
    const validMissions = getMissionsByLength(mission);

    const filter = {
        ...((difficulty && difficulty !== "0") && { difficulty: Number(difficulty) }),
        ...((mission && mission !== "All") && { 'mission': { $in: validMissions } }),
    };
    const patchPeriod = patchPeriods.find((item) => item.id === Number(patch));

    const mongoData = await GameModel.find({
        faction: faction,
        createdAt: {
            $gte: new Date(patchPeriod.start),
            $lte: patchPeriod.end.toLowerCase() === 'present' ? new Date() : new Date(patchPeriod.end)
        },
        ...filter
    })
    console.log(`Mongo Count ${mongoData.length}: ${Date.now() - startTime}`);

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


const getDataFiltered = (mongoData) => {
    const dataSegmented = factions.map((faction) =>
        patchPeriods.map((patch) => mongoData.filter((game) =>
            game.faction === faction &&
            filterByDateRange(patch.start, patch.end, game.createdAt)))
    );
    
    const result = factions.reduce((acc, key, index) => {
        acc[key] = dataSegmented[index].map(patchData => parseTotals1(patchData));
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

const strategemCompanionsByCategory = (companions) => {
    const sorted = Object.entries(companions)
        .sort(([, a], [, b]) => b - a)
        .map((item) => { return { name: item[0], total: item[1] } })
        .filter((item) => item.name !== 'null')

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


const weaponCompanionsByCategory = (companions) => {
    const sorted = Object.entries(companions)
        .sort(([, a], [, b]) => b - a)
        .map((item) => { return { name: item[0], total: item[1] } })
        .filter((item) => item.name !== 'null')

    return {
        primary: sorted.filter((item) => {
            return weaponsDict[item.name].category === "Primary";
        }).slice(0, 4),
        secondary: sorted.filter((item) => {
            return weaponsDict[item.name].category === "Secondary";
        }).slice(0, 4),
        throwable: sorted.filter((item) => {
            return weaponsDict[item.name].category === "Throwable"
        }).slice(0, 4)
    }
};

const parseTotals1 = (games) => {
    let data = getDictObj();
    const keysArr = ['strategem', 'weapons'];

    if (games.length > 0) {

        games.forEach((game) => {
            data.total.games++;
            data.diffs[game.difficulty].games++;
            data.missions[getMissionLength(game.mission)].games++;
            let uniqueItems = {};

            game.players.forEach((player) => {
                data.total.loadouts++;
                if (player.level) {
                    data.totallvl.count++;
                    data.totallvl.acc = data.totallvl.acc + Number(player.level);
                }

                keysArr.forEach((key) => {
                    const loadout = player[key];
                    if (loadout?.length > 0) {
                        data.diffs[game.difficulty].loadouts++;
                        data.missions[getMissionLength(game.mission)].loadouts++;

                        loadout.forEach((item) => {
                            if (item !== null) {
                                const dataItem = data[key][item];
                                dataItem.total.loadouts++;
                                dataItem.diffs[game.difficulty].loadouts++;
                                dataItem.missions[getMissionLength(game.mission)].loadouts++;

                                if (!uniqueItems[item]) {
                                    dataItem.total.games++;
                                    dataItem.diffs[game.difficulty].games++;
                                    dataItem.missions[getMissionLength(game.mission)].games++;
                                    uniqueItems[item] = 1;
                                }

                                if (player.level) {
                                    dataItem.totallvl.count++;
                                    dataItem.totallvl.acc = Number(dataItem.totallvl.acc) + Number(player.level);
                                    const lvlRounded = Math.min(150, Math.ceil(player.level / 50) * 50);
                                    if (dataItem.levels[lvlRounded]) {
                                        dataItem.levels[lvlRounded]++;
                                    } else {
                                        dataItem.levels[lvlRounded] = 1;
                                    }
                                }

                                player?.strategem?.forEach((strategem) => {
                                    if (strategem !== item) {
                                        if (dataItem.companions.strategem[strategem]) {
                                            dataItem.companions.strategem[strategem]++;
                                        } else {
                                            dataItem.companions.strategem[strategem] = 1;
                                        }
                                    }
                                })

                                player?.weapons?.forEach((weapon) => {
                                    if (weapon !== item) {
                                        if (dataItem.companions.weapons[weapon]) {
                                            dataItem.companions.weapons[weapon]++;
                                        } else {
                                            dataItem.companions.weapons[weapon] = 1;
                                        }
                                    }
                                })
                            }
                        })
                    }
                })
            });
        })

        const strategem = data.strategem;
        const strategemSort = Object.fromEntries(Object.entries(strategem)
            .sort(([, a], [, b]) => b.total.loadouts - a.total.loadouts));
        data.strategem = strategemSort;

        const weapons = data.weapons;
        const weaponsSort = Object.fromEntries(Object.entries(weapons)
            .sort(([, a], [, b]) => b.total.loadouts - a.total.loadouts));
        data.weapons = weaponsSort;

        for (const strategemKey in strategem) {
            const companions = strategem[strategemKey].companions;
            strategem[strategemKey].companions.strategem = strategemCompanionsByCategory(companions.strategem);
            strategem[strategemKey].companions.weapons = weaponCompanionsByCategory(companions.weapons);
        }
        for (const weaponKey in weapons) {
            const companions = weapons[weaponKey].companions;
            weapons[weaponKey].companions.strategem = strategemCompanionsByCategory(companions.strategem);
            weapons[weaponKey].companions.weapons = weaponCompanionsByCategory(companions.weapons);
        }
        return data;
    }
    return null;
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.get('/', (req, res) => {
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
        totallvl: {
            count: 0,
            acc: 0,
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
        strategem: strategemNames.reduce((acc, strategem) => {
            acc[strategem] = {
                total: {
                    loadouts: 0,
                    games: 0
                },
                totallvl: {
                    count: 0,
                    acc: 0,
                },
                levels: {
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
                companions:
                {
                    strategem: {},
                    weapons: {}
                },
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
                totallvl: {
                    count: 0,
                    acc: 0,
                },
                levels: {
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
                companions:
                {
                    strategem: {},
                    weapons: {}
                },
                modifiers: missionModifiers.reduce((acc, modifier) => {
                    acc[modifier] = 0;
                    return acc;
                }, {})
            };
            return acc;
        }, {}),
    };
}


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
// const parseTotals = (games) => {
//     let data = getDictObj();

//     if (games.length > 0) {
//         games.forEach((game) => {

//             data.total.games++;
//             data.diffs[game.difficulty].games++;
//             data.missions[getMissionLength(game.mission)].games++;

//             const uniqueStrats = new Set(game.players.flat());
//             uniqueStrats.forEach((item) => {
//                 data.strategems[item].total.games++;
//                 data.strategems[item].diffs[game.difficulty].games++;
//                 data.strategems[item].missions[getMissionLength(game.mission)].games++;
//             });

//             const uniqueWeapons = new Set(game.weapons.flat());
//             uniqueWeapons.forEach((item) => {
//                 data.weapons[item].total.games++;
//                 data.weapons[item].diffs[game.difficulty].games++;
//                 data.weapons[item].missions[getMissionLength(game.mission)].games++;

//             });

//             game.players.forEach((loadout, loadoutIndex) => {
//                 data.total.loadouts++;
//                 data.diffs[game.difficulty].loadouts++;
//                 data.missions[getMissionLength(game.mission)].loadouts++;

//                 loadout.forEach((item) => {
//                     const strategem = data.strategems[item];
//                     strategem.total.loadouts++;
//                     strategem.diffs[game.difficulty].loadouts++;
//                     strategem.missions[getMissionLength(game.mission)].loadouts++;

//                     game.modifiers?.forEach((modifier) => {
//                         strategem.modifiers[modifier]++;
//                     })

//                     loadout.forEach((otherItem) => {
//                         if (otherItem !== item) {
//                             if (strategem.companions.strategem[otherItem]) {
//                                 strategem.companions.strategem[otherItem]++;
//                             } else {
//                                 strategem.companions.strategem[otherItem] = 1;
//                             }
//                         }
//                     })

//                     if (game.players.length === game.weapons.length) {
//                         game.weapons[loadoutIndex].forEach((weapon) => {
//                             if (strategem.companions.weapons[weapon]) {
//                                 strategem.companions.weapons[weapon]++;
//                             } else {
//                                 strategem.companions.weapons[weapon] = 1;
//                             }
//                         })
//                     }
//                 });
//             });

//             game.weapons.forEach((loadout, loadoutIndex) => {
//                 loadout.forEach((item) => {
//                     const weapon = data.weapons[item];
//                     weapon.total.loadouts++;
//                     weapon.diffs[game.difficulty].loadouts++;
//                     weapon.missions[getMissionLength(game.mission)].loadouts++;

//                     game.modifiers?.forEach((modifier) => {
//                         weapon.modifiers[modifier]++;
//                     })

//                     loadout.forEach((otherItem) => {
//                         if (otherItem !== item) {
//                             if (weapon.companions.weapons[otherItem]) {
//                                 weapon.companions.weapons[otherItem]++;
//                             } else {
//                                 weapon.companions.weapons[otherItem] = 1;
//                             }
//                         }
//                     })

//                     if (game.players.length === game.weapons.length) {
//                         game.players[loadoutIndex].forEach((strategem) => {
//                             if (weapon.companions.strategem[strategem]) {
//                                 weapon.companions.strategem[strategem]++;
//                             } else {
//                                 weapon.companions.strategem[strategem] = 1;
//                             }
//                         })
//                     }
//                 });
//             });
//         });

//         const strategems = data.strategems;

//         for (const strategemKey in strategems) {
//             const companions = strategems[strategemKey].companions;
//             strategems[strategemKey].companions.strategem = strategemCompanionsByCategory(companions.strategem);
//             strategems[strategemKey].companions.weapons = weaponCompanionsByCategory(companions.weapons);

//             const modifiers = strategems[strategemKey].modifiers;
//             strategems[strategemKey].modifiers = Object.fromEntries(
//                 Object.entries(modifiers).filter(([key, value]) => value !== 0)
//             );
//         }

//         const sorted = Object.fromEntries(Object.entries(strategems)
//             .filter(([key, value]) => value.total.loadouts > 0)
//             .sort(([, a], [, b]) => b.total.loadouts - a.total.loadouts));
//         data.strategems = sorted;

//         const weapons = data.weapons;

//         for (const weaponKey in weapons) {
//             const companions = weapons[weaponKey].companions;
//             weapons[weaponKey].companions.strategem = strategemCompanionsByCategory(companions.strategem);
//             weapons[weaponKey].companions.weapons = weaponCompanionsByCategory(companions.weapons);

//             const modifiers = weapons[weaponKey].modifiers;
//             weapons[weaponKey].modifiers = Object.fromEntries(
//                 Object.entries(modifiers).filter(([key, value]) => value !== 0)
//             );
//         }

//         const weaponsSorted = Object.fromEntries(Object.entries(weapons)
//             .filter(([key, value]) => value.total.loadouts > 0)
//             .sort(([, a], [, b]) => b.total.loadouts - a.total.loadouts));

//         data.weapons = weaponsSorted;

//         return data;
//     }
//     return null;
// }

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