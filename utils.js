import { factions, patchPeriods, missionModifiers, missionNames, strategems } from './constants.js';


const getDictObj = () => {
    const strategemNames = Object.keys(strategems);

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
        }, {})
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
            return strategems[item.name].category === "Eagle/Orbital";
        }).slice(0, 4),
        support: sorted.filter((item) => {
            return strategems[item.name].category === "Support";
        }).slice(0, 4),
        defensive: sorted.filter((item) => {
            return strategems[item.name].category === "Defensive"
        }).slice(0, 4)
    }
};

const parseTotals = (games) => {
    let data = getDictObj();

    if (games.length > 0) {
        games.forEach((game) => {
            const uniqueItems = new Set(game.players.flat());
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
                        if (otherItem !== item)
                            if (strategem.companions[otherItem]) {
                                strategem.companions[otherItem]++;
                            } else {
                                strategem.companions[otherItem] = 1;
                            }
                    })
                });
            });
            uniqueItems.forEach((item) => {
                data.strategems[item].games++;
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

        return data;
    }
    return null;
}

export {
    parseTotals,
    filterByDateRange
}