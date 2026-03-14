const mongoose = require('mongoose');
const mKey = encodeURIComponent('Crtstr#21');
mongoose.connect(`mongodb+srv://martindzhonov:${mKey}@serverlessinstance0.hrhcm0l.mongodb.net/hd`);

const gameSchema = new mongoose.Schema({
    id: { type: Number, unique: true },
    faction: String,
    planet: String,
    difficulty: Number,
    mission: String,
    createdAt: Date,
    players: [
        {
            strategem: [String],
            weapons: [String],
            armor: String,
            level: String
        }
    ],
    modifiers: [],
    subfactions: []
});

const CompanionsSchema = new mongoose.Schema({
    patch_id: { type: Number, required: true, unique: true, index: true },
    items: { type: Object, required: true }
}, {
    timestamps: true
})

const ItemsRecencySchema = new mongoose.Schema({
    patch: {
        type: Number,
        required: true,
        unique: true
    },
    items: {
        type: [String],
        default: []
    }
});

const ItemDetailsSchema = new mongoose.Schema({
    patch: {
        type: Number,
        required: true,
        unique: true
    },
    items: {
    }
});

const itemSchema = new mongoose.Schema({
    loadouts: Number,
    games: Number,
    lvl_avg: Number,
    levelCount: Number,
    levels: { type: Map, of: Number }, // keys are bucket numbers, values are counts
    isFirstPatch: Boolean
}, { _id: false });

const aggregateSchema = new mongoose.Schema({
    patch: Number,
    faction: String,
    difficulty: Number,
    mission: String,
    modifier: String,
    totals: {
        games: Number,
        loadouts: Number
    },
    items: { type: Map, of: itemSchema }

}, { versionKey: false });

gameSchema.index({ createdAt: 1 })

aggregateSchema.index({
    faction: 1,
    difficulty: 1,
    mission: 1,
    modifier: 1,
    patch: 1
   }, { unique: true })


const GameModel = mongoose.model("matches", gameSchema);
const StrategemAggregateModel = mongoose.model("aggregate_strategem", aggregateSchema);
const WeaponAggregateModel = mongoose.model("aggregate_weapon", aggregateSchema);
const ArmorAggregateModel = mongoose.model("aggregate_armor", aggregateSchema);
const CompanionsModel = mongoose.model('item_companions', CompanionsSchema)
const ItemRecencyModel = mongoose.model('item_recency', ItemsRecencySchema);
const StrategemDetailsModel = mongoose.model('details_strategem', ItemDetailsSchema);
const WeaponDetailsModel = mongoose.model('details_weapon', ItemDetailsSchema);

const totalsSchema = new mongoose.Schema({
    filter: {
        patch: Number,
        difficulty: Number,
        mission: String
    },
    terminid: {},
    automaton: {},
    illuminate: {}
});

const StrategemModel = mongoose.model("strategem", totalsSchema);
const WeaponModel = mongoose.model("weapon", totalsSchema);
const ArmorModel = mongoose.model("armor", totalsSchema);

module.exports = {
    GameModel,
    StrategemModel,
    WeaponModel,
    ArmorModel,
    StrategemAggregateModel,
    WeaponAggregateModel,
    ArmorAggregateModel,
    CompanionsModel,
    ItemRecencyModel,
    StrategemDetailsModel,
    WeaponDetailsModel,
    AggregateModels: {
        strategem: StrategemAggregateModel,
        weapons: WeaponAggregateModel,
        armor: ArmorAggregateModel
    },
    DetailsModels: {
        strategem: StrategemDetailsModel,
        weapons: WeaponDetailsModel
    }
};