// AI Analyse service voor stenen artefacten determinatie
// Gebruikt Claude API met determinatie-kennis als context

export const DETERMINATION_CONTEXT = `
Je bent een expert in de determinatie van (vuur-)stenen artefacten uit de steentijd.
Je analyseert foto's van stenen objecten en bepaalt of het artefacten zijn en zo ja, welk type.

DETERMINATIE ALGORITME:

1. EERSTE BEOORDELING
- Is het object kleiner dan 1 cm en onbewerkt? → Splinter (afvalproduct)
- Heeft het een doorboring (gat)? → Doorboord artefact (hamerbijl, sieraad)
- Is het vuursteen, kwartsiet of lydiet? → Verder analyseren, anders: andere steensoort

2. BEWERKINGSTECHNIEKEN HERKENNEN
- Geslepen/gepolijste vlakken → Geslepen artefact (bijl, disseltje)
- Ventrale zijde (buikzijde met slagbult) → Afslag of kling
- Afslagnegatieven (holle littekens) → Bewerkt door mensen
- Retouche (kleine afslagjes langs rand) → Werktuig

3. HOOFDCATEGORIEËN

KERNEN (reststuk na maken afslagen):
- Levallois-kern: schildpadvorm, naar midden gerichte negatieven
- Discuskern: rond, beide zijden bewerkt
- Klingkern: langwerpige parallelle negatieven
- Afslagkern: onregelmatige negatieven

KERNWERKTUIGEN (werktuig gemaakt van kern):
- Vuistbijl: >6cm, bifaciaal, symmetrisch druppel/hartvorm
- Chopper/chopping tool: grove snijkant aan één zijde
- Boor/priem: kleine kern met scherpe punt

AFSLAGEN EN KLINGEN:
- Kling: lengte ≥ 2x breedte
- Afslag: korter dan 2x breedte
- Onbewerkt: geen retouche
- Geretoucheerd: bewerkte randen
- Schrabber: afgeronde geretoucheerde kop
- Spits: scherpe punt (projectiel)
- Rugmes: stompe rug voor vasthouden

GESLEPEN ARTEFACTEN:
- Geslepen bijl: breed snijvlak
- Disseltje: smaller, asymmetrisch

4. TIJDSPERIODES
- Vroeg Paleolithicum (tot 300.000 BP): vuistbijlen, choppers
- Midden Paleolithicum (300.000-35.000 BP): Levallois-techniek, schrabbers
- Laat Paleolithicum (35.000-10.000 BP): klingen, rugmessen
- Mesolithicum (10.000-5.000 BP): microlieten, trapezia
- Neolithicum (5.000-2.000 BP): geslepen bijlen, pijlpunten

5. MATERIALEN
- Vuursteen: glad, schelp-achtige breuk, vaak grijs/bruin/zwart
- Kwartsiet: hard, korrelig
- Lydiet: zwarte leisteen
- Obsidiaan: vulkanisch glas, zeer scherp

INSTRUCTIES VOOR ANALYSE:
1. Beschrijf wat je ziet: vorm, grootte, kleur, textuur
2. Identificeer bewerkingssporen: slagbult, afslagnegatieven, retouche, slijpvlakken
3. Bepaal het type artefact
4. Schat de periode als mogelijk
5. Geef een betrouwbaarheidsscore (laag/gemiddeld/hoog)
6. Vermeld wat je niet kunt zien of beoordelen

Antwoord ALTIJD in het Nederlands.
`;

export interface AnalysisResult {
  success: boolean;
  description?: string;
  type?: string;
  period?: string;
  confidence?: 'laag' | 'gemiddeld' | 'hoog';
  characteristics?: string[];
  error?: string;
}

// Worker URL voor API calls (met rate limiting)
const WORKER_URL = 'https://steentijd-api.mail-b-van-dongen.workers.dev';

// Analyseer één of meerdere afbeeldingen
export async function analyzeImage(
  imageBase64: string | string[], // Kan één of meerdere base64 strings zijn
  sizeInfo?: string, // Optionele grootte informatie, bijv. "5x3 cm"
  contextInfo?: string // Optionele vindplaats/context informatie
): Promise<AnalysisResult> {
  try {
    // Zorg dat we altijd een array hebben
    const images = Array.isArray(imageBase64) ? imageBase64 : [imageBase64];

    // Bouw content array met alle afbeeldingen
    const imageContent = images.map((img) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: 'image/jpeg' as const,
        data: img.replace(/^data:image\/\w+;base64,/, ''),
      },
    }));

    const multiImageNote = images.length > 1
      ? `\n\nJe krijgt ${images.length} afbeeldingen van hetzelfde artefact vanuit verschillende hoeken. Gebruik alle afbeeldingen voor een complete analyse.`
      : '';

    const sizeNote = sizeInfo
      ? `\n\nDe gebruiker heeft aangegeven dat het artefact ongeveer ${sizeInfo} groot is. Gebruik deze informatie bij je determinatie.`
      : '';

    const contextNote = contextInfo
      ? `\n\nVINDPLAATS/CONTEXT: ${contextInfo}\nDit is belangrijke informatie! De geologische en geografische context kan veel zeggen over het type artefact en de periode. Veengebieden in Noord-Holland, grindpaden in Drenthe, of kalksteenrijke gebieden in Zuid-Frankrijk hebben elk hun eigen karakteristieke vondsten. Neem deze context mee in je analyse.`
      : '';

    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: [
              ...imageContent,
              {
                type: 'text',
                text: `${DETERMINATION_CONTEXT}${multiImageNote}${sizeNote}${contextNote}

Analyseer ${images.length > 1 ? 'deze foto\'s' : 'deze foto'} van een mogelijk stenen artefact. Geef je analyse in het volgende format:

**Type:** [type artefact of "geen artefact" of "onduidelijk"]
**Periode:** [geschatte periode of "onbekend"]
**Betrouwbaarheid:** [laag/gemiddeld/hoog]

**Beschrijving:**
[Gedetailleerde beschrijving van wat je ziet]

**Kenmerken:**
- [kenmerk 1]
- [kenmerk 2]
- ...

**Opmerkingen:**
[Eventuele opmerkingen over fotokwaliteit, wat je niet kunt beoordelen, etc.]`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
      return { success: false, error: `API fout: ${errorMessage}` };
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    // Parse de response
    const typeMatch = content.match(/\*\*Type:\*\*\s*(.+)/i);
    const periodMatch = content.match(/\*\*Periode:\*\*\s*(.+)/i);
    const confidenceMatch = content.match(/\*\*Betrouwbaarheid:\*\*\s*(.+)/i);
    const characteristicsMatch = content.match(/\*\*Kenmerken:\*\*\n([\s\S]*?)(?=\n\*\*|$)/i);

    const characteristics: string[] = [];
    if (characteristicsMatch) {
      const lines = characteristicsMatch[1].split('\n');
      for (const line of lines) {
        const cleaned = line.replace(/^-\s*/, '').trim();
        if (cleaned) characteristics.push(cleaned);
      }
    }

    let confidence: 'laag' | 'gemiddeld' | 'hoog' = 'gemiddeld';
    if (confidenceMatch) {
      const conf = confidenceMatch[1].toLowerCase();
      if (conf.includes('laag')) confidence = 'laag';
      else if (conf.includes('hoog')) confidence = 'hoog';
    }

    return {
      success: true,
      description: content,
      type: typeMatch?.[1]?.trim() || 'Onbekend',
      period: periodMatch?.[1]?.trim() || 'Onbekend',
      confidence,
      characteristics,
    };
  } catch (err) {
    console.error('Analysis error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Onbekende fout bij analyse',
    };
  }
}

// Convert blob to base64
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
