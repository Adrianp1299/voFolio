function createPixelArray(imgData, pixelCount, quality, filterOptions) {
    const {
        ignoreWhite = true,
        whiteThreshold = 250,
        alphaThreshold = 125,
        minSaturation = 0
    } = filterOptions || {};

    const pixels = imgData;
    const pixelArray = [];

    for (let i = 0, offset, r, g, b, a; i < pixelCount; i = i + quality) {
        offset = i * 4;
        r = pixels[offset + 0];
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
    } else if (colorCount === 1 ) {
        throw new Error('colorCount should be between 2 and 20. To get one color, call getColor() instead of getPalette()');
    } else {
        colorCount = Math.max(colorCount, 2);
        colorCount = Math.min(colorCount, 20);
    }

    if (typeof quality === 'undefined' || !Number.isInteger(quality) || quality < 1) {
        quality = 10;
    }

    // Filter options with defaults
    const ignoreWhite = options.ignoreWhite !== undefined ? !!options.ignoreWhite : true;
    const whiteThreshold = typeof options.whiteThreshold === 'number' ? options.whiteThreshold : 250;
    const alphaThreshold = typeof options.alphaThreshold === 'number' ? options.alphaThreshold : 125;
    const minSaturation = typeof options.minSaturation === 'number'
        ? Math.max(0, Math.min(1, options.minSaturation))
        : 0;

    return {
        colorCount,
        quality,
        ignoreWhite,
        whiteThreshold,
        alphaThreshold,
        minSaturation
    }
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

export default {
    createPixelArray,
    validateOptions,
    computeFallbackColor
};
