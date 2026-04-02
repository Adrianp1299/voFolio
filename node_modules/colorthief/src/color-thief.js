import quantize from '../node_modules/@lokesh.dhakar/quantize/dist/index.mjs';
import core from './core.js';

/*
 * Color Thief v2.7.0
 * by Lokesh Dhakar - http://www.lokeshdhakar.com
 *
 * Thanks
 * ------
 * Nick Rabinowitz - For creating quantize.js.
 * John Schulz - For clean up and optimization. @JFSIII
 * Nathan Spady - For adding drag and drop support to the demo page.
 *
 * License
 * -------
 * Copyright Lokesh Dhakar
 * Released under the MIT license
 * https://raw.githubusercontent.com/lokesh/color-thief/master/LICENSE
 *
 * @license
 */


/*
 * getPixelData(source)
 * Extracts ImageData from various browser source types.
 * Returns { imageData: ImageData, pixelCount: number }
 */
function getPixelData(source) {
    if (source instanceof HTMLImageElement) {
        const canvas  = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const width   = canvas.width  = source.naturalWidth;
        const height  = canvas.height = source.naturalHeight;
        context.drawImage(source, 0, 0, width, height);
        return { imageData: context.getImageData(0, 0, width, height), pixelCount: width * height };
    }

    if (source instanceof HTMLCanvasElement) {
        const context = source.getContext('2d');
        const width   = source.width;
        const height  = source.height;
        return { imageData: context.getImageData(0, 0, width, height), pixelCount: width * height };
    }

    if (typeof ImageData !== 'undefined' && source instanceof ImageData) {
        return { imageData: source, pixelCount: source.width * source.height };
    }

    if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) {
        const canvas  = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width  = source.width;
        canvas.height = source.height;
        context.drawImage(source, 0, 0);
        return { imageData: context.getImageData(0, 0, source.width, source.height), pixelCount: source.width * source.height };
    }

    throw new Error('Unsupported source type. Expected HTMLImageElement, HTMLCanvasElement, ImageData, or ImageBitmap.');
}

var ColorThief = function () {};

/*
 * getColor(sourceImage[, quality])
 * returns {r: num, g: num, b: num}
 *
 * Use the median cut algorithm provided by quantize.js to cluster similar
 * colors and return the base color from the largest cluster.
 *
 * Quality is an optional argument. It needs to be an integer. 1 is the highest quality settings.
 * 10 is the default. There is a trade-off between quality and speed. The bigger the number, the
 * faster a color will be returned but the greater the likelihood that it will not be the visually
 * most dominant color.
 *
 * */
ColorThief.prototype.getColor = function(sourceImage, qualityOrOptions) {
    // Support both getColor(img, quality) and getColor(img, { quality, ... })
    if (typeof qualityOrOptions === 'object' && qualityOrOptions !== null) {
        const opts = qualityOrOptions;
        const palette = this.getPalette(sourceImage, { colorCount: 5, ...opts });
        return palette === null ? null : palette[0];
    }
    const palette       = this.getPalette(sourceImage, 5, qualityOrOptions);
    const dominantColor = palette === null ? null : palette[0];
    return dominantColor;
};


/*
 * getPalette(sourceImage[, colorCount, quality])
 * returns array[ {r: num, g: num, b: num}, {r: num, g: num, b: num}, ...]
 *
 * Use the median cut algorithm provided by quantize.js to cluster similar colors.
 *
 * colorCount determines the size of the palette; the number of colors returned. If not set, it
 * defaults to 10.
 *
 * quality is an optional argument. It needs to be an integer. 1 is the highest quality settings.
 * 10 is the default. There is a trade-off between quality and speed. The bigger the number, the
 * faster the palette generation but the greater the likelihood that colors will be missed.
 *
 *
 */
ColorThief.prototype.getPalette = function(sourceImage, colorCountOrOptions, quality) {
    let options;

    // Support both getPalette(img, colorCount, quality) and getPalette(img, { colorCount, quality, ... })
    if (typeof colorCountOrOptions === 'object' && colorCountOrOptions !== null) {
        options = core.validateOptions({
            colorCount: colorCountOrOptions.colorCount,
            quality: colorCountOrOptions.quality,
            ignoreWhite: colorCountOrOptions.ignoreWhite,
            whiteThreshold: colorCountOrOptions.whiteThreshold,
            alphaThreshold: colorCountOrOptions.alphaThreshold,
            minSaturation: colorCountOrOptions.minSaturation
        });
    } else {
        options = core.validateOptions({
            colorCount: colorCountOrOptions,
            quality
        });
    }

    const filterOptions = {
        ignoreWhite: options.ignoreWhite,
        whiteThreshold: options.whiteThreshold,
        alphaThreshold: options.alphaThreshold,
        minSaturation: options.minSaturation
    };

    // Validate input
    if (!sourceImage) {
        throw new Error('sourceImage is required');
    }
    if (sourceImage instanceof HTMLImageElement) {
        if (!sourceImage.complete) {
            throw new Error('Image has not finished loading. Wait for the "load" event before calling getColor/getPalette.');
        }
        if (!sourceImage.naturalWidth) {
            throw new Error('Image has no dimensions. It may not have loaded successfully.');
        }
    }

    // Extract pixel data from the source
    let imageData, pixelCount;
    try {
        const pixelData = getPixelData(sourceImage);
        imageData  = pixelData.imageData;
        pixelCount = pixelData.pixelCount;
    } catch (e) {
        if (e.name === 'SecurityError') {
            throw new Error('Image is tainted by cross-origin data. Add crossorigin="anonymous" to the <img> tag and ensure the server sends appropriate CORS headers.', { cause: e });
        }
        throw e;
    }

    let pixelArray = core.createPixelArray(imageData.data, pixelCount, options.quality, filterOptions);

    // If filtering removed all pixels, progressively relax filters
    if (pixelArray.length === 0) {
        pixelArray = core.createPixelArray(imageData.data, pixelCount, options.quality, { ...filterOptions, ignoreWhite: false });
    }
    if (pixelArray.length === 0) {
        pixelArray = core.createPixelArray(imageData.data, pixelCount, options.quality, { ...filterOptions, ignoreWhite: false, alphaThreshold: 0 });
    }

    // Send array to quantize function which clusters values
    // using median cut algorithm
    const cmap    = quantize(pixelArray, options.colorCount);
    const palette = cmap ? cmap.palette() : null;

    if (palette) return palette;

    // Fallback: average all pixels (handles solid-color images the quantizer can't cluster)
    const fallback = core.computeFallbackColor(imageData.data, pixelCount, options.quality);
    return fallback ? [fallback] : null;
};

ColorThief.prototype.getColorFromUrl = function(imageUrl, callback, quality) {
    const sourceImage = document.createElement("img");

    sourceImage.addEventListener('load' , () => {
        const palette = this.getPalette(sourceImage, 5, quality);
        const dominantColor = palette ? palette[0] : null;
        callback(dominantColor, imageUrl);
    });
    sourceImage.src = imageUrl
};


ColorThief.prototype.getImageData = function(imageUrl, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', imageUrl, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
        if (this.status == 200) {
            let uInt8Array = new Uint8Array(this.response);
            let i = uInt8Array.length;
            let binaryString = new Array(i);
            for (let i = 0; i < uInt8Array.length; i++){
                binaryString[i] = String.fromCharCode(uInt8Array[i]);
            }
            let data = binaryString.join('');
            let base64 = window.btoa(data);
            callback ('data:image/png;base64,' + base64);
        }
    }
    xhr.send();
};

ColorThief.prototype.getColorAsync = function(imageUrl, callback, quality) {
    const thief = this;
    this.getImageData(imageUrl, function(imageData){
        const sourceImage = document.createElement("img");
        sourceImage.addEventListener('load' , function(){
            const palette = thief.getPalette(sourceImage, 5, quality);
            const dominantColor = palette ? palette[0] : null;
            callback(dominantColor, this);
        });
        sourceImage.src = imageData;
    });
};


export default ColorThief;
