import "../styles/App.css";
import { useEffect, useState, useMemo } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import { useParams, useNavigate } from "react-router-dom";
import * as settings from "../settings/chartSettings";
import {
    baseLabels,
    baseIconsSvg,
    apiBaseUrl,
    patchPeriods,
    itemCategories
} from "../constants";
import {
    getItemName,
    getItemColor,
    getCountingSuffix,
    getItemCategory,
    getPercentage,
    getRankedDict,
    getMissionLength,
    filterByPatch
} from "../utils";
import Tooltip from "react-bootstrap/Tooltip";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import StratagemRank from "../components/StratagemRank";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip as ChartTooltip,
    Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";
import useMobile from "../hooks/useMobile";
import GamesTable from "../components/GamesTable";
import BarGraph from "../components/BarGraph";
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    ChartTooltip,
    Legend
);

function StratagemPage() {
    const navigate = useNavigate();
    let { itemId } = useParams();
    let { factionId } = useParams();
    const { isMobile } = useMobile();
    const [factionName, setFactionName] = useState(factionId);
    const [dataLoading, setDataLoading] = useState(true);
    const [data, setData] = useState({
        faction: null,
        stratagem: null
    });
    const [filters, setFilters] = useState({
        period: {
            id: patchPeriods[1].id,
            start: patchPeriods[1].start,
            end: patchPeriods[1].end
        }
    });

    const [graphData, setGraphData] = useState(null);
    const [graphData1, setGraphData1] = useState(null);
    const [graphData2, setGraphData2] = useState(null);
    const [graphData3, setGraphData3] = useState(null);

    useEffect(() => {
        if (factionName && itemId && filters.period) {
            setDataLoading(true);

            const fetchFaction = fetch(apiBaseUrl + `/faction/all`).then(
                (response) => response.json()
            );

            const fetchStratagem = fetch(
                apiBaseUrl + `/games/${factionName}/${itemId}`
            ).then((response) => response.json());

            Promise.all([fetchFaction, fetchStratagem]).then((res) => {
                setData({
                    faction: res[0]
                        .filter((game) => game.faction === factionName)
                        .filter((game) =>
                            filterByPatch(filters.period.id, game)
                        ),
                    stratagem: res[1].filter((game) =>
                        filterByPatch(filters.period.id, game)
                    ),
                    automaton: res[0]
                        .filter((game) => game.faction === "automaton")
                        .filter((game) =>
                            filterByPatch(filters.period.id, game)
                        ),
                    terminid: res[0]
                        .filter((game) => game.faction === "terminid")
                        .filter((game) =>
                            filterByPatch(filters.period.id, game)
                        ),
                    patch300: res[0]
                        .filter((game) => game.faction === factionName)
                        .filter((game) => filterByPatch("1.000.300", game)),
                    patch400: res[0]
                        .filter((game) => game.faction === factionName)
                        .filter((game) => filterByPatch("1.000.400", game))
                });
                setDataLoading(false);
            });
        }
    }, [factionName, itemId, filters]);

    const itemsRankings = useMemo(() => {
        if (data?.faction) {
            const factionDict = getRankedDict(data.faction, "All");
            return factionDict[itemId];
        }
    }, [data]);

    useEffect(() => {
        if (data.faction && data.stratagem) {
            const loadoutsByDiff = { 7: 0, 8: 0, 9: 0 };
            const itemLoadoutsByDiff = Object.assign({}, loadoutsByDiff);
            const loadoutsByMission = { Short: 0, Long: 0 };
            const itemLoadoutsByMission = Object.assign({}, loadoutsByMission);

            data.faction.forEach((game) => {
                game.players.forEach((loadout) => {
                    loadoutsByDiff[game.difficulty]++;
                    loadoutsByMission[getMissionLength(game.missionName)]++;
                });
            });

            data.stratagem.forEach((game) => {
                game.players.forEach((loadout) => {
                    if (loadout.includes(itemId)) {
                        itemLoadoutsByDiff[game.difficulty]++;
                        itemLoadoutsByMission[
                            getMissionLength(game.missionName)
                        ]++;
                    }
                });
            });

            setGraphData({
                labels: !isMobile
                    ? ["7 - Suicide Mission", "8 - Impossible", "9 - Helldive"]
                    : ["7", "8", "9"],
                datasets: [
                    {
                        data: Object.keys(loadoutsByDiff).map((diff, index) => {
                            return getPercentage(
                                itemLoadoutsByDiff[diff],
                                loadoutsByDiff[diff],
                                1
                            );
                        }),
                        backgroundColor: getItemColor(itemId),
                        barThickness: 24
                    }
                ]
            });

            setGraphData1({
                labels: ["Short", "Long"],
                datasets: [
                    {
                        data: Object.keys(loadoutsByMission).map(
                            (name, index) => {
                                return getPercentage(
                                    itemLoadoutsByMission[name],
                                    loadoutsByMission[name],
                                    1
                                );
                            }
                        ),
                        backgroundColor: getItemColor(itemId),
                        barThickness: 24
                    }
                ]
            });

            setGraphData2({
                labels: ["Automaton", "Terminid"],
                datasets: [
                    {
                        data: [
                            getRankedDict(data.automaton, "All")[itemId]
                                .percentageLoadouts,
                            getRankedDict(data.terminid, "All")[itemId]
                                .percentageLoadouts
                        ],
                        backgroundColor: ["#de7b6c", "rgb(255,182,0)"],
                        barThickness: 24
                    }
                ]
            });

            setGraphData3({
                labels: ["Patch 1.000.300", "Patch 1.000.400"],
                datasets: [
                    {
                        data: [
                            getRankedDict(data.patch300, "All")[itemId]
                                .percentageLoadouts,
                            getRankedDict(data.patch400, "All")[itemId]
                                .percentageLoadouts
                        ],
                        backgroundColor: getItemColor(itemId),
                        barThickness: 24
                    }
                ]
            });
        }
    }, [data]);

    function capitalizeFirstLetter(str) {
        if (str.length === 0) return str; // Return the string as is if it is empty
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    return (
        <div className="content-wrapper">
            <div className="item-details-title-wrapper">
                <div className="stratagem-details-title">
                    <div className="item-details-img-wrapper">
                        <img
                            src={baseIconsSvg[baseLabels.indexOf(itemId)]}
                        ></img>
                    </div>
                    <div className="item-details-title-text">
                        {getItemName(itemId, "long")}
                    </div>
                </div>
                <div className="stratagem-details-filters-container">
                    <div className="stratagem-details-filter-container">
                        <DropdownButton
                            className="dropdown-button"
                            title={
                                "Faction: " + capitalizeFirstLetter(factionName)
                            }
                        >
                            <Dropdown.Item
                                as="button"
                                onClick={() => {
                                    setFactionName("terminid");
                                }}
                            >
                                Terminid
                            </Dropdown.Item>
                            <Dropdown.Item
                                as="button"
                                onClick={() => {
                                    setFactionName("automaton");
                                }}
                            >
                                Automaton
                            </Dropdown.Item>
                        </DropdownButton>
                    </div>
                    <div className="stratagem-details-filter-container">
                        <DropdownButton
                            className="dropdown-button"
                            title={"Patch: " + filters.period.id}
                        >
                            {patchPeriods.map((patchPeriod, index) => (
                                <Dropdown.Item
                                    as="button"
                                    onClick={() => {
                                        setFilters({
                                            ...filters,
                                            period: patchPeriod
                                        });
                                    }}
                                >
                                    {`${
                                        patchPeriod.id === "All" ? "" : "Patch"
                                    } ${patchPeriod.id} : ${
                                        patchPeriod.start
                                    } - ${patchPeriod.end}`}
                                </Dropdown.Item>
                            ))}
                        </DropdownButton>
                    </div>
                </div>
            </div>
            <div className="stratagem-divier"></div>
            {dataLoading ? (
                <div className="spinner-faction-container">
                    <div className="lds-dual-ring"></div>
                </div>
            ) : (
                <div className="stratagem-section-container">
                    <div className="stratagem-rankings-container">
                        <StratagemRank
                            text={["in", "All Stratagem"]}
                            value={itemsRankings?.rankTotal}
                            color={"rgb(255,182,0)"}
                            suffix
                        />
                        <StratagemRank
                            text={["in", getItemCategory(itemId)]}
                            value={itemsRankings?.rankCategory}
                            color={getItemColor(itemId)}
                            suffix
                        />
                        <StratagemRank
                            text={["percent", "of matches"]}
                            value={getPercentage(
                                data?.stratagem?.length,
                                data?.faction?.length,
                                1
                            )}
                            color={"rgb(255,182,0)"}
                        />
                        <StratagemRank
                            text={["percent", "of loadouts"]}
                            value={itemsRankings?.percentageLoadouts}
                            color={getItemColor(itemId)}
                        />
                    </div>
                    <div className="stratagem-trends-container">
                        <div className="stratagem-trends-wrapper">
                            {graphData2 && (
                                <div className="stratagem-graph-wrapper-small">
                                    <BarGraph
                                        data={graphData2}
                                        options={{
                                            ...settings.stregemSmallOption
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="stratagem-trends-wrapper">
                            {graphData3 && (
                                <div className="stratagem-graph-wrapper-small">
                                    <BarGraph
                                        data={graphData3}
                                        options={{
                                            ...settings.stregemSmallOption
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <div className="stratagem-graphs-title">Companion Picks</div>
            <div className="stratagem-divier"></div>
            {dataLoading && (
                <div className="spinner-faction-container">
                    <div className="lds-dual-ring"></div>
                </div>
            )}
            {data?.stratagem && !dataLoading && (
                <div className="stratagem-loadouts-wrapper">
                    {itemCategories.map((category) => (
                        <div className="stratagem-loadouts-section-wrapper">
                            <div className="stratagem-loadouts-title">
                                {category}
                            </div>
                            <div class="table-loadout-wrapper">
                                {Object.entries(
                                    getRankedDict(
                                        data?.stratagem,
                                        category,
                                        itemId
                                    )
                                )
                                    .slice(
                                        category === getItemCategory(itemId)
                                            ? 1
                                            : 0,
                                        category === getItemCategory(itemId)
                                            ? 5
                                            : 4
                                    )
                                    .map((item) => (
                                        <OverlayTrigger
                                            overlay={(props) => (
                                                <Tooltip {...props}>
                                                    In{" "}
                                                    {item[1].percentageLoadouts}
                                                    %
                                                    {item[1]
                                                        .percentageLoadouts ===
                                                    100
                                                        ? "(duh)"
                                                        : ""}{" "}
                                                    of stratagem loadouts
                                                </Tooltip>
                                            )}
                                            placement="bottom"
                                        >
                                            <img
                                                className="armory-img-wrapper"
                                                onClick={() =>
                                                    navigate(
                                                        `/armory/${factionName}/${item[0]}`
                                                    )
                                                }
                                                src={
                                                    baseIconsSvg[
                                                        baseLabels.indexOf(
                                                            item[0]
                                                        )
                                                    ]
                                                }
                                                width={40}
                                            />
                                        </OverlayTrigger>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="stratagem-graphs-title">Charts</div>
            <div className="stratagem-divier"></div>
            <div className="stratagem-graphs-wrapper">
                {dataLoading && (
                    <div className="spinner-faction-container">
                        <div className="lds-dual-ring"></div>
                    </div>
                )}
                {graphData && !dataLoading && (
                    <div className="stratagem-graph-wrapper">
                        <div className="stratagem-graph-title">Difficulty</div>
                        <BarGraph
                            data={graphData}
                            options={{
                                ...settings.optionsStratagem,
                                indexAxis: isMobile ? "y" : "x"
                            }}
                        />
                    </div>
                )}
                {graphData1 && !dataLoading && (
                    <div className="stratagem-graph-wrapper">
                        <div className="stratagem-graph-title">
                            Mission Length
                        </div>
                        <BarGraph
                            data={graphData1}
                            options={{
                                ...settings.optionsStratagem,
                                indexAxis: isMobile ? "y" : "x"
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default StratagemPage;