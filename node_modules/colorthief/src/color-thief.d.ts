/** An RGB color tuple: [red, green, blue], each 0–255. */
export type RGBColor = [number, number, number];

/** Options for controlling color extraction behavior. */
export interface ColorThiefOptions {
    /**
     * Number of colors in the palette (2–20).
     * @default 10
     */
    colorCount?: number;

    /**
     * Quality setting. 1 is highest quality, 10 is default.
     * Higher values are faster but less accurate.
     * @default 10
     */
    quality?: number;

    /**
     * Whether to ignore white pixels during sampling.
     * @default true
     */
    ignoreWhite?: boolean;

    /**
     * RGB channel threshold above which a pixel is considered white (0–255).
     * All three channels must exceed this value.
     * @default 250
     */
    whiteThreshold?: number;

    /**
     * Alpha channel threshold below which a pixel is considered transparent (0–255).
     * @default 125
     */
    alphaThreshold?: number;

    /**
     * Minimum HSV saturation (0–1). Pixels below this are skipped.
     * @default 0
     */
    minSaturation?: number;
}

/** Accepted source types for browser color extraction. */
export type ImageSource = HTMLImageElement | HTMLCanvasElement | ImageData | ImageBitmap;

declare class ColorThief {
    /**
     * Get the dominant color from an image.
     * @param sourceImage - The image source to extract from.
     * @param quality - Quality setting (1 = highest, 10 = default).
     * @returns The dominant color as an RGB tuple, or null.
     */
    getColor(sourceImage: ImageSource, quality?: number): RGBColor | null;

    /**
     * Get the dominant color from an image using an options object.
     * @param sourceImage - The image source to extract from.
     * @param options - Extraction options.
     * @returns The dominant color as an RGB tuple, or null.
     */
    getColor(sourceImage: ImageSource, options?: ColorThiefOptions): RGBColor | null;

    /**
     * Get a color palette from an image.
     * @param sourceImage - The image source to extract from.
     * @param colorCount - Number of colors (2–20, default 10).
     * @param quality - Quality setting (1 = highest, 10 = default).
     * @returns Array of RGB tuples, or null.
     */
    getPalette(sourceImage: ImageSource, colorCount?: number, quality?: number): RGBColor[] | null;

    /**
     * Get a color palette from an image using an options object.
     * @param sourceImage - The image source to extract from.
     * @param options - Extraction options.
     * @returns Array of RGB tuples, or null.
     */
    getPalette(sourceImage: ImageSource, options?: ColorThiefOptions): RGBColor[] | null;

    /**
     * Get the dominant color from an image URL.
     * @deprecated Use getColor() with a loaded HTMLImageElement instead.
     */
    getColorFromUrl(imageUrl: string, callback: (color: RGBColor | null, url: string) => void, quality?: number): void;

    /**
     * Get the dominant color from an image URL (async via XHR).
     * @deprecated Use getColor() with a loaded HTMLImageElement instead.
     */
    getColorAsync(imageUrl: string, callback: (color: RGBColor | null, img: HTMLImageElement) => void, quality?: number): void;
}

export default ColorThief;
