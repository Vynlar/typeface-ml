const opentype = require('opentype.js');
const fs = require('fs');
const R = require('ramda');
const { createCanvas } = require('canvas');

const fsPromises = fs.promises;

const basePath = './google/fonts/ofl/';
const allFonts = fs.readdirSync(basePath);
const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

async function parseFont(name) {
    const folderPath = basePath + name;
    const files = await fsPromises.readdir(folderPath);
    const fontFiles = R.filter(R.endsWith('.ttf'))(files);
    const paths = R.map(R.concat(folderPath + '/'))(fontFiles);
    return new Promise((resolve, reject) => {
        opentype.load(paths[0], (err, font) => {
            if(err) reject(err)
            else resolve(font);
        });
    })
}

function toGlyph(font, letter) {
    const glyph = font.charToGlyph(letter);
    return glyph;
}

async function outputGlyph(name, glyph) {
    const canvas = createCanvas(128, 128);
    const context = canvas.getContext('2d');
    glyph.draw(context, 16, 128-36, 100);

    const buffer = canvas.toBuffer('image/png');

    await fsPromises.writeFile(`./glyphs/${name}.png`, buffer);
}

async function processFont(fontName) {
    const font = await parseFont(fontName);
    await Promise.all(R.pipe(
        R.map(letter => [letter, toGlyph(font, letter)]),
        R.map(([letter, glyph]) => outputGlyph(`${letter}-${fontName}`, glyph)),
    )(alphabet));
    return fontName;
}

Promise.all(R.map(processFont)(allFonts)).then(results => {
    console.log(results.length);
});
