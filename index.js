
const dotenv = require('dotenv')
dotenv.config();
const express = require('express');
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
    getItemDetails,
    buildGamesFilter
} = require('./utils');
const {
    GameModel,
    StrategemModel,
    WeaponModel,
    ArmorModel
} = require('./mongo');

const NodeCache = require('node-cache');
const historyCache = new NodeCache({ stdTTL: 40000, checkperiod: 60 }); 

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
    } catch (err) {
        next(err);
    } finally {
        console.log(`${req.route?.path || req.originalUrl} took ${Date.now() - start}ms`);
    }
};

const historyHandler = (model, keys, prefix) => withTiming(async (req, res) => {
    const { difficulty, mission } = req.query;
  
    if (!difficulty || !mission) { return res.status(400).send({ error: 'Missing parameters' });}
  
    const cacheKey = `${prefix}:${difficulty}:${mission}`;
    const cached = historyCache.get(cacheKey);
    if (cached) { return res.send(cached) }
  
    const mongoData = await model.find({
      'filter.difficulty': difficulty,
      'filter.mission': mission,
    });
  
    const result = getHistoricalData(mongoData, keys);
    historyCache.set(cacheKey, result);

    res.send(result);
  });

app.get('/history_strategem',
    historyHandler(StrategemModel, Object.keys(strategemsDict), 'strategem')
);

app.get('/history_weapons',
    historyHandler(WeaponModel, Object.keys(weaponsDict), 'weapon')
);

app.get('/history_armor',
    historyHandler(ArmorModel, armorNames.map(n => n.toUpperCase()), 'armor')
);

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
    const patchPeriod = patchPeriods.find((item) => item.id === Number(patch));

    const filter = buildGamesFilter(faction, patchPeriod, difficulty, mission);
    const mongoData = await GameModel.find(filter)

    return res.send(mongoData);
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

    historyCache.flushAll();
    console.log(`Total execution time: ${Date.now() - startTime} ms`);
    return res.send("Success");
});

app.post('/cache_flush', (req, res) => {
    historyCache.flushAll();
    res.send({ message: 'Cache flushed successfully' });
  });

app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
    });
});