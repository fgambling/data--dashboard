/**
 * Generate a deterministic HSL color based on any string input.
 * This ensures the same string always produces the same color.
 *
 * @param str Input string (e.g., product name)
 * @param s Saturation percentage (0-100, default: 70)
 * @param l Lightness percentage (0-100, default: 55)
 * @returns An HSL color string, e.g., 'hsl(120, 70%, 55%)'
 */
export const generateHslColorFromString = (str: string, s: number = 70, l: number = 55): string => {
  let hash = 0;

  // Generate hash from string
  for (let i = 0; i < str.length; i++) {
    // Add each character's Unicode code and perform bit operations
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Map hash value to 0-359 hue range using modulo operation
  const h = Math.abs(hash) % 360;

  return `hsl(${h}, ${s}%, ${l}%)`;
};

/**
 * Convert HSL color to hex format for compatibility
 * @param hslString HSL color string, e.g., 'hsl(120, 70%, 55%)'
 * @returns Hex color string, e.g., '#4CAF50'
 */
export const hslToHex = (hslString: string): string => {
  // Parse HSL values from string
  const hslMatch = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!hslMatch) return '#000000';

  const h = parseInt(hslMatch[1]);
  const s = parseInt(hslMatch[2]) / 100;
  const l = parseInt(hslMatch[3]) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  // Convert to hex
  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Generate a color palette for multiple products
 * @param productNames Array of product names
 * @returns Object mapping product names to colors
 */
export const generateProductColorPalette = (productNames: string[]): { [key: string]: string } => {
  const palette: { [key: string]: string } = {};

  productNames.forEach(name => {
    const hslColor = generateHslColorFromString(name, 70, 55);
    palette[name] = hslToHex(hslColor);
  });

  return palette;
};