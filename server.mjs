
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import express from "express";
import { getPlayersLoadouts, getTextFromImage, getFaction, deleteFiles, getDifficultyInt } from './utils.js';
import Jimp from "jimp";
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
const port = 3001;
const mongoPass = encodeURIComponent('Crtstr#21')
mongoose.connect(`mongodb+srv://martindzhonov:${mongoPass}@serverlessinstance0.hrhcm0l.mongodb.net/hd`)

const gameSchema = new mongoose.Schema({
    faction: String,
    loadoutImg: String,
    difficulty: Number,
    missionName: String,
    createdAt: String,
    players: [],
})
const GameModel = mongoose.model("game", gameSchema);

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.get('/filter/:id', (req, res) => {

    const factionName = req.params['id'];
    const dirPath = `Screenshots/${factionName}/latest`;

    fs.readdir(dirPath, (err, files) => {
        const promisesArr = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const promise = new Promise((resolve, reject) => {
                Jimp.read(dirPath + '/' + file, (err, image) => {
                    const imageColor = image.getPixelColor(92, 50);
                    const faction = getFaction(Jimp.intToRGBA(imageColor));
                    resolve(file + ":" + faction);
                });
            });
            promisesArr.push(promise);
        }

        const validImages = [];
        Promise.all(promisesArr).then((values) => {
            for (let j = values.length - 1; j > 3; j--) {
                if (j % 10 === 0) {
                    console.log(j)
                }
                const value = values[j];
                const nextValue = values[j - 1];
                const nextNextValue = values[j - 2];
                const splitValue = value.split(":");
                const splitNextValue = nextValue.split(":");
                const splitNextNextValue = nextNextValue.split(":");
                if (splitNextValue[1] !== 'invalid' && splitValue[1] === 'invalid') {
                    validImages.push(splitNextValue[0])
                    validImages.push(splitNextNextValue[0])
                }
            }

            const filesFiltered = files.filter(function (el) {
                return validImages.indexOf(el) < 0;
            }).map((item) => dirPath + '/' + item);

            deleteFiles(filesFiltered, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    res.send('All files removed.');
                }
            });
        });
    });
});

app.get('/generate/:id', (req, res) => {

    const factionName = req.params['id'];
    const baseDirectory = `Screenshots/${factionName}/latest`
    const assetsPromiseArr = [];
    const matchDataPromiseArr = [];

    fs.readdir('assets', (err, assets) => {
        assets.forEach((asset) => {
            assetsPromiseArr.push(new Promise((resolve, reject) => {
                Jimp.read('assets/' + asset, (err, image) => {
                    resolve([image, asset]);
                });
            }));
        })

        Promise.all(assetsPromiseArr).then((assets) => {
            fs.readdir(baseDirectory, (err, files) => {
                for (let i = 0; i < files.length; i++) {
                    const screenshotPath =  `${baseDirectory}/${files[i]}`;
                    const matchItemsPromise = new Promise((resolve, reject) => {
                        Jimp.read(screenshotPath, (err, image) => {
                            if (i % 2 === 0) {
                                const players = getPlayersLoadouts(assets, image);
                                const metaData = fs.statSync(screenshotPath);
                                resolve({
                                    faction: factionName,
                                    loadoutImg: files[i],
                                    createdAt: metaData.mtime,
                                    players: players
                                })
                            } else {
                                const tesseractTypePromise = getTextFromImage(image, [25, 170, 610, 110]);
                                const tesseractDiffPromise = getTextFromImage(image, [885, 865, 215, 45]);
                                Promise.all([tesseractTypePromise, tesseractDiffPromise]).then((result) => {
                                    resolve({
                                        missionType: result[0].split(/\r?\n/)[1],
                                        difficulty: getDifficultyInt(result[1])
                                    })
                                })
                            }
                        })
                    });
                    matchDataPromiseArr.push(matchItemsPromise);
                }

                Promise.all(matchDataPromiseArr).then((result) => {
                    const resultParsed = [];
                    console.log(result);
                    for (let i = 0; i < result.length; i++) {
                        if (i % 2 === 0) {
                            const tessResult = result[i + 1];
                            resultParsed.push({
                                missionName: tessResult.missionType,
                                difficulty: tessResult.difficulty,
                                ...result[i]
                            });
                        }
                    }

                    // GameModel.bulkWrite(resultParsed.map((item) => {
                    //     return {
                    //         insertOne: {
                    //             document: item
                    //         }
                    //     }
                    // })).then((dbRes) => {
                    //     res.send(dbRes);
                    // });
                })
            });
        });
    })
});

app.get('/faction/:id', (req, res) => {
    const factionName = req.params['id'];
    GameModel.find({ faction: factionName }).then(function (games) {
        res.send(games);
    });
});

app.get('/games/:faction/:id', (req, res) => {
    const factionName = req.params['faction'];
    const strategemName = req.params['id'];

    GameModel.find({
        faction: factionName,
        'players': {
            $elemMatch: { $elemMatch: { $in: [strategemName] } }
        }
    }).then(function (games) {
        res.send(games);
    });

});


app.get('/', (req, res) => {
    res.send('Welcome to my server!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


