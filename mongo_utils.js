const {
    GameModel,
} = require('./mongo');

async function getTotals(match) {
    const pipeline = [
      { $match: match },
      { $addFields: {
          validPlayers: {
            $size: {
              $filter: {
                input: "$players",
                as: "p",
                cond: {
                  $and: [
                    { $ne: ["$$p", null] },
                    { $cond: [
                        { $isArray: "$$p.strategem" },
                        { $eq: [
                            { $size: "$$p.strategem" },
                            { $size: { $filter: { input: "$$p.strategem", cond: { $ne: ["$$this", null] } } } }
                          ]
                        },
                        false
                      ]
                    }
                  ]
                }
              }
            }
          }
      } },
      { $group: {
          _id: null,
          total_loadouts: { $sum: "$validPlayers" },
          total_games: { $sum: { $cond: [{ $gt: ["$validPlayers", 0] }, 1, 0] } }
      } }
    ];
  
    const totals = (await GameModel.aggregate(pipeline))[0] || {
      total_loadouts: 0,
      total_games: 0
    };
  
    return totals;
  }
async function getItemStats(match, field, isArray = true) {
    const path = `players.${field}`;

    const validPlayerMatch = isArray
        ? {
            $expr: {
                $and: [
                    { $isArray: `$${path}` },
                    { $gt: [{ $size: `$${path}` }, 0] },
                    {
                        $eq: [
                            { $size: `$${path}` },
                            {
                                $size: {
                                    $filter: {
                                        input: `$${path}`,
                                        as: "item",
                                        cond: { $ne: ["$$item", null] }
                                    }
                                }
                            }
                        ]
                    }
                ]
            }
        }
        : { [path]: { $ne: null } };

    const pipeline = [
        { $match: match },

        { $unwind: "$players" },

        { $match: validPlayerMatch },

        {
            $facet: {
                player_count: [
                    { $count: "total_valid_players" }
                ],

                item_stats: [
                    ...(isArray
                        ? [
                            { $unwind: `$${path}` },
                            { $match: { [path]: { $ne: null } } }
                        ]
                        : []),

                    {
                        $group: {
                            _id: `$${path}`,
                            total_times_played: { $sum: 1 },
                            sum_levels: {
                                $sum: {
                                    $cond: [
                                        { $ifNull: ["$players.level", false] },
                                        { $toInt: "$players.level" },
                                        0
                                    ]
                                }
                            },
                            valid_level_count: {
                                $sum: {
                                    $cond: [{ $ifNull: ["$players.level", false] }, 1, 0]
                                }
                            }
                        }
                    }
                ]
            }
        },

        {
            $project: {
                total_valid_players: {
                    $arrayElemAt: ["$player_count.total_valid_players", 0]
                },
                item_stats: 1
            }
        },

        { $unwind: "$item_stats" },

        {
            $project: {
                item: "$item_stats._id",
                total_times_played: "$item_stats.total_times_played",

                percentage_loadouts: {
                    $round: [
                        {
                            $multiply: [
                                {
                                    $divide: [
                                        "$item_stats.total_times_played",
                                        "$total_valid_players"
                                    ]
                                },
                                100
                            ]
                        },
                        1
                    ]
                },

                avg_level: {
                    $cond: [
                        { $eq: ["$item_stats.valid_level_count", 0] },
                        null,
                        {
                            $round: [
                                {
                                    $divide: [
                                        "$item_stats.sum_levels",
                                        "$item_stats.valid_level_count"
                                    ]
                                },
                                0
                            ]
                        }
                    ]
                }
            }
        },

        { $sort: { percentage_loadouts: -1 } }
    ];

    return GameModel.aggregate(pipeline);
}

module.exports = {
    getTotals,
    getItemStats
};