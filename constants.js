
const strategemCategories = ["Eagle/Orbital", "Support", "Defensive"];
const weaponCategories = ["Primary", "Secondary", "Throwable"];
const categories = ['strategem', 'weapons', 'armor'];
const factions = ["terminid", "automaton", "illuminate"];
const missionList = ["All", "Long", "Short"];
const difficultyList = [0, 7, 8, 9, 10];

const patchPeriods = [
    { id: 0, name: "Classic", start: "04/01/2024", end: "08/06/2024" },
    { id: 1, name: "Escalation of Freedom", start: "08/06/2024", end: "12/12/2024" },
    { id: 2, name: "Omens of Tyranny", start: "12/12/2024", end: "02/08/2025" },
    { id: 3, name: "Servants of Freedom", start: "02/08/2025", end: "03/19/2025" },
    { id: 4, name: "Borderline Justice", start: "03/19/2025", end: "05/15/2025" },
    { id: 5, name: "Masters Of Ceremony", start: "05/15/2025", end: "06/12/2025" },
    { id: 6, name: "Force Of Law", start: "06/12/2025", end: "07/17/2025" },
    { id: 7, name: "Control Group", start: "07/17/2025", end: "09/03/2025" },
    { id: 8, name: "Into the Unjust", start: "09/04/2025", end: "10/23/2025" },
    { id: 9, name: "Into the Unjust 4.1", start: "10/23/2025", end: "12/30/2025" },
    { id: 10, name: "Machinery Of Oppression", start: "02/10/2026", end: "03/16/2026" },
    { id: 11, name: "Entrenched Division", start: "03/17/2026", end: "04/27/2026" },
    { id: 12, name: "Exo Experts", start: "04/27/2026", end: "08/11/2026" },
    { id: 13, name: "Devoid of Liberty", start: "08/12/2026", end: "Present" },
];

const modifierNames = {
    terminid: [
        "ALL",
        "RUPTURE STRAIN",
        "PREDATOR STRAIN",
        "SPORE BURST STRAIN",
        "DRAGONROACHES",
        "HIVE LORDS",
        "NONE",
    ],
    automaton: [
        "ALL",
        "THE INCENERATION CORPS",
        "JET BRIGADE FACTORIES",
        "CYBORGS",
        "HEAVY ARMOR SURGE",
        "HULK SURGE",
        "NONE",
    ],
    illuminate: [
        "ALL",
        "MINDLESS MASSES",
        "APPROPRIATORS",
        "VOTE SNATCHERS"
    ]

};

const armorNames = [
    'Servo-Assisted',
    'Fortified',
    'Extra Padding',
    'Med-Kit',
    'Engineering Kit',
    'Inflammable',
    'Advanced Filtration',
    'Siege-Ready',
    'Gunslinger',
    'Democracy Protects',
    'Scout',
    'Electrical Conduit',
    'Unflinching',
    'Acclimated',
    'Integrated Explosives',
    'Reinforced Epaulettes',
    'Peak Physique',
    'Ballistic Padding',
    'Adreno-Defibrillator',
    'Feet First',
    'Desert Stormer',
    'Rock Solid',
    'Reduced Signature',
    'Supplementary Adrenaline',
    'Concussive Padding, Grenadier',
    'Concussive Padding, Hazmat',
    'Concussive Padding, Reinforced',
    'True Grit'
];

const missionNames = [
    [
        "LAUNCH ICBM",
        "ENABLE E-710 EXTRACTION",
        "RETRIEVE VALUABLE DATA",
        "SPREAD DEMOCRACY",
        "PURGE HATCHERIES",
        "NUKE NURSERY",
        "EMERGENCY EVACUATION",
        "CONDUCT GEOLOGICAL SURVEY",
        "DEPLOY DARK FLUID",
        "DESTROY COMMAND BUNKERS",
        "SABOTAGE AIR BASE",
        "FREE COLONY",
        "EVACUATE COLONISTS",
        "RETRIEVE RECON CRAFT INTEL",
        "NEUTRALIZE ORBITAL DEFENSES",
        "ENABLE OIL EXTRACTION",
        "COLLECT METEOROLOGICAL DATA",
        "COLLECT GLOOM SPORE READINGS",
        "EXTRACT RESEARCH PROBE DATA",
        "COLLECT GLOOM-INFUSED OIL",
        "CHART TERMINID TUNNELS",
        "FREE THE CITY",
        "TAKE DOWN OVERSHIP",
        "EVACUATE CITIZENS",
        "RESTORE AIR QUALITY",
        "SABOTAGE SUPPLY BASES",
        "CLEANSE INFESTED DISTRICT",
        "DESTROY SPORE LUNG",
        "EXTRACT E-711",
        "CONDUCT MOBILE E-711 EXTRACTION",
        "RESTART PUMPS",
        "NEUTRALIZE GROUND-TO-ORBIT DEFENSES",
        "HALT CYBORG PRODUCTION",
        "COMMANDO: AQUIRE EVIDENCE",
        "COMMANDO: EXTRACT INTEL",
        "COMMANDO: SECURE BLACK BOX",
        "CONFISCATE ASSETS",
        "DESTROY EXOSPIRE",
        "SABOTAGE ORGO-PLASMA SYNTHESIS",
        "ANNEX UNTAPPED MINERAL SITES",
        "SEIZE INDUSTRIAL COMPLEX",
        "RAPID AQUISITION",
        "DESTROY GAZER SPIRE",
        "DEMOCRATIZE THE VOID",
        "EXTRACT ANOMALOUS MATERIAL"
    ],
    [
        "ERADICATE TERMINID SWARM",
        "ERADICATE AUTOMATON FORCES",
        "BLITZ: SEARCH AND DESTROY",
        "BLITZ: DESTROY ILLUMINATE WARP SHIPS",
        "EVACUATE HIGH-VALUE ASSETS",
        "DEFEND EVACUATION SITE",
        "RETRIEVE ESSENTIAL PERSONNEL",
        "BLITZ: SECURE RESEARCH SITE",
        "BLITZ: DESTROY BIO-PROCESSORS",
        "REPEL INVASION FLEET"
    ],
];

const createItem = (baseName, fullName, category) => ({
    name: baseName,
    nameFull: fullName,
    category,
});

const strategemsDict = {
    backpack_ballistic: createItem("Ballistic Shield Backpack", "SH-20 Ballistic Shield Backpack", "Support"),
    backpack_jump: createItem("Jump Pack", "LIFT-850 Jump Pack", "Support"),
    hover_pack: createItem("Hover Pack", "LIFT-860 Hover Pack", "Support"),
    backpack_shield: createItem("Shield Generator Pack", "SH-32 Shield Generator Pack", "Support"),
    backpack_shield_directional: createItem("Directional Shield", "SH-51 Directional Shield", "Support"),
    backpack_supply: createItem("Supply Pack", "B-1 Supply Pack", "Support"),
    backpack_hellbomb: createItem("Portable Hellbomb", "B-100 Portable Hellbomb", "Support"),
    barrage_120: createItem("Orbital 120MM HE Barrage", "Orbital 120MM HE Barrage", "Eagle/Orbital"),
    barrage_380: createItem("Orbital 380MM HE Barrage", "Orbital 380MM HE Barrage", "Eagle/Orbital"),
    barrage_gatling: createItem("Orbital Gatling Barrage", "Orbital Gatling Barrage", "Eagle/Orbital"),
    barrage_napalm: createItem("Orbital Napalm Barrage", "Orbital Napalm Barrage", "Eagle/Orbital"),
    barrage_walking: createItem("Orbital Walking Barrage", "Orbital Walking Barrage", "Eagle/Orbital"),
    eagle_110mm: createItem("Eagle 110MM Rocket Pods", "Eagle 110MM Rocket Pods", "Eagle/Orbital"),
    eagle_500kg: createItem("Eagle 500KG Bomb", "Eagle 500KG Bomb", "Eagle/Orbital"),
    eagle_airstrike: createItem("Eagle Airstrike", "Eagle Airstrike", "Eagle/Orbital"),
    eagle_cluster: createItem("Eagle Cluster Bomb", "Eagle Cluster Bomb", "Eagle/Orbital"),
    eagle_napalm: createItem("Eagle Napalm Airstrike", "Eagle Napalm Airstrike", "Eagle/Orbital"),
    eagle_smoke: createItem("Eagle Smoke Strike", "Eagle Smoke Strike", "Eagle/Orbital"),
    eagle_strafe: createItem("Eagle Strafing Run", "Eagle Strafing Run", "Eagle/Orbital"),
    encampment_hmg: createItem("HMG Emplacement", "E/MG-101 HMG Emplacement", "Defensive"),
    encampment_at: createItem("Anti-Tank Emplacement", "E/AT-12 Anti-Tank Emplacement", "Defensive"),
    grenade_encampment: createItem("Grenadier Battlement", "E/GL-21 Grenadier Battlement", "Defensive"),
    exo_emancipator: createItem("Emancipator Exosuit", "EXO-49 Emancipator Exosuit", "Support"),
    exo_patriot: createItem("Patriot Exosuit", "EXO-45 Patriot Exosuit", "Support"),
    frv: createItem("Fast Recon Vehicle", "M-102 Fast Recon Vehicle", "Support"),
    guard_breath: createItem("Guard Dog Breath", "AX/TX-13 Guard Dog Breath", "Support"),
    guard_dog: createItem("Guard Dog", "AD-334 Guard Dog", "Support"),
    guard_rover: createItem("Guard Dog Rover", "AX/LAS-5 Guard Dog Rover", "Support"),
    guard_arc: createItem("Guard Dog Arc", "AX/ARC-3 Guard Dog K-9", "Support"),
    mines_at: createItem("Anti-Tank Mines", "MD-17 Anti-Tank Mines", "Defensive"),
    mines_incendiary: createItem("Incendiary Mines", "MD-I4 Incendiary Mines", "Defensive"),
    mines_infantry: createItem("Anti-Personnel Minefield", "MD-6 Anti-Personnel Minefield", "Defensive"),
    mines_gas: createItem("Gas Mines", "MD-8 Gas Mines", "Defensive"),
    orbital_airburst: createItem("Orbital Airburst Strike", "Orbital Airburst Strike", "Eagle/Orbital"),
    orbital_ems: createItem("Orbital EMS Strike", "Orbital EMS Strike", "Eagle/Orbital"),
    orbital_gas: createItem("Orbital Gas Strike", "Orbital Gas Strike", "Eagle/Orbital"),
    orbital_laser: createItem("Orbital Laser", "Orbital Laser", "Eagle/Orbital"),
    orbital_precision: createItem("Orbital Precision Strike", "Orbital Precision Strike", "Eagle/Orbital"),
    orbital_railcannon: createItem("Orbital Railcannon Strike", "Orbital Railcannon Strike", "Eagle/Orbital"),
    orbital_smoke: createItem("Orbital Smoke Strike", "Orbital Smoke Strike", "Eagle/Orbital"),
    sentry_arc: createItem("Tesla Tower", "A/ARC-3 Tesla Tower", "Defensive"),
    sentry_autocannon: createItem("Autocannon Sentry", "A/AC-8 Autocannon Sentry", "Defensive"),
    sentry_ems: createItem("EMS Mortar Sentry", "A/M-23 EMS Mortar Sentry", "Defensive"),
    sentry_flame: createItem("Flame Sentry", "A/FLAM-40 Flame Sentry", "Defensive"),
    sentry_gatling: createItem("Gatling Sentry", "A/G-16 Gatling Sentry", "Defensive"),
    sentry_mg: createItem("Machine Gun Sentry", "A/MG-43 Machine Gun Sentry", "Defensive"),
    sentry_mortar: createItem("Mortar Sentry", "A/M-12 Mortar Sentry", "Defensive"),
    sentry_rocket: createItem("Rocket Sentry", "A/MLS-4X Rocket Sentry", "Defensive"),
    shield_relay: createItem("Shield Generator Relay", "FX-12 Shield Generator Relay", "Defensive"),
    sup_airburst_launcher: createItem("Airburst Rocket Launcher", "RL-77 Airburst Rocket Launcher", "Support"),
    sup_amr: createItem("Anti-Materiel Rifle", "APW-1 Anti-Materiel Rifle", "Support"),
    sup_arc_thrower: createItem("Arc Thrower", "ARC-3 Arc Thrower", "Support"),
    sup_autocannon: createItem("Autocannon", "AC-8 Autocannon", "Support"),
    sup_commando: createItem("Commando", "MLS-4X Commando", "Support"),
    sup_eat: createItem("Expendable Anti-Tank", "EAT-17 Expendable Anti-Tank", "Support"),
    sup_flamethrower: createItem("Flamethrower", "FLAM-40 Flamethrower", "Support"),
    sup_grenade_launcher: createItem("Grenade Launcher", "GL-21 Grenade Launcher", "Support"),
    sup_hmg: createItem("Heavy Machine Gun", "MG-206 Heavy Machine Gun", "Support"),
    sup_laser_cannon: createItem("Laser Cannon", "LAS-98 Laser Cannon", "Support"),
    sup_mg: createItem("Machine Gun", "MG-43 Machine Gun", "Support"),
    sup_quasar_cannon: createItem("Quasar Cannon", "LAS-99 Quasar Cannon", "Support"),
    sup_railgun: createItem("Railgun", "RS-422 Railgun", "Support"),
    sup_recoilless_rifle: createItem("Recoilless Rifle", "GR-8 Recoilless Rifle", "Support"),
    sup_spear: createItem("Spear", "FAF-14 Spear", "Support"),
    sup_stalwart: createItem("Stalwart", "M-105 Stalwart", "Support"),
    sup_sterilizer: createItem("Sterilizer", "TX-41 Sterilizer", "Support"),
    sup_wasp: createItem("Wasp", "StA-X3 W.A.S.P. Launcher", "Support"),
    flag: createItem("One True Flag", "One True Flag", "Support"),
    sup_deescalator: createItem("De-Escalator", "GL-52 De-Escalator", "Support"),
    sup_epoch: createItem("Epoch", "PLAS-45 Epoch", "Support"),
    backpack_warp: createItem("Warp Pack", "LIFT-182 Warp Pack", "Support"),
    sentry_laser: createItem("Laser Sentry", "A/LAS-98 Laser Sentry", "Defensive"),
    sup_speargun: createItem("Speargun", "One True Flag", "Support"),
    sup_eat_700: createItem("Expendable Napalm", "One True Flag", "Support"),
    sup_solo_silo: createItem("Solo Silo", "One True Flag", "Support"),
    guard_hot: createItem("Hot Dog", "AX/FLAM-75 Hot Dog", "Support"),
    sup_defoliation_tool: createItem("Defoliation Tool", "CQC-9 Defoliation Tool", "Support"),
    sup_maxigun: createItem("Maxigun", "M-1000 Maxigun", "Support"),
    sup_c4_pack: createItem("C4 Pack", "B/MD C4 Pack", "Support"),
    sup_breaching_hammer: createItem("Breaching Hammer", "CQC-20 Breaching Hammer", "Support"),
    sup_leveller: createItem("Leveller", "EAT-411 Leveller", "Support"),
    sup_belt_fed_gl: createItem("Belt-fed GL", "GL-28 Belt-fed GL", "Support"),
    bastion: createItem("Bastion", "TD-220 Bastion", "Support"),
    sup_cremator: createItem("Cremator", "B/FLAM-80 Cremator", "Support"),
    sentry_gas: createItem("Gas Mortar", "A/GM-17 Gas Mortar Sentry", "Defensive"),
    sup_bullet_storm: createItem("Bullet Storm", "MGX-42 Bullet Storm", "Support"),
    exo_lumberer: createItem("Lumberer Exosuit", "EXO-51 Lumberer Exosuit", "Support"),
    exo_breakthrough: createItem("Breakthrough Exosuit", "EXO-55 Breakthrough Exosuit", "Support"),
    sup_melta: createItem("Meltagun", "40-K Meltagun", "Support"),
    frv_supply: createItem("Supply FRV", "M-103 Supply FRV", "Support"),
};

const weaponsDict = {
    liberator: createItem("Liberator", "AR-23 Liberator", "Primary", 'webp'),
    liberator_pen: createItem("Liberator Penetrator", "AR-23P Liberator Penetrator", "Primary", 'webp'),
    liberator_conc: createItem("Liberator Concussive", "AR-23C Liberator Concussive", "Primary", 'webp'),
    liberator_car: createItem("Liberator Carabine", "AR-23A Liberator Carabine", "Primary", 'webp'),
    sta_52: createItem("StA-52", "StA-52 Assault Rifle", "Primary", 'webp'),
    tenderizer: createItem("Tenderizer", "AR-61 Tenderizer", "Primary", 'webp'),
    adjucator: createItem("Adjudicator", "BR-14 Adjudicator", "Primary", 'webp'),
    constitution: createItem("Constitution", "R-2124 Constitution", "Primary", 'webp'),
    diligence: createItem("Diligence", "R-63 Diligence", "Primary", 'webp'),
    diligence_cs: createItem("Diligence Counter Sniper", "R-63CS Diligence Counter Sniper", "Primary", 'webp'),
    accelerator: createItem("Accelerator Rifle", "PLAS-39 Accelerator Rifle", "Primary", 'webp'),
    knight: createItem("Knight", "MP-98 Knight", "Primary", 'webp'),
    sta_11: createItem("StA-11", "StA-11 SMG", "Primary", 'webp'),
    reprimand: createItem("Reprimand", "SMG-32 Reprimand", "Primary", 'webp'),
    defender: createItem("Defender", "SMG-37 Defender", "Primary", 'webp'),
    pummeler: createItem("Pummeler", "SMG-72 Pummeler", "Primary", 'webp'),
    punisher: createItem("Punisher", "SG-8 Punisher", "Primary", 'webp'),
    slugger: createItem("Slugger", "SG-8S Slugger", "Primary", 'webp'),
    halt: createItem("Halt", "SG-20 Halt", "Primary", 'webp'),
    cookout: createItem("Cookout", "SG-451 Cookout", "Primary", 'webp'),
    breaker: createItem("Breaker", "SG-225 Breaker", "Primary", 'webp'),
    spray_n_pray: createItem("Breaker Spray&Pray", "SG-225SP Breaker Spray & Pray", "Primary", 'webp'),
    breaker_inc: createItem("Breaker Incendiary", "SG-225IE Breaker Incendiary", "Primary", 'webp'),
    crossbow: createItem("Exploding Crossbow", "CB-9 Exploding Crossbow", "Primary", 'webp'),
    eruptor: createItem("Eruptor", "R-36 Eruptor", "Primary", 'webp'),
    punisher_plas: createItem("Punisher Plasma", "SG-8P Punisher Plasma", "Primary", 'webp'),
    blitzer: createItem("Blitzer", "ARC-12 Blitzer", "Primary", 'webp'),
    scythe: createItem("Scythe", "LAS-5 Scythe", "Primary", 'webp'),
    sickle: createItem("Sickle", "LAS-16 Sickle", "Primary", 'webp'),
    sickle_d: createItem("Double Edge Sickle", "LAS-17 Double-Edge Sickle", "Primary", 'webp'),
    scorcher: createItem("Scorcher", "PLAS-1 Scorcher", "Primary", 'webp'),
    purifier: createItem("Purifier", "PLAS-101 Purifier", "Primary", 'webp'),
    torcher: createItem("Torcher", "FLAM-66 Torcher", "Primary", 'webp'),
    dominator: createItem("Dominator", "JAR-5 Dominator", "Primary", 'webp'),
    deadeye: createItem("Deadeye", "R-6 Deadeye", "Primary", 'webp'),
    amendment: createItem("Amendment", "R-2 Amendment", "Primary", 'webp'),
    pacifier: createItem("Pacifier", "AR-32 Pacifier", "Primary", 'webp'),
    variable: createItem("Variable", "VG-70 Variable", "Primary", 'webp'),
    m7s: createItem("M7S", "M7S SMG", "Primary", 'webp'),
    m90a: createItem("M90A", "M90A Shotgun", "Primary", 'webp'),
    ma5c: createItem("MA5C", "MA5C Assault Rifle", "Primary", 'webp'),
    coyote: createItem("Coyote", "AR-2 Coyote", "Primary", 'webp'),
    one_two: createItem("One-Two", "AR/GL-21 One-Two", "Primary", 'webp'),
    double_freedom: createItem("Double Freedom", "DBS-2 Double Freedom", "Primary", 'webp'),
    censor: createItem("Censor", "R-72 Censor", "Primary", 'webp'),
    suppressor: createItem("Suppressor", "AR-59 Suppressor", "Primary", 'webp'),
    trident: createItem("Trident", "LAS-13 Trident", "Primary", 'webp'),
    stoker: createItem("Stoker", "SMG/FLAM-34 Stoker", "Primary", 'webp'),
    sweeper: createItem("Sweeper", "SG-97 Sweeper", "Primary", 'webp'),
    gallant: createItem("Gallant", "SMG-203 Gallant", "Primary", 'webp'),
    hot_shot: createItem("Hot Shot", "40-K Hot-Shot", "Primary", 'webp'),

    peacemaker: createItem("Peacemaker", "P-2 Peacemaker", "Secondary", 'webp'),
    redeemer: createItem("Redeemer", "P-19 Redeemer", "Secondary", 'webp'),
    verdict: createItem("Verdict", "P-113 Verdict", "Secondary", 'webp'),
    senator: createItem("Senator", "P-4 Senator", "Secondary", 'webp'),
    talon: createItem("Talon", "LAS-58 Talon", "Secondary", 'webp'),
    warrant: createItem("Warrant", "P-92 Warrant", "Secondary", 'webp'),
    sabre: createItem("Saber", "CQC-2 Saber", "Secondary", 'webp'),
    shock_lance: createItem("Stun Lance", "CQC-19 Stun Lance", "Secondary", 'webp'),
    shock_batton: createItem("Stun Batton", "CQC-30 Stun Baton", "Secondary", 'webp'),
    axe: createItem("Combat Hatchet", "CQC-5 Combat Hatchet", "Secondary", 'webp'),
    stim_pistol: createItem("Stim Pistol", "P-11 Stim Pistol", "Secondary", 'webp'),
    bushwacker: createItem("Bushwacker", "SG-22 Bushwhacker", "Secondary", 'webp'),
    crisper: createItem("Crisper", "P-72 Crisper", "Secondary", 'webp'),
    grenade_pistol: createItem("Grenade Pistol", "GP-31 Grenade Pistol", "Secondary", 'webp'),
    laser_pistol: createItem("Dagger", "LAS-7 Dagger", "Secondary", 'webp'),
    ultimatum: createItem("Ultimatum", "GP-20 Ultimatum", "Secondary", 'webp'),
    loyalist: createItem("Loyalist", "PLAS-15 Loyalist", "Secondary", 'webp'),
    m6c: createItem("M6C", "M6C/SOCOM Pistol", "Secondary", 'webp'),
    machete: createItem("Machete", "CQC-42 Machete", "Secondary", 'webp'),
    re_educator: createItem("Re-Educator", "P-35 Re-Educator", "Secondary", 'webp'),
    entrenchment_tool: createItem("Entrenchment Tool", "CQC-73 Entrenchment Tool", "Secondary", 'webp'),
    veto: createItem("Veto", "P-69 Veto", "Secondary", 'webp'),
    missile_pistol: createItem("Missile Pistol", "P-33 Missile Pistol", "Secondary", 'webp'),
    bolt_pistol: createItem("Bolt Pistol", "40-K Bolt_Pistol", "Secondary", 'webp'),

    grenade_frag: createItem("Frag", "G-6 Frag", "Throwable", 'webp'),
    grenade_he: createItem("High Explosive", "G-12 High Explosive", "Throwable", 'webp'),
    grenade_inc: createItem("Incendiary", "G-10 Incendiary", "Throwable", 'webp'),
    grenade_impact: createItem("Impact", "G-16 Impact", "Throwable", 'webp'),
    grenade_inc_impact: createItem("Incendiary Impact", "G-13 Incendiary Impact", "Throwable", 'webp'),
    grenade_stun: createItem("Stun", "G-23 Stun", "Throwable", 'webp'),
    grenade_gas: createItem("Gas", "G-4 Gas", "Throwable", 'webp'),
    grenade_drone: createItem("Seeker", "G-50 Seeker", "Throwable", 'webp'),
    grenade_smoke: createItem("Smoke", "G-3 Smoke", "Throwable", 'webp'),
    grenade_termite: createItem("Thermite", "G-123 Thermite", "Throwable", 'webp'),
    throwing_knife: createItem("Throwing Knife", "K-2 Throwing Knife", "Throwable", 'webp'),
    dynamite: createItem("Dynamite", "TED-63 Dynamite", "Throwable", 'webp'),
    grenade_pyro: createItem("Pyrotech", "G-142 Pyrotech", "Throwable", 'webp'),
    urchin: createItem("Urchin", "G-109 Urchin", "Throwable", 'webp'),
    grenade_arc: createItem("Arc", "G-31 Arc", "Throwable", 'webp'),
    pineapple: createItem("Pineapple", "G-7 Pineapple", "Throwable", 'webp'),
    lure_mine: createItem("Lure Mine", "TM-1 Lure Mine", "Throwable", 'webp'),
    grenade_smokescreen: createItem("Smokescreen", "G-89 Smokescreen", "Throwable", 'webp'),
    grenade_shield: createItem("Shield", "G/SH-39 Shield", "Throwable", 'webp'),
    giga_grenade: createItem("Giga Grenade", "G-48 Giga Grenade", "Throwable", 'webp'),
    melta_mine: createItem("Melta Mine", "G/40-K Melta Mine", "Throwable", 'webp'),

};

const itemsDict = { ...strategemsDict, ...weaponsDict };

const defaultDetailsItem = {
    "terminid": {
        "total": {
            "loadouts": 0,
            "games": 0
        },
    },
    "automaton": {
        "total": {
            "loadouts": 0,
            "games": 0
        },
    },
    "illuminate": {
        "total": {
            "loadouts": 0,
            "games": 0
        },
    },

};

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

const getTotalsDict = () => {
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
    factions,
    patchPeriods,
    missionNames,
    strategemsDict,
    weaponsDict,
    itemsDict,
    armorNames,
    categories,
    missionList,
    difficultyList,
    strategemCategories,
    weaponCategories,
    getHistoryDict,
    getTotalsDict,
    modifierNames,
    defaultDetailsItem
};
