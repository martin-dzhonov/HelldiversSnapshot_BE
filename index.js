
const express = require('express');
const dotenv = require('dotenv')
dotenv.config();
const port = process.env.PORT || 8080;
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
    getHistoricalData,
    saveCategoryData,
    computeFactionTotals,
    buildFilter,
    getMissionsByLength,
    getItemDetails
} = require('./utils');
const {
    GameModel,
    StrategemModel,
    WeaponModel,
    ArmorModel
} = require('./mongo');

const app = express();
app.use(express.json());

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

                console.log(`Finished Patch ${patchPeriod.id}, Difficulty ${difficulty}, Mission ${mission} in ${ Date.now() - timeStart} ms`);
            }
        }
    }

    console.log(`Total execution time: ${Date.now() - startTime} ms`);
    return res.send("Success");
});