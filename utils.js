const {
    factions,
    missionNames,
    strategemsDict,
    weaponsDict,
    itemsDict,
    armorNames,
    categories,
} = require('./constants');

const getPercentage = (number1, number2, decimals = 1) => {
    if (number2 === 0) return 0;
    const raw = (number1 / number2) * 100;
    if (raw === 0) return 0;
    if (raw > 0.01 && raw < 0.1) return Number(raw.toFixed(2));
    return Number(raw.toFixed(decimals));
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

function parseMissionValues(itemData, patchData) {
    const missionsList = ['short', 'long'];
    factions.forEach(faction => {
        const itemDiffsData = itemData[faction].missions;
        const totalsData = patchData[faction].total.missions;
        missionsList.forEach(mission => {
            itemDiffsData[mission].value = getPercentage(itemDiffsData[mission].loadouts, totalsData[mission].loadouts);
        })
    })
}

function mergeItemData(itemPatchData, itemHistory, ranks) {
    const result = {};
    for (const faction of new Set([...Object.keys(itemHistory), ...Object.keys(itemPatchData)])) {
        result[faction] = {
            ...itemPatchData[faction],
            ...itemHistory[faction],
            ranks
        };
    }
    return result;
}

function extractKeyFromFactions(obj, targetKey) {
    const result = {};
    for (const faction in obj) {
        const factionData = obj[faction];
        const itemsData = factionData?.items;
        if (itemsData && itemsData[targetKey]) {
            result[faction] = itemsData[targetKey];
        }
    }

    return result;
}

function buildFilter(patchPeriod, difficulty, mission) {
    return {
        ...(difficulty !== 0 && { difficulty }),
        ...(mission && { mission: { $in: getMissionsByLength(mission) } }),
        createdAt: {
            $gte: new Date(patchPeriod.start),
            $lte: patchPeriod.end.toLowerCase() === 'present' ? new Date() : new Date(patchPeriod.end),
        },
    };
}

function computeFactionTotals(mongoData) {
    const dataSegmented = factions.map(f => mongoData.filter(game => game.faction === f));
    return factions.reduce((acc, f, i) => {
        acc[f] = parseTotals(dataSegmented[i]);
        return acc;
    }, {});
}

function saveCategoryData(model, totals, patch, difficulty, mission, category) {
    const doc = totalsByCategory({
        ...totals,
        filter: { patch, difficulty, mission }
    }, category);
    return model.create(doc);
}

function parseDiffsValues(itemData, patchData) {
    const difficulties = [7, 8, 9, 10];
    factions.forEach(faction => {
        const itemDiffsData = itemData[faction].diffs;
        const totalsData = patchData[faction].total.diffs;
        difficulties.forEach(difficulty => {
            itemDiffsData[difficulty].value = getPercentage(itemDiffsData[difficulty].loadouts, totalsData[difficulty].loadouts);
        })
    })
}

const getHistoricalData = (data, dictNames) => {
    const result = getHistoryDict(dictNames);
    for (let i = 0; i < data.length; i++) {
        const patchData = data[i];
        for (const faction of factions) {
            const factionData = patchData[faction];
            const factionResult = result[faction];
            factionResult.totals.unshift(factionData.total);

            const itemsData = factionData.items;
            const itemsResult = factionResult.items;

            for (const [key, value] of Object.entries(itemsData)) {
                const item = itemsResult[key];
                const values = item.values;
                const isNew = values.length > 0 && values.every(item => item.loadouts < 0);
                item.values.unshift({
                    ...value.values,
                    ...(isNew && { isNew })
                });
            }
        }
    }

    return result;
};

function totalsByCategory(totals, category) {
    const result = { filter: totals.filter };

    for (const faction of factions) {
        if (totals[faction]) {
            const catData = totals[faction][category];
            const totalData = totals[faction].total?.[category];
            result[faction] = {
                total: totalData ? { ...totalData } : {},
                items: catData ? { ...catData } : {}
            };
        }
    }

    return result;
}

const parseTotals = (games) => {
    let data = getDictObj();

    games.forEach((game) => {
        let difficulty = game.difficulty > 6 ? game.difficulty : 7;
        let missionLen = getMissionLength(game.mission)

        categories.forEach((category) => {
            let countGame = false;
            game.players.forEach((player) => {
                if (player) {
                    if (player[category] !== null && player[category] !== undefined) {
                        countGame = true;

                        data.total[category].loadouts++;
                        data.total[category].diffs[difficulty].loadouts++;
                        data.total[category].missions[missionLen].loadouts++;

                        if (category === 'armor') {
                            const armorName = player[category];
                            const dataItem = data[category][armorName];
                            incrementItem(dataItem, difficulty, missionLen);
                            if (player.level) {
                                incrementLevel(dataItem, player.level)
                            }

                        } else if (player[category]?.length > 0) {
                            player[category].forEach((item) => {
                                if (item !== null) {
                                    const dataItem = data[category][item];
                                    incrementItem(dataItem, difficulty, missionLen);
                                    incrementCompanions(dataItem, player, item);
                                    if (player.level) {
                                        incrementLevel(dataItem, player.level)
                                    }
                                }
                            })
                        }
                    }
                }
            })

            if (countGame) {
                data.total[category].games++;
                data.total[category].diffs[difficulty].games++;
                data.total[category].missions[missionLen].games++;

                let allItems = game.players.map((player) => {
                    if (player) { return player[category] }
                }).flat();

                const itemsFiltered = allItems.filter((item) => item !== null && item !== undefined);
                const uniqueItems = [...new Set(itemsFiltered)];
                uniqueItems.forEach((item) => {
                    const dataItem = data[category][item];
                    incrementItem(dataItem, difficulty, missionLen, 'games');
                })
            }
        })
    })

    categories.forEach((key) => {
        sortByLoadouts(data, key);
        generateValues(data, key);
    })

    return data;
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

const incrementItem = (dataItem, difficulty, mission, key = 'loadouts') => {
    dataItem.total[key]++;
    dataItem.diffs[difficulty] && dataItem.diffs[difficulty][key]++;
    dataItem.missions[mission] && dataItem.missions[mission][key]++;
}
const sortByLoadouts = (data, key) => {
    const items = data[key];
    const sorted = Object.entries(items)
        .sort(([, a], [, b]) => b.total.loadouts - a.total.loadouts);
    data[key] = Object.fromEntries(sorted);
}

const incrementLevel = (dataItem, level) => {
    dataItem.totallvl.count++;
    dataItem.totallvl.acc = Number(dataItem.totallvl.acc) + Number(level);
    const lvlRounded = Math.min(150, Math.ceil(level / 50) * 50);
    if (dataItem.levels[lvlRounded]) {
        dataItem.levels[lvlRounded]++;
    } else {
        dataItem.levels[lvlRounded] = 1;
    }
}

const incrementCompanions = (dataItem, player, item) => {
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

const generateValues = (data, key) => {
    const items = data[key];
    let index = 1;
    for (const value in items) {
        const item = items[value];

        const rank_category = key !== 'armor' ? getItemRank(value, getItemsByCategory(items, itemsDict[value].category)) : -1;

        let values = {
            loadouts: -1,
            games: -1,
            avgLevel: -1,
            rank: -1,
            rank_category: -1
        }
        if (item.total.loadouts > 0) {
            values = {
                loadouts_total: item.total.loadouts,
                loadouts: getPercentage(item.total.loadouts, data.total[key].loadouts),
                games: getPercentage(item.total.games, data.total[key].games),
                avgLevel: Number((item.totallvl.acc / item.totallvl.count).toFixed(0)),
                rank: index,
                rank_category
            };
        }
        item.values = values;
        index++;

        const companions = item?.companions;
        if (companions) {
            item.companions.strategem = strategemCompanionsByCategory(companions.strategem);
            item.companions.weapons = weaponCompanionsByCategory(companions.weapons);
        }
    }
}

const getItemRank = (key, data) => {
    const rankIndex = Object.entries(data).findIndex(item => item[0] === key);
    return rankIndex + 1;
}

const getItemsByCategory = (data, category) => {
    const filtered = Object.fromEntries(Object.entries(data).filter(([key, value]) =>
        itemsDict[key].category === category
    ));
    return filtered;
}

const getHistoryDict = (itemNames) => {
    const result = {};
    const createEntries = (names) =>
        names.reduce((acc, name) => {
            acc[name] = { values: [] };
            return acc;
        }, {});

    factions.forEach(faction => {
        result[faction] = {
            totals: [],
            items: createEntries(itemNames),
        };
    });

    return result;
};


const getDictObj = () => {
    const strategemNames = Object.keys(strategemsDict);
    const weaponNames = Object.keys(weaponsDict);

    return {
        total: {
            strategem: {
                loadouts: 0,
                games: 0,
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
            },
            weapons: {
                loadouts: 0,
                games: 0,
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
            },
            armor: {
                loadouts: 0,
                games: 0,
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

            };
            return acc;
        }, {}),
        armor: armorNames.reduce((acc, armor) => {
            acc[armor.toUpperCase()] = {
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
            };
            return acc;
        }, {}),
    };
}

module.exports = {
    parseMissionValues,
    mergeItemData,
    extractKeyFromFactions,
    getPercentage,
    getDictObj,
    getHistoryDict,
    getItemsByCategory,
    getItemRank,
    weaponCompanionsByCategory,
    generateValues,
    incrementCompanions,
    incrementLevel,
    sortByLoadouts,
    incrementItem,
    getHistoricalData,
    parseDiffsValues,
    saveCategoryData,
    computeFactionTotals,
    buildFilter,
    getMissionsByLength
};