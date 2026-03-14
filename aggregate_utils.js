
const {
    factions,
    patchPeriods,
    difficultyList,
    missionList,
    modifierNames,
    itemsDict
} = require('./constants');

const {
    getMissionsByLength,
    parseMMDDYYYY,
    parseTotals2,
} = require('./utils');

const {
    GameModel,
    StrategemAggregateModel,
    WeaponAggregateModel,
    ArmorAggregateModel,
    CompanionsModel,
    ItemRecencyModel
} = require('./mongo');

const AGGREGATE_MODELS = {
    strategem: StrategemAggregateModel,
    weapons: WeaponAggregateModel,
    armor: ArmorAggregateModel
}

const inc = (o, k) => o[k] = (o[k] || 0) + 1

const top4 = o =>
    Object.entries(o)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 4)

const stratCat = i => {
    const c = itemsDict[i]?.category
    if (c === "Eagle/Orbital") return "eagle"
    if (c === "Support") return "support"
    if (c === "Defensive") return "defensive"
}

const ensure = (r, item, faction) => {
    r[item] ??= {}
    r[item][faction] ??= {
        companions: {
            strategem: { all: {}, eagle: {}, support: {}, defensive: {} },
            weapons: { primary: {}, secondary: {}, throwable: {} }
        }
    }
}

function buildItemsPipeline(field, isArray, matchStage) {
    return [
        { $match: matchStage },
        { $unwind: "$players" },
        {
            $match: {
                [`players.${field}`]: isArray
                    ? { $exists: true, $ne: [], $nin: [null] }
                    : { $exists: true, $ne: null }
            }
        },
        ...(isArray ? [{ $unwind: `$players.${field}` }] : []),
        { $group: { _id: `$players.${field}` } }
    ];
}

function buildModifierFilter(modifier) {
    if (!modifier || modifier === "ALL") return {};
    if (modifier === "NONE") return { subfactions: { $eq: [] } };
    return { subfactions: modifier };
}

function buildGamesFilter(faction, patch, difficulty, mission, modifier) {
    const patchPeriod = patchPeriods.find((item) => item.id === Number(patch));
    const validMissions = getMissionsByLength(mission);
    const modifierFilter = buildModifierFilter(modifier);

    return {
        faction: faction,
        ...((difficulty && difficulty !== "0") && { difficulty: Number(difficulty) }),
        ...((mission && mission !== "All") && { mission: { $in: validMissions } }),
        createdAt: {
            $gte: new Date(patchPeriod.start),
            $lte: patchPeriod.end.toLowerCase() === 'present' ? new Date() : new Date(patchPeriod.end)
        },
        ...modifierFilter
    };
}

function getPatchMatchStage(patch) {
    const patchStart = new Date(patch.start);
    const patchEnd = patch.end === "Present" ? new Date() : new Date(patch.end);
    const matchStage = { createdAt: { $gte: patchStart, $lt: patchEnd } };
    return matchStage;
}

const distributeCompanions = r => {
    for (const item in r)
        for (const f in r[item]) {
            const companions = r[item][f].companions
            for (const k in companions.strategem) companions.strategem[k] = top4(companions.strategem[k])
            for (const k in companions.weapons) companions.weapons[k] = top4(companions.weapons[k])
        }
}

const processPlayer = (p, faction, result) => {

    if (!p?.strategem?.every(i => i != null)) return

    const strats = p.strategem
    const stratSet = new Set(strats)

    const validWeapons = p.weapons?.length === 3 && p.weapons.every(i => i != null)

    const weapons = validWeapons
        ? { primary: p.weapons[0], secondary: p.weapons[1], throwable: p.weapons[2] }
        : {}

    const loadout = [...strats, ...Object.values(weapons)]

    for (const base of loadout) {

        ensure(result, base, faction)
        const r = result[base][faction].companions

        for (const comp of loadout) {

            if (base === comp) continue

            if (stratSet.has(comp)) {

                inc(r.strategem.all, comp)

                const cat = stratCat(comp)
                if (cat) inc(r.strategem[cat], comp)

            } else if (validWeapons) {

                for (const t in weapons)
                    if (weapons[t] === comp)
                        inc(r.weapons[t], comp)
            }
        }
    }
}

async function getItems(field, isArray, matchStage) {
    const res = await GameModel.aggregate(buildItemsPipeline(field, isArray, matchStage));
    return res.map(r => r._id);
}

function getNewItems(items, seenItems) {
    return items.filter(id => {
        if (seenItems.has(id)) return false;
        seenItems.add(id);
        return true;
    });
}

function filterGames(games, { faction, difficulty, mission, modifier, patch }) {
    return games.filter(game => {
        if (faction && game.faction !== faction) return false
        if (difficulty && game.difficulty !== difficulty) return false
        if (patch.id >= 10) {
            if (modifier === "NONE" && game.subfactions?.length) return false
            if (modifier !== "ALL" && modifier !== "NONE" && !game.subfactions?.includes(modifier)) return false
        }
        if (mission !== "All" && !getMissionsByLength(mission).includes(game.mission)) return false
        return true
    })
}

async function generateAggregates(patch) {

    console.log(`Processing patch: ${patch.id} - ${patch.name}`)

    const gamesInPatch = await GameModel.find({
        createdAt: { $gte: parseMMDDYYYY(patch.start), $lt: parseMMDDYYYY(patch.end) }
    })
    const newItemsSet = new Set((await ItemRecencyModel.findOne({ patch: patch.id }))?.items || [])

    for (const faction of factions) {
        const validModifiers = patch.id < 10 ? ["ALL"] : modifierNames[faction]

        for (const modifier of validModifiers)
            for (const difficulty of difficultyList)
                for (const mission of missionList) {

                    const filteredGames = filterGames(gamesInPatch, { faction, difficulty, mission, modifier, patch })
                    if (!filteredGames.length) continue

                    for (const [key, Model] of Object.entries(AGGREGATE_MODELS)) {
                        const totals = parseTotals2(filteredGames, key, newItemsSet)
                        await Model.updateOne(
                            { patch: patch.id, faction, difficulty, mission, modifier },
                            { $set: { totals: totals.totals, items: totals.items } },
                            { upsert: true }
                        )
                    }

                    console.log(`Saved aggregate: patch=${patch.id} faction=${faction} difficulty=${difficulty} mission=${mission} modifier=${modifier}`)
                }
    }
}

function findDoc(docs, { faction, mission = "All", difficulty = 0, modifier = "ALL", patch }) {
    return docs.find(d =>
        d.faction === faction &&
        d.mission === mission &&
        d.difficulty === difficulty &&
        d.modifier === modifier &&
        d.patch === patch
    );
}

function calcItemValue(doc, itemName) {
    if (!doc || !doc.items[itemName]) return { loadouts: 0, games: 0, value: 0 };

    const item = doc.items[itemName];
    const totalLoadouts = doc.totals?.loadouts || 0;

    return {
        loadouts: item.loadouts,
        games: item.games,
        value: totalLoadouts ? +(item.loadouts / totalLoadouts * 100).toFixed(1) : 0
    };
}

function buildBreakdown(keys, getDoc, itemName) {
    const result = {};

    for (const key of keys) {
        const doc = getDoc(key);
        result[key] = calcItemValue(doc, itemName);
    }

    return result;
}

function buildPatchRanks(docs, faction) {
    const patchItemRanks = {};
    const patchCategoryRanks = {};

    patchPeriods.forEach(p => {
        const baseDoc = findDoc(docs, { faction, patch: p.id });
        if (!baseDoc) return;

        const itemsArray = Object.entries(baseDoc.items)
            .map(([name, data]) => ({ name, loadouts: data.loadouts }))
            .sort((a, b) => b.loadouts - a.loadouts);

        itemsArray.forEach((obj, idx) => {
            patchItemRanks[p.id] ||= {};
            patchItemRanks[p.id][obj.name] = idx + 1;
        });

        const categoryMap = {};

        itemsArray.forEach(obj => {
            const category = itemsDict[obj.name]?.category || "Unknown";
            categoryMap[category] ||= [];
            categoryMap[category].push(obj);
        });

        Object.values(categoryMap).forEach(arr => {
            arr.forEach((obj, idx) => {
                patchCategoryRanks[p.id] ||= {};
                patchCategoryRanks[p.id][obj.name] = idx + 1;
            });
        });
    });

    return { patchItemRanks, patchCategoryRanks };
}

function buildPatchValues(docs, faction, itemName, ranks) {
    const { patchItemRanks, patchCategoryRanks } = ranks;

    const values = patchPeriods.map(p => {
        const doc = findDoc(docs, { faction, patch: p.id });

        if (!doc || !doc.items[itemName]) {
            return {
                loadouts: -1,
                games: -1,
                avgLevel: -1,
                rank: -1,
                rank_category: -1,
                isNew: true
            };
        }

        const item = doc.items[itemName];

        return {
            loadouts_total: item.loadouts,
            loadouts: doc.totals?.loadouts
                ? +(item.loadouts / doc.totals.loadouts * 100).toFixed(1)
                : 0,
            games: doc.totals?.games
                ? +(item.games / doc.totals.games * 100).toFixed(1)
                : 0,
            avgLevel: item.lvl_avg || 0,
            rank: patchItemRanks[p.id]?.[itemName] || null,
            rank_category: patchCategoryRanks[p.id]?.[itemName] || null
        };
    });

    return values.reverse();
}

async function buildItemsDetails(patchId, model, ranks) {
    const docs = await model.find({}).lean();
    const companionsDoc = await CompanionsModel.findOne({ patch_id: patchId }).lean();
    const companionsData = companionsDoc?.items || {};

    const difficulties = [7, 8, 9, 10];
    const missionNames = ["Short", "Long"];

    const result = {};
    const allItems = new Set();

    factions.forEach(faction => {
        patchPeriods.forEach(p => {
            const baseDoc = findDoc(docs, { faction, patch: p.id });
            if (baseDoc) Object.keys(baseDoc.items).forEach(i => allItems.add(i));
        });
    });

    for (const itemName of allItems) {
        result[itemName] = {};

        for (const faction of factions) {
            const ranksData = buildPatchRanks(docs, faction);
            const values = buildPatchValues(docs, faction, itemName, ranksData);

            const currentDoc = findDoc(docs, { faction, patch: patchId });

            if (!currentDoc || !currentDoc.items[itemName]) continue;

            const itemData = currentDoc.items[itemName];

            const diffs = buildBreakdown(
                difficulties,
                diff => findDoc(docs, { faction, difficulty: diff, patch: patchId }),
                itemName
            );

            const missions = buildBreakdown(
                missionNames,
                mission => findDoc(docs, { faction, mission, patch: patchId }),
                itemName
            );

            const modifiers = buildBreakdown(
                modifierNames[faction] || [],
                modifier => findDoc(docs, { faction, modifier, patch: patchId }),
                itemName
            );

            result[itemName][faction] = {
                total: {
                    loadouts: itemData.loadouts,
                    games: itemData.games,
                    perc: (itemData.loadouts / currentDoc.totals.loadouts * 100).toFixed(1)
                },
                levels: { ...itemData.levels },
                diffs,
                missions,
                modifiers,
                ranks,
                values,
                companions: companionsData?.[itemName]?.[faction]?.companions || {}
            };
        }
    }

    return result;
}

function buildItemsChartsStats(docs, patch) {
    let current, prev;

    for (const d of docs) {
        if (d.patch === patch) current = d;
        else if (d.patch === patch - 1) prev = d;
    }

    if (!current) return { total: { loadouts: 0, games: 0 }, items: {} };

    const totalLoadouts = current.totals.loadouts;
    const prevTotal = prev?.totals.loadouts || 0;

    const items = {};

    for (const [name, data] of Object.entries(current.items)) {

        const pct = totalLoadouts ? (data.loadouts / totalLoadouts) * 100 : 0;

        let prevPct = 0;
        if (prev && prev.items[name]) {
            prevPct = prevTotal ? (prev.items[name].loadouts / prevTotal) * 100 : 0;
        }

        items[name] = {
            loadouts_total: data.loadouts,
            loadouts_percentage: Number(pct.toFixed(1)),
            avg_level: Math.round(data.lvl_avg),
            change: Number((pct - prevPct).toFixed(1)),
            isNew: data.isFirstPatch
        };
    }

    const sorted = Object.fromEntries(
        Object.entries(items).sort((a, b) => b[1].loadouts_percentage - a[1].loadouts_percentage)
    );

    return {
        total: current.totals,
        items: sorted
    };
}


module.exports = {
    processPlayer,
    distributeCompanions,
    getItems,
    getNewItems,
    generateAggregates,
    buildItemsDetails,
    getPatchMatchStage,
    buildItemsChartsStats,
    buildGamesFilter
};