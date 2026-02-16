/**
 * Archeologische tekening generator
 *
 * Creëert schematische tekeningen van artefacten in de stijl van
 * wetenschappelijke archeologische illustraties:
 * - Zwart-wit of grijstinten
 * - Duidelijke contouren en randen
 * - Nadruk op bewerkingssporen en structuur
 */

/**
 * Genereert een archeologische tekening van een foto
 * @param imageSource - HTMLImageElement, Blob, of data URL string
 * @returns Promise met de tekening als base64 data URL
 */
export async function createArchaeologicalSketch(
  imageSource: HTMLImageElement | Blob | string
): Promise<string> {
  // Laad de afbeelding
  const img = await loadImage(imageSource);

  // Maak canvas voor verwerking
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context niet beschikbaar');

  // Bepaal output grootte (max 800px voor performance)
  const maxSize = 800;
  let width = img.width;
  let height = img.height;

  if (width > maxSize || height > maxSize) {
    const scale = maxSize / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  canvas.width = width;
  canvas.height = height;

  // Teken originele afbeelding
  ctx.drawImage(img, 0, 0, width, height);

  // Haal pixel data op
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  // Stap 1: Converteer naar grijswaarden
  const grayscale = new Float32Array(width * height);
  for (let i = 0; i < pixels.length; i += 4) {
    const idx = i / 4;
    // Gewogen grijswaarde voor betere perceptie
    grayscale[idx] = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
  }

  // Stap 2: Sobel edge detection voor contouren
  const edges = sobelEdgeDetection(grayscale, width, height);

  // Stap 3: Combineer edges met geïnverteerde grijswaarden voor diepte
  const result = new Uint8ClampedArray(pixels.length);

  for (let i = 0; i < grayscale.length; i++) {
    const edge = edges[i];
    const gray = grayscale[i];

    // Archeologische tekening stijl:
    // - Sterke edges worden donker (zwarte lijnen)
    // - Vlakke gebieden worden licht (wit papier)
    // - Subtiele gradiënten voor schaduw/diepte

    // Normaliseer edge sterkte (0-255)
    const edgeStrength = Math.min(255, edge * 2);

    // Inverteer en pas contrast aan voor papier-achtige achtergrond
    const baseValue = 255 - (gray * 0.15); // Lichte schaduw

    // Combineer: donkere edges op lichte achtergrond
    let value = baseValue - edgeStrength;

    // Verbeter contrast voor duidelijke lijnen
    if (edgeStrength > 30) {
      value = Math.min(value, 255 - edgeStrength * 1.5);
    }

    // Clamp naar geldige waarde
    value = Math.max(0, Math.min(255, value));

    // Schrijf naar output (RGBA)
    const pixelIdx = i * 4;
    result[pixelIdx] = value;     // R
    result[pixelIdx + 1] = value; // G
    result[pixelIdx + 2] = value; // B
    result[pixelIdx + 3] = 255;   // A
  }

  // Stap 4: Post-processing voor schonere lijnen
  const processed = enhanceLines(result, width, height);

  // Schrijf terug naar canvas
  const outputData = ctx.createImageData(width, height);
  outputData.data.set(processed);
  ctx.putImageData(outputData, 0, 0);

  // Retourneer als data URL
  return canvas.toDataURL('image/png');
}

/**
 * Laadt een afbeelding van verschillende bronnen
 */
async function loadImage(source: HTMLImageElement | Blob | string): Promise<HTMLImageElement> {
  if (source instanceof HTMLImageElement) {
    if (source.complete) return source;
    return new Promise((resolve, reject) => {
      source.onload = () => resolve(source);
      source.onerror = reject;
    });
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;

    if (source instanceof Blob) {
      img.src = URL.createObjectURL(source);
    } else {
      img.src = source;
    }
  });
}

/**
 * Sobel edge detection algoritme
 * Detecteert randen/contouren in de afbeelding
 */
function sobelEdgeDetection(
  grayscale: Float32Array,
  width: number,
  height: number
): Float32Array {
  const result = new Float32Array(width * height);

  // Sobel kernels
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;

      // Pas 3x3 kernel toe
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          const pixel = grayscale[idx];

          gx += pixel * sobelX[kernelIdx];
          gy += pixel * sobelY[kernelIdx];
        }
      }

      // Magnitude van de gradiënt
      result[y * width + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  return result;
}

/**
 * Verbetert lijnen voor schonere tekening output
 * Past lichte blur en contrast versterking toe
 */
function enhanceLines(
  pixels: Uint8ClampedArray,
  _width: number,
  _height: number
): Uint8ClampedArray {
  // _width en _height beschikbaar voor toekomstige blur/filter operaties
  const result = new Uint8ClampedArray(pixels.length);

  // Kopieer eerst alle pixels
  result.set(pixels);

  // Pas contrast curve toe voor scherpere lijnen
  for (let i = 0; i < result.length; i += 4) {
    let value = result[i];

    // S-curve voor contrast
    // Maakt donkere lijnen donkerder en lichte achtergrond lichter
    if (value < 128) {
      // Donkere waarden: maak donkerder
      value = Math.pow(value / 128, 1.3) * 128;
    } else {
      // Lichte waarden: maak lichter
      value = 255 - Math.pow((255 - value) / 128, 1.3) * 128;
    }

    // Voeg lichte sepia/warmte toe voor authentieke uitstraling
    const r = Math.min(255, value + 5);
    const g = Math.min(255, value + 2);
    const b = value;

    result[i] = r;
    result[i + 1] = g;
    result[i + 2] = b;
  }

  return result;
}

/**
 * Genereert een thumbnail van de tekening
 */
export async function createSketchThumbnail(
  sketchDataUrl: string,
  size: number = 200
): Promise<string> {
  const img = await loadImage(sketchDataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context niet beschikbaar');

  // Centreer en crop naar vierkant
  const srcSize = Math.min(img.width, img.height);
  const srcX = (img.width - srcSize) / 2;
  const srcY = (img.height - srcSize) / 2;

  ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, size, size);

  return canvas.toDataURL('image/jpeg', 0.8);
}
