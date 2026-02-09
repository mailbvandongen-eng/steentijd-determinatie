# Steentijd Determinatie App

## Project Doel
Een determinatie-app bouwen waarmee gebruikers met telefoon en webpagina stenen artefacten kunnen determineren.

## Bronnen

### Website
https://awn-archeologie.nl/werkgroep/steentijd/determinatie/

### PDF Downloads (te groot voor directe fetch)
1. **Handboek printversie**: https://awn-archeologie.nl/werkgroep/steentijd/wp-content/uploads/2026/02/6-Handleiding-versie-1.0-printversie.pdf
2. **Handboek digitale versie**: https://awn-archeologie.nl/werkgroep/steentijd/wp-content/uploads/2026/02/5-Handleiding-versie-1.0-digitale-versie.pdf
3. **Algoritme laptopversie**: https://awn-archeologie.nl/werkgroep/steentijd/wp-content/uploads/2026/02/4-Algoritme-versie-1.0-Laptopversie.pdf
4. **Algoritme GSM-versie**: https://awn-archeologie.nl/werkgroep/steentijd/wp-content/uploads/2026/02/7-Algoritme-versie-1.0-GSMversie.pdf

### Gekozen bronnen voor app
- Handboek: digitale versie
- Algoritme: GSM-versie

## Technische Uitdagingen

### Probleem: PDF's te groot voor directe Read
- PDF's zijn 6MB+ - de Read tool crasht hierop
- De offset/limit parameters werken op **regels**, niet op PDF-pagina's
- Dus "in delen lezen" werkt niet voor PDF's

### Oplossing: Python tekst-extractie
1. Installeer PyPDF2: `pip install PyPDF2`
2. Draai `extract_pdf.py` script
3. Leest tekstbestanden in plaats van PDF's

### Crash-preventie checklist
- [x] NOOIT grote PDF's direct lezen met Read tool
- [x] ALTIJD eerst converteren naar .txt met Python script
- [x] Tekstbestanden kunnen WEL in delen gelezen worden met offset/limit

### Geëxtraheerde bestanden
- `handleiding.txt` - 270KB, 194 pagina's geëxtraheerd
- `algoritme.txt` - 209KB, 520 pagina's geëxtraheerd

### Benodigde Python packages
```bash
pip install PyPDF2 pycryptodome PyMuPDF
```

### Scripts
| Script | Functie |
|--------|---------|
| `extract_pdf.py` | PDF → tekst extractie |
| `extract_images.py` | PDF → afbeeldingen + metadata |
| `parse_algoritme.py` | Tekst → beslisboom JSON |

## Determinatie Structuur

### Hiërarchie (3 niveaus)

**Niveau 1: Hoofdcategorieën**
- 1A: Kernen (resten na het afslaan)
- 1B: Onbewerkte afslagen en klingen (halffabricaten)
- 1C: Gemodificeerde brokken, vorstsplijtingen en kernen

**Niveau 2: Werktuiggroepen**
- 2A: "Kern"-werktuigen (gemaakt van knol/brok)
- 2B: "Afslag/kling"-werktuigen (gemaakt van afslag/kling)
- 2C: Geslepen kern-werktuigen (niet doorboord)
- 2D: Doorboorde werktuigen

**Niveau 3: Specifieke groepen**
- 3A1: Vuistbijlen
- 3A2: Kleine bifaciale stukken
- 3B1: Stukken met (half-)steile retouche
- 3B2: Eén- of tweezijdig steil geretoucheerde spitsen
- 3B3: Stukken met oppervlakteretouche
- 3C1: Bijlen
- 3C2: Overige bewerkte stenen
- 3D1: Hamerbijlen

### Beslisboom Start (eerste vragen)

```
..1: Is het niet bewerkt en < 1cm?
     → Ja: SPLINTER
     → Nee: ga naar ..2

..2: Heeft het een niet-natuurlijk gat?
     → Ja: DOORBOORD-ARTEFACT (niveau 2D)
     → Nee: ga naar ..3

..3: Is het vuursteen, kwartsiet of lydiet?
     → Ja: ga naar ..5
     → Nee: ga naar ..4 (andere steensoort)

..4: Heeft het de vorm van een geslepen bijl?
     → Ja: GESLEPEN-BIJL
     → Nee: GESLEPEN-STENEN-ARTEFACT

..5: Heeft het geslepen/gepolijste vlakken?
     → Ja: GESLEPEN-VUURSTENEN-ARTEFACT
     → Nee: ga naar ..6

..6: Heeft het een ventrale zijde?
     → Ja: ga naar afslag/kling pad
     → Nee: ga naar kern/bifaciaal pad

..7: Heeft het afslagnegatieven?
     → Ja: ga naar ..8
     → Nee: KNOL/BROK/VORSTSPLIJTING

..8: Heeft het meer dan 2 afslagnegatieven?
     → Ja: ga naar ..9
     → Nee: BROK of VORSTSPLIJTING

..9: Heeft het een werkkant of punt?
     → Ja: KERN-WERKTUIG
     → Nee: KERN
```

### Artefact Types (voorbeelden)

**Kernen:** kern-levallois, kern-diskusvormig, kern-bipolair, kern-kling, kern-lamelle

**Afslagen:** afslag-decorticatie, afslag-levallois, afslag-kombewa, afslag-kernpreparatie

**Klingen:** kling-levallois, kling-montbanistijl, kling-coincystijl

**Spitsen:** spits-levallois, spits-tayac, spits-emireh, spits-blad, spits-moustérien

**Vuistbijlen:** vuistbijl-hartvormig, vuistbijl-amandelvormig, vuistbijl-driehoekig, vuistbijl-ovaal

**Dolken:** dolk-grand-pressigny, dolk-scandinavisch (type I t/m III)

**Overig:** schrabber, boor, steker, rugmes, chopper, keilmesser

## Geëxtraheerde Data

### Bestanden
| Bestand | Inhoud |
|---------|--------|
| `beslisboom.json` | 511 vragen met ja/nee antwoorden |
| `artefact_types.json` | 630 unieke artefact types |
| `pagina_vraag_mapping.json` | 512 pagina → vraag koppelingen |
| `images_algoritme/` | 613 afbeeldingen (foto's + tekeningen) |
| `images_handleiding/` | 1318 afbeeldingen (technische illustraties) |
| `images_algoritme/_metadata.json` | Afbeelding metadata met vraag-koppeling |

### Statistieken
- **Vragen:** 511 beslispunten (..1 t/m ..210+)
- **Types:** 630 unieke artefact classificaties
- **Niveaus:** 3 hiërarchische niveaus
- **Afbeeldingen:** 1931 totaal (~40 MB)

### Afbeelding Structuur
```
images_algoritme/
├── _metadata.json          # Koppeling afbeelding → vraag
├── p005_img1.png          # Pagina 5, afbeelding 1 → vraag ..2
├── p005_img2.jpeg
└── ...

Elke entry in _metadata.json:
{
  "file": "p005_img1.png",
  "page": 5,
  "question": "2",          # Vraagnummer (..2)
  "size_kb": 11,
  "width": 107,
  "height": 119
}
```

## App Ontwerp

### Gebruikers Flow
```
┌─────────────────────────────────────────────────────────────────┐
│  1. INPUT                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Upload foto  │  │ Maak foto    │  │ Neem video   │          │
│  │              │  │ (camera)     │  │ (360° draai) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. AI ANALYSE (semi-automatisch)                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ AI suggereert: "Lijkt op doorboord artefact"               │ │
│  │ Referentie afbeeldingen uit handleiding                    │ │
│  │                                                            │ │
│  │ [✓ Bevestig]  [✗ Niet correct]  [? Twijfel]               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ↓                                  │
│  Herhaal voor elke vraag in beslisboom                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. RESULTAAT                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Determinatie: VUISTBIJL-HARTVORMIG                         │ │
│  │                                                            │ │
│  │ Doorlopen pad:                                             │ │
│  │ ..1 Niet bewerkt < 1cm? → Nee                             │ │
│  │ ..2 Niet-natuurlijk gat? → Nee                            │ │
│  │ ..3 Vuursteen? → Ja                                       │ │
│  │ ..5 Geslepen vlakken? → Nee                               │ │
│  │ ... → VUISTBIJL-HARTVORMIG                                │ │
│  │                                                            │ │
│  │ [Opslaan] [Delen] [Nieuwe determinatie]                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Architectuur
```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (PWA)                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ Camera      │ │ Beslisboom  │ │ Geschiedenis│               │
│  │ Interface   │ │ Navigator   │ │ Viewer      │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ IndexedDB (lokale opslag)                                   ││
│  │ - Sessies (beeld + pad + resultaat)                         ││
│  │ - Offline afbeeldingen cache                                ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              ↓ sync (optioneel)
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (optioneel)                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ API         │ │ Database    │ │ ML Model    │               │
│  │ (REST/WS)   │ │ (PostgreSQL)│ │ (TensorFlow)│               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

### Data Model: Determinatie Sessie
```json
{
  "id": "uuid",
  "created_at": "2026-02-09T12:00:00Z",
  "updated_at": "2026-02-09T12:05:00Z",
  "status": "completed",

  "input": {
    "type": "photo|video",
    "file_id": "local-blob-id",
    "thumbnail": "base64..."
  },

  "steps": [
    {
      "question_id": "1",
      "question_text": "Is het niet bewerkt en < 1cm?",
      "ai_suggestion": "nee",
      "ai_confidence": 0.85,
      "user_answer": "nee",
      "reference_images": ["p004_img1.png"],
      "timestamp": "2026-02-09T12:01:00Z"
    },
    {
      "question_id": "2",
      "question_text": "Heeft het een niet-natuurlijk gat?",
      "ai_suggestion": "nee",
      "ai_confidence": 0.72,
      "user_answer": "nee",
      "reference_images": ["p005_img1.png", "p005_img3.png"],
      "timestamp": "2026-02-09T12:01:30Z"
    }
  ],

  "result": {
    "type": "vuistbijl-hartvormig",
    "category": "3A1",
    "confidence": 0.78,
    "description": "Hartvormige vuistbijl uit het Acheuléen"
  },

  "synced": false
}
```

### Technologie Stack
| Component | Technologie | Reden |
|-----------|-------------|-------|
| Frontend | React + TypeScript | Component-based, type-safe |
| Styling | Tailwind CSS | Snel responsive design |
| Camera | MediaDevices API | Native browser support |
| Lokale DB | IndexedDB (Dexie.js) | Grote bestanden, offline |
| AI (fase 1) | TensorFlow.js | Client-side inference |
| AI (fase 2) | Custom model | Getraind op 1931 afbeeldingen |
| Backend | Node.js + Express | JavaScript ecosystem |
| Database | PostgreSQL | Robuust, JSON support |
| Hosting | Vercel/Railway | Eenvoudige deployment |

### Ontwikkelfases

**Fase 1: MVP (zonder AI)**
- [ ] Camera/upload interface
- [ ] Handmatige beslisboom doorloop
- [ ] Referentieafbeeldingen tonen
- [ ] Lokale opslag sessies
- [ ] Resultaat met doorlopen pad

**Fase 2: AI Suggesties**
- [ ] TensorFlow.js model voor basis kenmerken
- [ ] Suggesties per vraag
- [ ] Confidence scores

**Fase 3: Cloud Sync**
- [ ] Backend API
- [ ] User accounts (optioneel)
- [ ] Sync tussen devices

**Fase 4: Volledig Automatisch**
- [ ] Custom model trainen op 1931 afbeeldingen + user feedback
- [ ] Video analyse (meerdere frames)
- [ ] Automatische feature detectie
- [ ] Auto-mode toggle (confidence threshold)
- [ ] Gebruiker review na automatische determinatie

### Upgrade Pad: Semi → Automatisch
```
┌─────────────────────────────────────────────────────────────────┐
│ AI Component Interface (modulair)                               │
├─────────────────────────────────────────────────────────────────┤
│ analyze(image) → { suggestion, confidence, features }           │
│                                                                 │
│ MODE: semi-auto          │  MODE: full-auto                    │
│ - Toon suggestie         │  - Als confidence > 0.85: door      │
│ - Wacht op bevestiging   │  - Anders: vraag bevestiging        │
│ - Sla feedback op        │  - Toon resultaat + "Klopt dit?"    │
└─────────────────────────────────────────────────────────────────┘

Elke correctie door gebruiker = training data voor model verbetering
```

## Volgende Stappen
1. ~~Download de twee gekozen PDF's lokaal~~
2. ~~Extraheer tekst en afbeeldingen~~
3. ~~Documenteer determinatie-logica~~
4. **TODO:** Bouw Fase 1 MVP

## Context
- AWN = Archeologische Werkgroep Nederland
- Landelijke Werkgroep Steentijd
- Doel: herkennen en determineren van stenen werktuigen uit de prehistorie
