/**
 * Archeologische tekening generator via OpenAI API
 *
 * Gebruikt GPT-4 Vision om het artefact te analyseren en
 * DALL-E 3 om een wetenschappelijke archeologische tekening te genereren.
 */

// Worker URL voor API calls
const WORKER_URL = 'https://steentijd-api.mail-b-van-dongen.workers.dev';

export interface SketchResult {
  success: boolean;
  sketch?: string; // base64 data URL van de tekening
  description?: string; // Beschrijving gebruikt voor generatie
  error?: string;
}

/**
 * Genereert een archeologische tekening van een foto via AI
 * @param imageSource - data URL string van de afbeelding (moet vierkant zijn)
 * @returns Promise met de tekening als base64 data URL
 */
export async function createArchaeologicalSketch(
  imageSource: string
): Promise<string> {
  const result = await generateSketchViaAPI(imageSource);

  if (!result.success || !result.sketch) {
    throw new Error(result.error || 'Kon geen tekening genereren');
  }

  return result.sketch;
}

/**
 * Genereert een archeologische tekening via de Worker API
 */
async function generateSketchViaAPI(imageBase64: string): Promise<SketchResult> {
  try {
    const response = await fetch(`${WORKER_URL}/sketch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
      const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
      return { success: false, error: errorMessage };
    }

    const data = await response.json() as {
      success: boolean;
      sketch?: string;
      description?: string;
      error?: { message?: string };
    };

    if (!data.success) {
      return { success: false, error: data.error?.message || 'Onbekende fout' };
    }

    return {
      success: true,
      sketch: data.sketch,
      description: data.description,
    };
  } catch (err) {
    console.error('Sketch generation error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Netwerkfout bij genereren tekening',
    };
  }
}
