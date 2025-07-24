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
});

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

const GameModel = mongoose.model("matches", gameSchema);
const StrategemModel = mongoose.model("strategem", totalsSchema);
const WeaponModel = mongoose.model("weapon", totalsSchema);
const ArmorModel = mongoose.model("armor", totalsSchema);

module.exports = {
    GameModel,
    StrategemModel,
    WeaponModel,
    ArmorModel
};