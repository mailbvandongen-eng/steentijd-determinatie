export interface Env {
  ANTHROPIC_API_KEY: string;
  OPENAI_API_KEY: string;
  RATE_LIMIT: KVNamespace;
  DAILY_LIMIT: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    // Get URL path to determine action
    const url = new URL(request.url);
    const isSketchRequest = url.pathname === '/sketch';
    const isTestOpenAI = url.pathname === '/test-openai';
    const isHintRequest = url.pathname === '/hint';
    const isValidateRequest = url.pathname === '/validate';

    // Get client IP for rate limiting
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const today = new Date().toISOString().split('T')[0];
    const rateLimitKey = `${clientIP}:${today}`;

    // Check rate limit
    const currentCount = parseInt(await env.RATE_LIMIT.get(rateLimitKey) || '0');
    const dailyLimit = parseInt(env.DAILY_LIMIT || '10');

    if (currentCount >= dailyLimit) {
      return new Response(
        JSON.stringify({
          error: {
            message: `Daglimiet bereikt (${dailyLimit} analyses per dag). Probeer morgen opnieuw.`
          }
        }),
        {
          status: 429,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        }
      );
    }

    try {
      // Route to appropriate handler
      if (isTestOpenAI) {
        return await handleTestOpenAI(env);
      } else if (isSketchRequest) {
        return await handleSketchRequest(request, env, rateLimitKey, currentCount);
      } else if (isHintRequest) {
        return await handleHintRequest(request, env, rateLimitKey, currentCount);
      } else if (isValidateRequest) {
        return await handleValidateRequest(request, env, rateLimitKey, currentCount);
      } else {
        return await handleAnalysisRequest(request, env, rateLimitKey, currentCount);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Worker error:', errorMessage, error);
      return new Response(
        JSON.stringify({ error: { message: `Server error: ${errorMessage}` } }),
        {
          status: 500,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        }
      );
    }
  },
};

// Test OpenAI connection
async function handleTestOpenAI(env: Env): Promise<Response> {
  if (!env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ ok: false, error: 'OPENAI_API_KEY not configured' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  // Simple completion test (no vision)
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "test ok"' }],
      }),
    });

    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return new Response(
      JSON.stringify({
        ok: response.ok,
        status: response.status,
        keyLength: env.OPENAI_API_KEY.length,
        keyPrefix: env.OPENAI_API_KEY.substring(0, 7),
        response: data,
      }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
}

// Handle Claude analysis requests (existing functionality)
async function handleAnalysisRequest(
  request: Request,
  env: Env,
  rateLimitKey: string,
  currentCount: number
): Promise<Response> {
  if (!env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: { message: 'API key niet geconfigureerd. Neem contact op met de beheerder.' } }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const body = await request.json();

  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  const result = await anthropicResponse.json();

  if (anthropicResponse.ok) {
    await env.RATE_LIMIT.put(rateLimitKey, String(currentCount + 1), {
      expirationTtl: 86400,
    });
  }

  return new Response(JSON.stringify(result), {
    status: anthropicResponse.status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// Helper function to safely parse JSON
async function safeJsonParse(response: Response, context: string): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  try {
    const text = await response.text();
    if (!text || text.trim() === '') {
      return { ok: false, error: `${context}: Lege response ontvangen (status ${response.status})` };
    }
    try {
      const data = JSON.parse(text);
      return { ok: true, data };
    } catch {
      return { ok: false, error: `${context}: Ongeldige JSON response: ${text.substring(0, 200)}` };
    }
  } catch (err) {
    return { ok: false, error: `${context}: Kon response niet lezen: ${err}` };
  }
}

// Handle OpenAI sketch generation requests
async function handleSketchRequest(
  request: Request,
  env: Env,
  rateLimitKey: string,
  currentCount: number
): Promise<Response> {
  if (!env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: { message: 'OpenAI API key niet geconfigureerd. Voeg OPENAI_API_KEY toe als secret.' } }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  // Log dat we de key hebben (niet de key zelf!)
  console.log('OpenAI key configured, length:', env.OPENAI_API_KEY.length);

  // Parse request body safely
  let imageBase64: string;
  try {
    const bodyText = await request.text();
    if (!bodyText || bodyText.trim() === '') {
      return new Response(
        JSON.stringify({ error: { message: 'Lege request body ontvangen.' } }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }
    const body = JSON.parse(bodyText) as { imageBase64?: string };
    imageBase64 = body.imageBase64 || '';
  } catch (err) {
    return new Response(
      JSON.stringify({ error: { message: `Ongeldige JSON in request: ${err}` } }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  if (!imageBase64) {
    return new Response(
      JSON.stringify({ error: { message: 'Geen afbeelding meegegeven.' } }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  console.log('Image data received, length:', imageBase64.length, 'starts with:', imageBase64.substring(0, 30));

  // Extract pure base64 and determine mime type
  const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
  const pureBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  // Convert base64 to binary array
  const binaryString = atob(pureBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create Blob from binary data
  const imageBlob = new Blob([bytes], { type: mimeType });
  console.log('Image blob created, size:', imageBlob.size, 'type:', imageBlob.type);

  const prompt = `Create a scientific archaeological ink drawing of this stone artifact in the classic French/Dutch lithic illustration style.

CRITICAL - SCALE AND POSITION:
- KEEP THE EXACT SAME SCALE: If the object fills 30% of the image, the drawing must also fill exactly 30%.
- KEEP THE EXACT SAME POSITION: Draw the object in the same location within the frame.
- DO NOT enlarge, zoom in, or "improve" the composition.
- The white space around the object must remain proportionally the same.

OBJECT:
- Single flint/stone artifact only.
- Maintain the exact outline shape from the photo.
- Same orientation as the reference image.
- DO NOT include hands, fingers, or any human body parts.

STYLE - THIS IS CRITICAL:
- Black ink on white paper - HIGH CONTRAST, no gray tones.
- Bold, confident pen strokes - NOT soft pencil shading.
- Clean, sharp contour lines around the entire object.
- Style reference: classic archaeological publication illustrations (like Inizan et al., Bordes).
- Hand-drawn quality with slight organic variation in line weight.

SURFACE TREATMENT - USE HATCHING:
- Flake scars: parallel hatching lines following the direction of each flake removal.
- Use denser/closer lines for shadows, sparser lines for highlights.
- Cortex areas: stippling (small dots) or cross-hatching.
- Retouched edges: short parallel lines perpendicular to the edge.
- Each facet should have its own hatching direction based on flake scar orientation.

BACKGROUND:
- Pure white background.
- No shadows, no gradients.

CRITICAL REMINDER:
- This must look like a professional archaeological LITHIC ILLUSTRATION with bold ink lines and hatching - NOT a soft pencil sketch.`;

  console.log('=== IMAGE EDIT DEBUG ===');
  console.log('Blob size:', imageBlob.size);
  console.log('Blob type:', imageBlob.type);

  // Use /v1/images/edits with multipart/form-data
  const formData = new FormData();
  formData.append('model', 'gpt-image-1');
  formData.append('prompt', prompt);
  formData.append('image', imageBlob, 'artifact.png');
  formData.append('size', '1024x1024');

  const imageGenResponse = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      // Don't set Content-Type - fetch will set it with the boundary for FormData
    },
    body: formData,
  });

  console.log('gpt-image-1 edits response status:', imageGenResponse.status);

  let sketchBase64: string | undefined;
  const description = 'archaeological stone artifact';

  if (!imageGenResponse.ok) {
    let errorText = '';
    try {
      errorText = await imageGenResponse.text();
    } catch {
      errorText = 'Could not read response';
    }
    console.log('gpt-image-1 edits error response:', errorText || '(empty)');

    // Parse error to check what went wrong
    let errorDetails: unknown;
    try {
      errorDetails = JSON.parse(errorText);
    } catch {
      errorDetails = errorText;
    }

    const errorObj = errorDetails as { error?: { message?: string; code?: string } };
    console.log('Error details:', JSON.stringify(errorObj));

    // NO FALLBACK - return the actual error so we can debug
    return new Response(
      JSON.stringify({
        error: {
          message: `gpt-image-1 edits failed: ${errorObj?.error?.message || 'Unknown error'}`,
          details: errorObj,
          status: imageGenResponse.status,
          debug: {
            blob_size: imageBlob.size,
            model_used: 'gpt-image-1',
            endpoint: '/v1/images/edits',
          }
        }
      }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } else {
    // gpt-image-1 edits succeeded - parse the response
    const responseParseResult = await safeJsonParse(imageGenResponse, 'gpt-image-1 edits response');
    if (!responseParseResult.ok) {
      return new Response(
        JSON.stringify({ error: { message: responseParseResult.error } }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const imageResult = responseParseResult.data as {
      data: Array<{ b64_json?: string; url?: string }>;
    };

    console.log('gpt-image-1 edits result keys:', Object.keys(imageResult));

    // Extract base64 from response
    const imageData = imageResult.data?.[0];
    if (imageData?.b64_json) {
      sketchBase64 = imageData.b64_json;
    } else if (imageData?.url) {
      // If URL returned, fetch and convert to base64
      console.log('Got URL instead of b64, fetching...');
      try {
        const imgResponse = await fetch(imageData.url);
        const imgBuffer = await imgResponse.arrayBuffer();
        sketchBase64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)));
      } catch (e) {
        console.log('Failed to fetch image URL:', e);
      }
    }
  }

  console.log('Sketch received, base64 length:', sketchBase64?.length || 0);

  if (!sketchBase64) {
    return new Response(
      JSON.stringify({ error: { message: 'Geen tekening ontvangen van API.' } }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  // Count this request
  await env.RATE_LIMIT.put(rateLimitKey, String(currentCount + 1), {
    expirationTtl: 86400,
  });

  return new Response(
    JSON.stringify({
      success: true,
      sketch: `data:image/png;base64,${sketchBase64}`,
      description: description,
    }),
    {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    }
  );
}

// Handle AI hint requests for decision tree questions
async function handleHintRequest(
  request: Request,
  env: Env,
  rateLimitKey: string,
  currentCount: number
): Promise<Response> {
  if (!env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: { message: 'API key niet geconfigureerd.' } }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  interface HintRequestBody {
    imageBase64: string;
    question: string;
    questionId: string;
    toelichting?: string;
  }

  let body: HintRequestBody;
  try {
    body = await request.json() as HintRequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: { message: 'Ongeldige JSON in request.' } }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const { imageBase64, question, toelichting } = body;

  if (!imageBase64 || !question) {
    return new Response(
      JSON.stringify({ error: { message: 'Afbeelding en vraag zijn verplicht.' } }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  // Extract media type from base64 string
  const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
  const mediaType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const pureBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  const hintPrompt = `Je bent een ervaren archeoloog die een student helpt bij het determineren van een stenen artefact.

De student bekijkt een foto van een object en twijfelt bij de volgende vraag:

VRAAG: "${question}"
${toelichting ? `\nTOELICHTING BIJ VRAAG: ${toelichting}` : ''}

JOUW TAAK:
Geef een HINT die de student helpt om zelf het antwoord te vinden. Je mag NIET direct "ja" of "nee" zeggen.

HINTS MOETEN:
- De student wijzen op specifieke kenmerken om naar te kijken
- Uitleggen HOE je dit kunt herkennen in de foto
- Kort en praktisch zijn (max 2-3 zinnen)

HINTS MOGEN NIET:
- Het antwoord direct geven ("ja, dit is..." of "nee, dit heeft...")
- Te vaag zijn ("kijk goed" of "let op de vorm")

VOORBEELD GOEDE HINTS:
- "Zoek naar een duidelijke hoek of punt aan één kant. Schrabbers hebben vaak een rechte of licht gebogen werkrand."
- "Let op de dikte: kern werktuigen zijn meestal dikker dan afslagen omdat de kern het oorspronkelijke blok is."
- "Kijk naar de oppervlaktestructuur: cortex (de buitenste laag) heeft vaak een ruwer, mat uiterlijk."

Geef nu een praktische hint voor deze foto en vraag.`;

  const anthropicBody = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: pureBase64,
          },
        },
        {
          type: 'text',
          text: hintPrompt,
        },
      ],
    }],
  };

  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(anthropicBody),
  });

  if (!anthropicResponse.ok) {
    const errorText = await anthropicResponse.text();
    console.error('Anthropic hint error:', errorText);
    return new Response(
      JSON.stringify({ error: { message: 'AI hint kon niet worden gegenereerd.' } }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  interface AnthropicResponse {
    content: Array<{ type: string; text?: string }>;
  }

  const result = await anthropicResponse.json() as AnthropicResponse;
  const hintText = result.content?.find(c => c.type === 'text')?.text || 'Geen hint beschikbaar.';

  // Count this request (hints cost API calls too)
  await env.RATE_LIMIT.put(rateLimitKey, String(currentCount + 1), {
    expirationTtl: 86400,
  });

  return new Response(
    JSON.stringify({
      success: true,
      hint: hintText,
    }),
    {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    }
  );
}

// Handle AI validation requests after decision tree completion
async function handleValidateRequest(
  request: Request,
  env: Env,
  rateLimitKey: string,
  currentCount: number
): Promise<Response> {
  if (!env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: { message: 'API key niet geconfigureerd.' } }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  interface DeterminationStep {
    questionId: string;
    questionText: string;
    answer: 'ja' | 'nee';
  }

  interface ValidateRequestBody {
    imageBase64: string;
    resultType: string;
    resultDescription?: string;
    steps: DeterminationStep[];
  }

  let body: ValidateRequestBody;
  try {
    body = await request.json() as ValidateRequestBody;
  } catch {
    return new Response(
      JSON.stringify({ error: { message: 'Ongeldige JSON in request.' } }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const { imageBase64, resultType, resultDescription, steps } = body;

  if (!imageBase64 || !resultType || !steps) {
    return new Response(
      JSON.stringify({ error: { message: 'Afbeelding, resultaat en stappen zijn verplicht.' } }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  // Extract media type from base64 string
  const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
  const mediaType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const pureBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  // Format the determination path
  const pathDescription = steps.map((step, i) =>
    `${i + 1}. "${step.questionText}" → ${step.answer.toUpperCase()}`
  ).join('\n');

  const validatePrompt = `Je bent een ervaren archeoloog die de determinatie van een student valideert.

De student heeft een stenen object gefotografeerd en de beslisboom doorlopen.

GEVOLGDE PAD:
${pathDescription}

UITKOMST: ${resultType}${resultDescription ? ` (${resultDescription})` : ''}

JOUW TAAK:
Bekijk de foto en beoordeel of de determinatie correct is.

GEEF JE ANTWOORD IN DIT FORMAT:

**Oordeel:** [CORRECT / TWIJFELACHTIG / ONJUIST]

**Uitleg:**
[Korte uitleg (2-3 zinnen) waarom je dit vindt]

**Tip:**
[Eén praktische tip voor de student, bijv. waar ze op kunnen letten]

BELANGRIJK:
- Wees eerlijk maar constructief
- Focus op educatie, niet op afkraken
- Als je twijfelt, zeg dat eerlijk
- Houd het beknopt`;

  const anthropicBody = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: pureBase64,
          },
        },
        {
          type: 'text',
          text: validatePrompt,
        },
      ],
    }],
  };

  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(anthropicBody),
  });

  if (!anthropicResponse.ok) {
    const errorText = await anthropicResponse.text();
    console.error('Anthropic validate error:', errorText);
    return new Response(
      JSON.stringify({ error: { message: 'AI validatie kon niet worden uitgevoerd.' } }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  interface AnthropicResponse {
    content: Array<{ type: string; text?: string }>;
  }

  const result = await anthropicResponse.json() as AnthropicResponse;
  const validationText = result.content?.find(c => c.type === 'text')?.text || '';

  // Parse the response to extract verdict
  let verdict: 'correct' | 'twijfelachtig' | 'onjuist' = 'twijfelachtig';
  const verdictMatch = validationText.match(/\*\*Oordeel:\*\*\s*(CORRECT|TWIJFELACHTIG|ONJUIST)/i);
  if (verdictMatch) {
    const v = verdictMatch[1].toLowerCase();
    if (v === 'correct') verdict = 'correct';
    else if (v === 'onjuist') verdict = 'onjuist';
    else verdict = 'twijfelachtig';
  }

  // Count this request
  await env.RATE_LIMIT.put(rateLimitKey, String(currentCount + 1), {
    expirationTtl: 86400,
  });

  return new Response(
    JSON.stringify({
      success: true,
      verdict,
      feedback: validationText,
    }),
    {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    }
  );
}
