





























// const withCache = (cache, getCacheKey, handler) => async (req, res) => {
//     try {
//         const cacheKey = getCacheKey(req);
//         const cached = cache.get(cacheKey);
//         if (cached) return res.send(cached);

//         const result = await handler(req, res);
//         cache.set(cacheKey, result);
//         return res.send(result);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// };

// app.get('/items_stats', withTiming(async (req, res) => {
//     const { faction, difficulty, mission, patch_id, modifier = 'ALL', type } = req.query;

//     const Model = AggregateModels[type];
//     const patch = Number(patch_id);
//     const diff = Number(difficulty);

//     const docs = await Model.find({
//         faction,
//         difficulty: diff,
//         mission,
//         modifier,
//         patch: { $in: [patch, patch - 1] }
//     }).lean();

//     const result = buildItemsChartsStats(docs, patch);

//     res.json(result);
// }));


// app.get("/strategem_details_2", async (req, res) => {
//     try {
//         const { id, patch_id } = req.query;
//         const data = await StrategemDetailsModel.findOne({ patch: patch_id }).lean();
//         const item = data?.items?.[id]
//         const result = item && Object.keys(item).length ? item : defaultDetailsItem;
//         res.send(result)
//     } catch (err) {
//         console.error(err)
//         res.status(500).json({
//             success: false,
//             error: err.message
//         })
//     }
// })

// app.get("/weapon_details_2", async (req, res) => {
//     try {
//         const { id, patch_id } = req.query;
//         const data = await WeaponDetailsModel.findOne({ patch: patch_id }).lean();
//         const item = data?.items?.[id]
//         const result = item && Object.keys(item).length ? item : defaultDetailsItem
//         res.send(result)
//     } catch (err) {
//         console.error(err)
//         res.status(500).json({
//             success: false,
//             error: err.message
//         })
//     }
// })

// app.get('/data_status', withCache(
//     dataStatusCache,
//     () => 'data_status',
//     dataStatusHandler
// ));










// app.get('/item_stats', withTiming(async (req, res) => {

//     const { faction, difficulty, mission, patch_id, modifier, type } = req.query;

//     const patch = patchPeriods.find(p => p.id === parseInt(patch_id));

//     if (!patch) { return res.status(400).json({ error: "Invalid patch_id" }); }

//     const prevPatch = patchPeriods.find(p => p.id === patch.id - 1);

//     const modifierFilter = buildModifierFilter(modifier);

//     const { currentStats, prevStats, currentMatch } =
//         await buildAggregate({
//             faction,
//             difficulty,
//             mission,
//             modifierFilter,
//             type,
//             patch,
//             prevPatch
//         });

//     const itemsRecency = (itemCache.get("allPatchItems") || {})[patch.id] || new Set();

//     const itemsResp = parseItems(currentStats, prevStats, itemsRecency);

//     const totals = await getTotals(currentMatch, type);

//     res.json({
//         total: {
//             loadouts: totals.total_loadouts,
//             games: totals.total_games
//         },
//         items: itemsResp
//     });

// }));

// function buildMatch({ faction, difficulty, mission, startDate, endDate, modifierFilter }) {
//     return {
//         ...(faction && { faction }),
//         ...(difficulty && parseInt(difficulty) !== 0 && { difficulty: parseInt(difficulty) }),
//         ...(mission && mission !== "All" && { mission: { $in: getMissionsByLength(mission) } }),
//         createdAt: {
//             $gte: parseMMDDYYYY(startDate),
//             $lt: parseMMDDYYYY(endDate)
//         },
//         ...modifierFilter
//     };
// }

// async function buildAggregate({ faction, difficulty, mission, modifierFilter, type, patch, prevPatch }) {

//     const isArray = type === "strategem" || type === "weapons";

//     const currentMatch = buildMatch({
//         faction,
//         difficulty,
//         mission,
//         startDate: patch.start,
//         endDate: patch.end,
//         modifierFilter
//     });

//     const currentStats = await getItemStats(currentMatch, type, isArray);

//     let prevStats = {};

//     if (prevPatch) {
//         const prevMatch = buildMatch({
//             faction,
//             difficulty,
//             mission,
//             startDate: prevPatch.start,
//             endDate: prevPatch.end,
//             modifierFilter
//         });

//         const prevStatsRaw = await getItemStats(prevMatch, type, isArray);

//         prevStats = Object.fromEntries(
//             prevStatsRaw.map(s => [s.item, s.percentage_loadouts])
//         );
//     }

//     return { currentStats, prevStats, currentMatch };
// }

// function parseItems(currentStats, prevStatsMap, prevItemsSet) {
//     return Object.fromEntries(currentStats
//         .filter(s => s.item != null)
//         .map(entry => {

//             const change = prevStatsMap[entry.item] != null
//                 ? Math.round((entry.percentage_loadouts - prevStatsMap[entry.item]) * 10) / 10
//                 : null;

//             return [
//                 entry.item,
//                 {
//                     loadouts_total: entry.total_times_played,
//                     loadouts_percentage: entry.percentage_loadouts,
//                     games_percentage: entry.percentage_games,
//                     avg_level: entry.avg_level,
//                     change,
//                     isNew: !prevItemsSet.has(entry.item)
//                 }
//             ];
//         })
//     );
// }

// const historyHandler = (model, keys, prefix) => withTiming(async (req, res) => {
//     const { difficulty, mission } = req.query;

//     if (!difficulty || !mission) { return res.status(400).send({ error: 'Missing parameters' }); }

//     const cacheKey = `${prefix}:${difficulty}:${mission}`;
//     const cached = historyCache.get(cacheKey);
//     if (cached) { return res.send(cached) }

//     const mongoData = await model.find({
//         'filter.difficulty': difficulty,
//         'filter.mission': mission,
//     });

//     const result = getHistoricalData(mongoData, keys);
//     historyCache.set(cacheKey, result);

//     res.send(result);
// });

// app.get('/history_strategem',
//     historyHandler(StrategemModel, Object.keys(strategemsDict), 'strategem')
// );

// app.get('/history_weapons',
//     historyHandler(WeaponModel, Object.keys(weaponsDict), 'weapon')
// );

// app.get('/history_armor',
//     historyHandler(ArmorModel, armorNames.map(n => n.toUpperCase()), 'armor')
// );

// app.get('/strategem_details', withTiming(async (req, res) => {
//     const { id, patch_id } = req.query;

//     const result = await getItemDetails({
//         id,
//         patch_id,
//         model: StrategemModel,
//         dict: strategemsDict,
//         categories: strategemCategories,
//     });

//     return res.send(result);
// }));

// app.get('/weapon_details', withTiming(async (req, res) => {
//     const { id, patch_id } = req.query;

//     const result = await getItemDetails({
//         id,
//         patch_id,
//         model: WeaponModel,
//         dict: weaponsDict,
//         categories: weaponCategories,
//     });

//     return res.send(result);
// }));



// app.get('/g_test_2', async (req, res) => {

//     const { faction, patch, difficulty, mission, modifier, type } = req.query;

//     const patchPeriod = patchPeriods.find((item) => item.id === Number(patch));

//     const filter = buildGamesFilter(faction, patchPeriod, difficulty, mission, modifier);

//     const mongoData = await GameModel.find(filter);
//     const totals = parseTotals2(mongoData, type);

//     return res.send({ totals });
// });

// app.get('/g_test', async (req, res) => {

//     const resp = [];
//     const patchPeriod = { id: 7, name: "Control Group", start: "07/17/2025", end: "09/03/2025" };
//     const mission = 'All';
//     const difficulty = 0;
//     const timeStart = Date.now();
//     const filter = buildFilter(patchPeriod, difficulty, mission);
//     const mongoData = await GameModel.find(filter);
//     const totals = computeFactionTotals2(mongoData);

//     resp.push({ totals, patchPeriod: patchPeriod.id, difficulty, mission, category: 'strategem' })

//     console.log(`Finished Patch ${patchPeriod.id}, Difficulty ${difficulty}, Mission ${mission} in ${Date.now() - timeStart} ms`);

//     return res.send(resp);
// });

// app.get('/generate_reports', async (req, res) => {
//     const startTime = Date.now();
//     const models = [StrategemModel, WeaponModel, ArmorModel];
//     await Promise.all(models.map(model => model.deleteMany({})));

//     for (const patchPeriod of patchPeriods) {
//         for (const difficulty of difficultyList) {
//             for (const mission of missionList) {
//                 const timeStart = Date.now();
//                 const filter = buildFilter(patchPeriod, difficulty, mission);
//                 const mongoData = await GameModel.find(filter);
//                 const totals = computeFactionTotals(mongoData);

//                 await Promise.all(
//                     models.map((model, i) =>
//                         saveCategoryData(model, totals, patchPeriod.id, difficulty, mission, categories[i])));

//                 console.log(`Finished Patch ${patchPeriod.id}, Difficulty ${difficulty}, Mission ${mission} in ${Date.now() - timeStart} ms`);
//             }
//         }
//     }

//     historyCache.flushAll();
//     console.log(`Total execution time: ${Date.now() - startTime} ms`);
//     return res.send("Success");
// });

// app.get('/game_by_id/:id', async (req, res) => {
//     const id = req.params['id'];
//     const docs = await GameModel.find({ id: id })
//     return res.send(docs);
// });

// app.get('/delete_by_id/:id', async (req, res) => {
//     const id = req.params['id'];
//     const doc = await GameModel.findOneAndDelete({ id: id })
//     return res.send(doc);
// });

// app.get('/cache_flush', (req, res) => {
//     historyCache.flushAll();
//     dataStatusCache.flushAll();
//     res.send({ message: 'Cache flushed successfully' });
// });

// app.use((err, req, res, next) => {
//     console.error('Unhandled Error:', err);
//     res.status(500).json({
//         error: 'Internal Server Error',
//         message: err.message,
//     });
// });

// app.get('/aaa', withTiming(async (req, res) => {
//     const mongoData = await GameModel.find({});

//     const required = ["eagle_500kg", "barrage_napalm"];

//     const filtered = mongoData.filter(obj =>
//         Array.isArray(obj.players) &&
//         obj.players.length === 3 &&
//         obj.players
//             .filter(p => p && Array.isArray(p.strategem))
//             .every(p => required.every(strat => p.strategem.includes(strat)))
//     );
//     return res.send({ filtered });
// }));

// app.get('/games', withTiming(async (req, res) => {
//     const { faction, patch, difficulty, mission } = req.query;
//     const patchPeriod = patchPeriods.find((item) => item.id === Number(patch));

//     const filter = buildGamesFilter(faction, patchPeriod, difficulty, mission);
//     const mongoData = await GameModel.find(filter)

//     return res.send(mongoData);
// }));