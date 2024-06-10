import Jimp from "jimp";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { createWorker } = require('tesseract.js');
const worker = await createWorker('eng');
const fs = require('fs');

const baseImgSize = 70;
const startX = 58;
const startY = 842;
const offsetX = [
    1, 16, 31, 46,
    185, 200, 216, 231,
    366, 382, 397, 412,
    551, 566, 581, 596
];

async function tesseractRecoganize(buffer) {
    const { data: { text } } = await worker.recognize(buffer);
    return text;
}

const getPixelMissmatch = (p1, p2) => {
    const deltaR = Math.abs(p1.r - p2.r);
    const deltaG = Math.abs(p1.g - p2.g);
    const deltaB = Math.abs(p1.b - p2.b);
    const totalDiff = deltaR + deltaG + deltaB;
    return totalDiff / 2;
}

function getItemDiff(image, asset) {
    let total = 0;

    for (let x = 0; x < baseImgSize; x++) {
        for (let y = 0; y < baseImgSize; y++) {
            let p1 = Jimp.intToRGBA(image.getPixelColor(x, y));
            let p2 = Jimp.intToRGBA(asset.getPixelColor(x, y));

            let pixelDiff = getPixelMissmatch(p1, p2);
            if (
                (p1.red < 50 && p1.green < 50 && p1.blue < 50) &&
                (p2.red < 50 && p2.green < 50 && p2.blue < 50)
            ) {
                pixelDiff = 0;
            }

            if (
                (p1.red > 180 && p1.green > 80 && p1.blue < 82) &&
                (p2.red > 180 && p2.green > 80 && p2.blue < 82)
            ) {
                pixelDiff = 0;
            }

            total = total + pixelDiff;
        }
    }
    return total;
}

const getPlayersLoadouts = (assetsImg, image) => {
    const players = [];
    for (let j = 4; j < 16; j++) {
        let maxDiff = 100000;
        let bestMatchname = "";
        const offset = startX + offsetX[j] + (baseImgSize * j);
        const strategemImage = image.clone().crop(offset, startY, baseImgSize, baseImgSize);

        for (let k = 0; k < assetsImg.length; k++) {
            const matchDiff = getItemDiff(strategemImage, assetsImg[k][0]);
            if (matchDiff < maxDiff) {
                maxDiff = matchDiff;
                bestMatchname = assetsImg[k][1];
            }
        }

        if (bestMatchname !== "") {
            const playerIndex = Math.floor(j / 4) - 1;
            if (!players[playerIndex]) players[playerIndex] = [];
            players[playerIndex].push(bestMatchname.replace(".png", ""));
        }
    }

    return players.filter((player) => player.length > 0);
}

const getTextFromImage = (image, coordinates) => {
    return new Promise((resolve, reject) => {
        const imgClone = image.clone().crop(...coordinates);
        imgClone.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            const tesseractPromise = tesseractRecoganize(buffer);
            tesseractPromise.then((result) => {
                resolve(result);
            })
        });
    });
}

const getFaction = (pixel) => {
    if (pixel.r > 250 && pixel.g > 90 && pixel.g < 95 && pixel.b > 90 && pixel.b < 95) {
        return 'automaton';
    } else if (pixel.r > 250 && pixel.g > 178 && pixel.g < 195 && pixel.b < 10) {
        return 'terminid';
    } else if (pixel.r > 75 && pixel.g > 85 && pixel.g < 95 && pixel.b > 95 && pixel.b < 105) {
        return 'terminid';
    }
    return 'invalid';
}

const deleteFiles = (files, callback) => {
    if (files.length == 0) callback();
    else {
        var f = files.pop();
        fs.unlink(f, function (err) {
            if (err) callback(err);
            else {
                deleteFiles(files, callback);
            }
        });
    }
}

const getDifficultyInt = (text) => {
    let diffIndex = 1;
    const difficulties = ["HELLDIVE", "IMPOSSIBLE", "SUICIDE MISSION"];
    difficulties.forEach((arrItem, arrIndex) => {
        const indexFound = text.indexOf(arrItem) !== -1;
        if (indexFound) diffIndex = arrIndex;
    })
    return 9 - diffIndex;
}

export { getPlayersLoadouts, getTextFromImage, getFaction, deleteFiles, getDifficultyInt }