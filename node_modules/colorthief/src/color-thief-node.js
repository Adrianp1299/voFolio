const { getPixels } = require('ndarray-pixels');
const sharp = require('sharp');
const quantize = require('@lokesh.dhakar/quantize');


function createPixelArray(pixels, pixelCount, quality, filterOptions) {
    const {
        ignoreWhite = true,
        whiteThreshold = 250,
        alphaThreshold = 125,
        minSaturation = 0
    } = filterOptions || {};

    const pixelArray = [];

    for (let i = 0, offset, r, g, b, a; i < pixelCount; i += quality) {
        offset = i * 4;
        r = pixels[offset];
        g = pixels[offset + 1];
        b = pixels[offset + 2];
        a = pixels[offset + 3];

        // Skip transparent pixels
        if (typeof a !== 'undefined' && a < alphaThreshold) continue;

        // Skip white pixels
        if (ignoreWhite && r > whiteThreshold && g > whiteThreshold && b > whiteThreshold) continue;

        // Skip low-saturation pixels
        if (minSaturation > 0) {
            const max = Math.max(r, g, b);
            if (max === 0 || (max - Math.min(r, g, b)) / max < minSaturation) continue;
        }

        pixelArray.push([r, g, b]);
    }

    return pixelArray;
}

function validateOptions(options) {
    let { colorCount, quality } = options;

    if (typeof colorCount === 'undefined' || !Number.isInteger(colorCount)) {
        colorCount = 10;
    } else if (colorCount === 1) {
        throw new Error('`colorCount` should be between 2 and 20. To get one color, call `getColor()` instead of `getPalette()`');
    } else {
        colorCount = Math.max(colorCount, 2);
        colorCount = Math.min(colorCount, 20);
    }

    if (typeof quality === 'undefined' || !Number.isInteger(quality) || quality < 1) quality = 10;

    // Filter options with defaults
    const ignoreWhite = options.ignoreWhite !== undefined ? !!options.ignoreWhite : true;
    const whiteThreshold = typeof options.whiteThreshold === 'number' ? options.whiteThreshold : 250;
    const alphaThreshold = typeof options.alphaThreshold === 'number' ? options.alphaThreshold : 125;
    const minSaturation = typeof options.minSaturation === 'number'
        ? Math.max(0, Math.min(1, options.minSaturation))
        : 0;

    return { colorCount, quality, ignoreWhite, whiteThreshold, alphaThreshold, minSaturation };
}

function computeFallbackColor(imgData, pixelCount, quality) {
    const pixels = imgData;
    let rTotal = 0, gTotal = 0, bTotal = 0;
    let count = 0;

    for (let i = 0; i < pixelCount; i += quality) {
        const offset = i * 4;
        rTotal += pixels[offset];
        gTotal += pixels[offset + 1];
        bTotal += pixels[offset + 2];
        count++;
    }

    if (count === 0) return null;

    return [
        Math.round(rTotal / count),
        Math.round(gTotal / count),
        Math.round(bTotal / count)
    ];
}

const loadImg = (img) => {
    return new Promise((resolve, reject) => {
        sharp(img)
        .toBuffer()
        .then(buffer => sharp(buffer).metadata()
            .then(metadata => ({ buffer, format: metadata.format })))
        .then(({ buffer, format }) => getPixels(buffer, format))
        .then(resolve)
        .catch(reject);
    })
}

function getColor(img, qualityOrOptions) {
    // Support both getColor(img, quality) and getColor(img, { quality, ... })
    if (typeof qualityOrOptions === 'object' && qualityOrOptions !== null) {
        const opts = qualityOrOptions;
        return getPalette(img, { colorCount: 5, ...opts })
            .then(palette => palette === null ? null : palette[0]);
    }
    return getPalette(img, 5, qualityOrOptions)
        .then(palette => palette === null ? null : palette[0]);
}

function getPalette(img, colorCountOrOptions, quality) {
    let options;

    // Support both getPalette(img, colorCount, quality) and getPalette(img, { colorCount, quality, ... })
    if (typeof colorCountOrOptions === 'object' && colorCountOrOptions !== null) {
        options = validateOptions({
            colorCount: colorCountOrOptions.colorCount,
            quality: colorCountOrOptions.quality,
            ignoreWhite: colorCountOrOptions.ignoreWhite,
            whiteThreshold: colorCountOrOptions.whiteThreshold,
            alphaThreshold: colorCountOrOptions.alphaThreshold,
            minSaturation: colorCountOrOptions.minSaturation
        });
    } else {
        options = validateOptions({ colorCount: colorCountOrOptions, quality });
    }

    const filterOptions = {
        ignoreWhite: options.ignoreWhite,
        whiteThreshold: options.whiteThreshold,
        alphaThreshold: options.alphaThreshold,
        minSaturation: options.minSaturation
    };

    return loadImg(img)
        .then(imgData => {
            const pixelCount = imgData.shape[0] * imgData.shape[1];
            let pixelArray = createPixelArray(imgData.data, pixelCount, options.quality, filterOptions);

            // If filtering removed all pixels, progressively relax filters
            if (pixelArray.length === 0) {
                pixelArray = createPixelArray(imgData.data, pixelCount, options.quality, { ...filterOptions, ignoreWhite: false });
            }
            if (pixelArray.length === 0) {
                pixelArray = createPixelArray(imgData.data, pixelCount, options.quality, { ...filterOptions, ignoreWhite: false, alphaThreshold: 0 });
            }

            const cmap = quantize(pixelArray, options.colorCount);
            const palette = cmap ? cmap.palette() : null;

            if (palette) return palette;

            // Fallback: average all pixels (handles solid-color images the quantizer can't cluster)
            const fallback = computeFallbackColor(imgData.data, pixelCount, options.quality);
            return fallback ? [fallback] : null;
        });
}

module.exports = { getColor, getPalette };
