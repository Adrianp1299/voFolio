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

/**
 * Get the dominant color from an image.
 * @param img - File path or Buffer.
 * @param quality - Quality setting (1 = highest, 10 = default).
 * @returns Promise resolving to the dominant color as an RGB tuple, or null.
 */
export function getColor(img: string | Buffer, quality?: number): Promise<RGBColor | null>;

/**
 * Get the dominant color from an image using an options object.
 * @param img - File path or Buffer.
 * @param options - Extraction options.
 * @returns Promise resolving to the dominant color as an RGB tuple, or null.
 */
export function getColor(img: string | Buffer, options?: ColorThiefOptions): Promise<RGBColor | null>;

/**
 * Get a color palette from an image.
 * @param img - File path or Buffer.
 * @param colorCount - Number of colors (2–20, default 10).
 * @param quality - Quality setting (1 = highest, 10 = default).
 * @returns Promise resolving to array of RGB tuples, or null.
 */
export function getPalette(img: string | Buffer, colorCount?: number, quality?: number): Promise<RGBColor[] | null>;

/**
 * Get a color palette from an image using an options object.
 * @param img - File path or Buffer.
 * @param options - Extraction options.
 * @returns Promise resolving to array of RGB tuples, or null.
 */
export function getPalette(img: string | Buffer, options?: ColorThiefOptions): Promise<RGBColor[] | null>;
