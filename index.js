
const express = require('express');
const dotenv = require('dotenv')
const { exec } = require("child_process");
const mongoose = require('mongoose');
const redis = require('redis');
const {
    patchPeriods,
    strategemsDict,
    weaponsDict,
    armorNames,
    categories,
    difficultyList,
    strategemCategories,
    weaponCategories,
    missionList
} = require('./constants');
const {
    parseMissionValues,
    mergeItemData,
    extractKeyFromFactions,
    getItemsByCategory,
    getHistoricalData,
    parseDiffsValues,
    saveCategoryData,
    computeFactionTotals,
    buildFilter,
    getMissionsByLength
} = require('./utils');

dotenv.config();
const app = express();
app.use(express.json());
const port = process.env.PORT || 8080;
const mKey = encodeURIComponent('Crtstr#21')
mongoose.connect(`mongodb+srv://martindzhonov:${mKey}@serverlessinstance0.hrhcm0l.mongodb.net/hd`)

const gameSchema = new mongoose.Schema({
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
            armor: String,
            level: String
        }
    ],
    modifiers: [],
});

const totalsSchema = new mongoose.Schema({
    filter: {
        patch: Number,
        difficulty: Number,
        mission: String
    },
    terminid: {},
    automaton: {},
    illuminate: {}
});

const GameModel = mongoose.model("matches", gameSchema);
const StrategemModel = mongoose.model("strategem", totalsSchema);
const WeaponModel = mongoose.model("weapon", totalsSchema);
const ArmorModel = mongoose.model("armor", totalsSchema);

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.get('/', (req, res) => {
    res.send('Hello !');
});

const withTiming = (handler) => async (req, res, next) => {
    const start = Date.now();
    try {
        await handler(req, res, next);
    } finally {
        console.log(`${req.route.path} took ${Date.now() - start}ms`);
    }
};

app.get('/history_strategem', withTiming(async (req, res) => {
    const { difficulty, mission } = req.query;

    const mongoData = await StrategemModel.find({
        'filter.difficulty': difficulty,
        'filter.mission': mission,
    });

    const result = getHistoricalData(mongoData, Object.keys(strategemsDict));
    return res.send(result);
}));

app.get('/history_weapons', withTiming(async (req, res) => {
    const { difficulty, mission } = req.query;

    const mongoData = await WeaponModel.find({
        'filter.difficulty': difficulty,
        'filter.mission': mission,
    });

    const result = getHistoricalData(mongoData, Object.keys(weaponsDict));
    return res.send(result);
}));

app.get('/history_armor', withTiming(async (req, res) => {
    const { difficulty, mission } = req.query;

    const mongoData = await ArmorModel.find({
        'filter.difficulty': difficulty,
        'filter.mission': mission,
    });

    const result = getHistoricalData(mongoData, armorNames.map(name => name.toUpperCase()));
    return res.send(result);
}));

app.get('/strategem_details', withTiming(async (req, res) => {
    const { id, patch_id } = req.query;

    const result = await getItemDetails({
        id,
        patch_id,
        model: StrategemModel,
        dict: strategemsDict,
        categories: strategemCategories,
    });

    return res.send(result);
}));

app.get('/weapon_details', withTiming(async (req, res) => {
    const { id, patch_id } = req.query;

    const result = await getItemDetails({
        id,
        patch_id,
        model: WeaponModel,
        dict: weaponsDict,
        categories: weaponCategories,
    });

    return res.send(result);
}));

app.get('/generate_reports', async (req, res) => {
    const startTime = Date.now();
    const models = [StrategemModel, WeaponModel, ArmorModel];
    await Promise.all(models.map(model => model.deleteMany({})));

    for (const patchPeriod of patchPeriods) {
        for (const difficulty of difficultyList) {
            for (const mission of missionList) {
                const timeStart = Date.now();
                const filter = buildFilter(patchPeriod, difficulty, mission);
                const mongoData = await GameModel.find(filter);
                const totals = computeFactionTotals(mongoData);

                await Promise.all(
                    models.map((model, i) =>
                        saveCategoryData(model, totals, patchPeriod.id, difficulty, mission, categories[i])));

                const timeEnd = Date.now();
                console.log(`Finished Patch ${patchPeriod.id}, Difficulty ${difficulty}, Mission ${mission} in ${timeEnd - timeStart} ms`);
            }
        }
    }

    console.log(`Total execution time: ${Date.now() - startTime} ms`);
    return res.send("Success");
});

app.get('/games', withTiming(async (req, res) => {
    const { faction, patch, difficulty, mission } = req.query;
    const validMissions = getMissionsByLength(mission);
    const patchPeriod = patchPeriods.find((item) => item.id === Number(patch));

    const filter = {
        faction: faction,
        ...((difficulty && difficulty !== "0") && { difficulty: Number(difficulty) }),
        ...((mission && mission !== "All") && { 'mission': { $in: validMissions } }),
        createdAt: {
            $gte: new Date(patchPeriod.start),
            $lte: patchPeriod.end.toLowerCase() === 'present' ? new Date() : new Date(patchPeriod.end)
        }
    };

    const mongoData = await GameModel.find(filter)

    res.send(mongoData);
}));

async function getItemDetails({ id, patch_id, model, dict, categories }) {
    const patchesData = await model.find({
        'filter.difficulty': 0,
        'filter.mission': "All",
    });

    const patchData = patchesData[patch_id];
    const historicalData = getHistoricalData(patchesData, Object.keys(dict));
    const itemPatchData = extractKeyFromFactions(patchData, id);
    const itemHistory = extractKeyFromFactions(historicalData, id);

    const ranks = { all: Object.keys(dict).length };
    for (const category of categories) {
        ranks[category] = Object.keys(getItemsByCategory(dict, category)).length;
    }

    const result = mergeItemData(itemPatchData, itemHistory, ranks);
    parseDiffsValues(result, patchData);
    parseMissionValues(result, patchData);

    return result;
}
