
const {
    factions,
    patchPeriods,
} = require('./constants');

const {
    getHistoricalData,
    saveCategoryData,
    computeFactionTotals,
    buildFilter,
    getItemDetails,
    getDistributions,
    getMissionsByLength,
    parseMMDDYYYY,
    computeFactionTotals2,
    parseTotals2,
    getItemsRanks,
} = require('./utils');

const {
    buildItemsChartsStats,
    buildGamesFilter
} = require('./aggregate_utils');

const {
    getItemStats,
    getTotals
} = require('./mongo_utils');

const {
    GameModel,
    StrategemDetailsModel,
    WeaponDetailsModel,
    AggregateModels,
    DetailsModels
} = require('./mongo');

const itemsStatsHandler = async (req) => {
    const { faction, difficulty, mission, patch_id, modifier = 'ALL', type } = req.query;
    const Model = AggregateModels[type];
    const patch = Number(patch_id);
    const diff = Number(difficulty);

    const docs = await Model.find({
        faction,
        difficulty: diff,
        mission,
        modifier,
        patch: { $in: [patch, patch - 1] }
    }).lean();


    return buildItemsChartsStats(docs, patch);
};

const strategemDetailsHandler = async (req) => {
    const { patch_id } = req.query;
    const data = await StrategemDetailsModel.findOne({ patch: patch_id }).lean();
    return data?.items || {};
  };


const weaponDetailsHandler = async (req) => {
    const { patch_id } = req.query;
    const data = await WeaponDetailsModel.findOne({ patch: patch_id }).lean();
    return data?.items || {};
  };


  const dataStatusHandler = async (req) => {
    const currentPatch = patchPeriods[patchPeriods.length - 1]
    const start = new Date(currentPatch.start)
    const end = currentPatch.end === "Present" ? new Date() : new Date(currentPatch.end)

    const games = await GameModel.find({ createdAt: { $gte: start, $lte: end } })

    const counts = factions.map(faction => {
        let gameCount = 0
        games.forEach(game => {
            if (game.faction === faction) gameCount++
        })
        return gameCount
    })

    return counts
}

const gamesHandler = async (req) => {
    const { faction, patch, difficulty, mission } = req.query;
    const patchPeriod = patchPeriods.find((item) => item.id === Number(patch));

    const filter = buildGamesFilter(faction, patchPeriod, difficulty, mission);
    const mongoData = await GameModel.find(filter).lean()

    const distributions = getDistributions(mongoData);

    return { games: mongoData, distributions };
};


module.exports = {
    itemsStatsHandler,
    strategemDetailsHandler,
    weaponDetailsHandler,
    dataStatusHandler,
    gamesHandler
};