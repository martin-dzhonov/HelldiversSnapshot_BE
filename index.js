const dotenv = require('dotenv')
dotenv.config();
const express = require('express');
const port = process.env.PORT || 8080;

const {
    patchPeriods,
    strategemsDict,
    weaponsDict,
    strategemCategories,
    weaponCategories
} = require('./constants');

const {
    withCache,
    withTiming,
    withDetailsCache
} = require('./decorators');

const {
    itemsStatsHandler,
    strategemDetailsHandler,
    weaponDetailsHandler,
    dataStatusHandler,
    gamesHandler
} = require('./handlers');

const {
    getDistributions,
    parseMMDDYYYY,
    getItemsRanks
} = require('./utils');

const {
    distributeCompanions,
    processPlayer,
    getItems,
    getNewItems,
    generateAggregates,
    buildItemsDetails,
    getPatchMatchStage,
    buildGamesFilter
} = require('./aggregate_utils');

const {
    GameModel,
    StrategemAggregateModel,
    WeaponAggregateModel,
    ArmorAggregateModel,
    CompanionsModel,
    ItemRecencyModel,
    StrategemDetailsModel,
    WeaponDetailsModel
} = require('./mongo');

const NodeCache = require('node-cache');
const itemsStatsCache = new NodeCache({ stdTTL: 0 }); // no TTL
const strategemDetailsCache = new NodeCache({ stdTTL: 40000, checkperiod: 60 });
const weaponDetailsCache = new NodeCache({ stdTTL: 40000, checkperiod: 60 });
const dataStatusCache = new NodeCache({ stdTTL: 40000, checkperiod: 60 });
const gamesCache = new NodeCache({ stdTTL: 40000, checkperiod: 60 });

const ranks = [
    getItemsRanks(strategemsDict, strategemCategories),
    getItemsRanks(weaponsDict, weaponCategories)
];

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

const itemFields = [
    { field: 'strategem', isArray: true },
    { field: 'weapons', isArray: true },
    { field: 'armor', isArray: false }
];

app.get(
    '/items_stats',
    withTiming(
        withCache(
            itemsStatsCache,
            req => `items_stats:${JSON.stringify(req.query)}`,
            itemsStatsHandler
        )
    )
);

app.get(
    '/strategem_details_2',
    withTiming(
        withDetailsCache(
            strategemDetailsCache,
            req => `strategem_patch:${req.query.patch_id}`,
            strategemDetailsHandler
        )
    )
);

app.get(
    '/weapon_details_2',
    withTiming(
        withDetailsCache(
            weaponDetailsCache,
            req => `strategem_patch:${req.query.patch_id}`,
            weaponDetailsHandler
        )
    )
);

app.get(
    '/data_status',
    withTiming(
        withCache(
            dataStatusCache,
            () => 'data_status',
            dataStatusHandler
        )
    )
);


app.get('/games', withTiming(async (req, res) => {
    const { faction, patch, difficulty, mission, modifier } = req.query;

    const filter = buildGamesFilter(faction, patch, difficulty, mission, modifier);
    const mongoData = await GameModel.find(filter).lean()

    return res.send({
        games: mongoData,
        distributions: getDistributions(mongoData)
    });
}));

app.get('/generate-companions', withTiming(async (req, res) => {
    for (const patch of patchPeriods) {
        const result = {}

        const cursor = GameModel.find({
            createdAt: {
                $gte: parseMMDDYYYY(patch.start),
                $lt: patch.end === "Present" ? new Date() : parseMMDDYYYY(patch.end)
            }
        }).lean().cursor()

        for await (const { faction, players } of cursor)
            players?.forEach(p => processPlayer(p, faction, result))

        distributeCompanions(result)

        await CompanionsModel.updateOne(
            { patch_id: patch.id },
            { $set: { items: result } },
            { upsert: true }
        )

        console.log(`Generated companions for patch ${patch.id}`)
    }

    res.json({ success: true })
}))


app.get('/generate-recencies', withTiming(async (req, res) => {
    const seenItems = new Set();
    const patchesResult = [];

    for (const patch of patchPeriods) {
        const patchItems = new Set();
        const matchStage = getPatchMatchStage(patch);

        for (const { field, isArray } of itemFields) {
            const items = await getItems(field, isArray, matchStage);
            items.forEach(i => patchItems.add(i));
        }

        const patchObj = {
            patch: patch.id,
            items: getNewItems([...patchItems], seenItems)
        };

        await ItemRecencyModel.updateOne(
            { patch: patch.id },
            { $set: patchObj },
            { upsert: true }
        );

        console.log(`Generated Recencies - ${patch.id}`);
        patchesResult.push(patchObj);
    }

    res.send({
        success: true,
        patchesCached: patchesResult
    });
}));

app.get('/generate-aggregates', async (req, res) => {
    for (const patch of patchPeriods) {
        await generateAggregates(patch);
    }

    res.send({
        success: true,
        message: 'All patch aggregates generated.'
    });
});

app.get("/generate-details", async (req, res) => {
    const aggregateModels = [StrategemAggregateModel, WeaponAggregateModel];
    const detailsModels = [StrategemDetailsModel, WeaponDetailsModel];

    for (const patch of patchPeriods) {
        for (let i = 0; i < aggregateModels.length; i++) {
            const aggregateModel = aggregateModels[i];
            const detailsModel = detailsModels[i];

            const data = await buildItemsDetails(
                Number(patch.id),
                aggregateModel,
                ranks[i]
            );

            await detailsModel.updateOne(
                { patch: patch.id },
                { $set: { patch: patch.id, items: data } },
                { upsert: true }
            );

            console.log(`Generated Details - ${patch.name}`)
        }
    }

    res.send({ resp: 'All details aggregates generated.' });
});

app.get('/run-all', async (req, res) => {
    try {
        const endpoints = [
            '/generate-recencies',
            '/generate-companions',
            '/generate-aggregates',
            '/generate-details',
        ];

        const results = [];

        for (const endpoint of endpoints) {
            const response = await fetch(`http://localhost:8080${endpoint}`);
            const data = await response.json();
            results.push({ endpoint, data });
        }

        res.send("All aggregates generated");
    } catch (err) {
        console.error(err);
        res.status(500).send({
            success: false,
            message: 'Error running jobs',
            error: err.message
        });
    }
});

app.get('/select-aggregate', withTiming(async (req, res) => {
    const { faction, difficulty, mission, patch_id, modifier, type } = req.query;

    if (!['strategem', 'weapons', 'armor'].includes(type)) {
        return res.status(400).json({ error: 'Invalid type' });
    }

    const ModelMap = {
        strategem: StrategemAggregateModel,
        weapons: WeaponAggregateModel,
        armor: ArmorAggregateModel
    };

    const Model = ModelMap[type];

    const currentPatch = await Model.findOne({
        faction,
        difficulty: Number(difficulty),
        mission,
        patch: Number(patch_id),
        modifier
    });

    if (!currentPatch) return res.json({ total: { loadouts: 0, games: 0 }, items: {} });

    res.send({
        currentPatch
    });
}));

app.get('/clear-aggregates', async (req, res) => {
    const models = [
        StrategemAggregateModel,
        WeaponAggregateModel,
        ArmorAggregateModel,
        CompanionsModel,
        ItemRecencyModel,
        StrategemDetailsModel,
        WeaponDetailsModel
    ];
    await Promise.all(models.map(model => model.deleteMany({})));
    res.send({
        success: true,
        message: 'All aggregates deleted'
    });
});

app.get('/', (req, res) => {
    res.send('Hello !');
});

app.get('/game_by_id/:id', async (req, res) => {
    const id = req.params['id'];
    const docs = await GameModel.find({ id: id })
    return res.send(docs);
});