
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
const GameModel = mongoose.model(model_name, gameSchema);

const redisClient = redis.createClient({
    socket: {
        host: "3.85.90.50",//127.0.0.1,
        port: 6379,
        tls: {}
    }
});

redisClient.on("error", function (err) {
    throw err;
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
app.get('/strategem', async (req, res) => {
    const startTime = Date.now();

    const { diff, mission } = req.query;
    const validMissions = getMissionsByLength(mission);
    const filter = {
        ...((diff && diff !== "0") && { difficulty: Number(diff) }),
        ...((mission && mission !== "All") && { 'mission': { $in: validMissions } }),
    };

    const isEmptyFilter = Object.keys(filter).length === 0;
    const cacheKey = `strategem2_${model_name}:${isEmptyFilter ? 'all' : JSON.stringify(filter)}`;

    try {
        const cachedData = await redisClient.get(cacheKey);
        console.log(`Redis Get: ${Date.now() - startTime}`);

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

const getDictObj = () => {
    const strategemNames = Object.keys(strategemsDict);
    const weaponNames = Object.keys(weaponsDict);

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
        }, {}),
        weapons: weaponNames.reduce((acc, weapon) => {
            acc[weapon] = {
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
        }, {}),
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
            const uniqueItems = new Set(game.players.flat());
            uniqueItems.forEach((item) => {
                data.strategems[item].games++;
            });

            const uniqueWeapons = new Set(game.weapons.flat());
            uniqueWeapons.forEach((item) => {
                data.weapons[item].games++;
            });

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
                    weapon.loadouts++;
                    weapon.diffs[game.difficulty]++;
                    weapon.missions[getMissionLength(game.mission)]++;

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
            .filter(([key, value]) => value.loadouts > 0)
            .sort(([, a], [, b]) => b.loadouts - a.loadouts));
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
            .filter(([key, value]) => value.loadouts > 0)
            .sort(([, a], [, b]) => b.loadouts - a.loadouts));

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


