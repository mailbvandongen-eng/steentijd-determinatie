import type { ImageMetadata } from '../types';

// Import image metadata
import imageMetadata from '../data/images_metadata.json';

export const imagesMeta: ImageMetadata[] = imageMetadata as ImageMetadata[];

// Handmatige beslisboom met correcte navigatie
// Gebaseerd op het AWN Algoritme Typebepaling (Vuur-)Stenen Artefacten
export interface QuestionNode {
  id: string;
  vraag: string;
  toelichting?: string;
  jaResultaat?: string;      // Eindresultaat als "Ja"
  jaVolgende?: string;       // Volgende vraag als "Ja"
  neeResultaat?: string;     // Eindresultaat als "Nee"
  neeVolgende?: string;      // Volgende vraag als "Nee"
}

export const beslisboom: Record<string, QuestionNode> = {
  "1": {
    id: "1",
    vraag: "Is het object kleiner dan 1 cm en niet bewerkt?",
    toelichting: "Zeer kleine onbewerkte stukjes vuursteen worden 'splinters' genoemd en zijn meestal afvalproducten.",
    jaResultaat: "splinter",
    neeVolgende: "2"
  },
  "2": {
    id: "2",
    vraag: "Heeft het object een doorboring (gat) die door mensen is gemaakt?",
    toelichting: "Kijk of er een gat doorheen gaat dat niet natuurlijk is ontstaan. Doorboorde objecten zijn vaak sieraden of werktuigen.",
    jaVolgende: "200", // Doorboorde artefacten pad
    neeVolgende: "3"
  },
  "3": {
    id: "3",
    vraag: "Is het gemaakt van vuursteen, kwartsiet of lydiet?",
    toelichting: "Vuursteen is meestal grijs/bruin met gladde breukvlakken. Kwartsiet is hard en korrelig. Lydiet is zwarte leisteen.",
    jaVolgende: "5",
    neeVolgende: "4"
  },
  "4": {
    id: "4",
    vraag: "Heeft het de vorm van een geslepen bijl?",
    toelichting: "Geslepen bijlen van andere steensoorten (zoals graniet) hebben gladde, gepolijste vlakken.",
    jaResultaat: "geslepen-bijl-andere-steensoort",
    neeResultaat: "geslepen-stenen-artefact"
  },
  "5": {
    id: "5",
    vraag: "Heeft het object geslepen of gepolijste vlakken?",
    toelichting: "Geslepen vlakken zijn glad en glanzend, anders dan de ruwe breukvlakken van vuursteen.",
    jaVolgende: "100", // Geslepen artefacten pad
    neeVolgende: "6"
  },
  "6": {
    id: "6",
    vraag: "Heeft het object een ventrale (buik)zijde?",
    toelichting: "De ventrale zijde is de onderkant van een afslag: glad met een slagbult bij het slagpunt. Als dit aanwezig is, is het een afslag of kling.",
    jaVolgende: "40", // Afslag/kling pad
    neeVolgende: "7"
  },
  "7": {
    id: "7",
    vraag: "Heeft het object afslagnegatieven (littekens van verwijderde afslagen)?",
    toelichting: "Afslagnegatieven zijn de holle vlakken die ontstaan waar eerder stukken zijn afgeslagen.",
    jaVolgende: "8",
    neeResultaat: "natuursteen-of-knol"
  },
  "8": {
    id: "8",
    vraag: "Heeft het meer dan 2 afslagnegatieven?",
    toelichting: "Objecten met slechts 1-2 afslagnegatieven kunnen natuurlijk gebroken zijn. Meer dan 2 duidt op menselijke bewerking.",
    jaVolgende: "9",
    neeResultaat: "brok-of-vorstsplijting"
  },
  "9": {
    id: "9",
    vraag: "Heeft het een duidelijke werkkant of punt?",
    toelichting: "Een werkkant is een rand die bewerkt is voor gebruik (snijden, schrapen). Een punt is een scherpe uitstekende punt.",
    jaVolgende: "20", // Kernwerktuigen pad
    neeVolgende: "10"
  },
  "10": {
    id: "10",
    vraag: "Is het een kern (reststuk na het maken van afslagen)?",
    toelichting: "Een kern is het blok waarvan afslagen zijn geslagen. Het heeft meerdere afslagnegatieven en vaak een herkenbaar slagvlak.",
    jaVolgende: "11", // Kernen pad
    neeResultaat: "onbepaald-artefact"
  },

  // Kernen pad (vereenvoudigd)
  "11": {
    id: "11",
    vraag: "Heeft de kern één of meerdere grote, herkenbare slagvlakken?",
    toelichting: "Het slagvlak is het vlak waarop geslagen werd om afslagen te produceren.",
    jaVolgende: "12",
    neeResultaat: "kern-gelegenheids"
  },
  "12": {
    id: "12",
    vraag: "Heeft de kern naar het midden gerichte afslagnegatieven aan beide zijden (schildpadvorm)?",
    toelichting: "Dit is typisch voor de Levallois-techniek uit het Midden-Paleolithicum.",
    jaResultaat: "kern-levallois",
    neeVolgende: "13"
  },
  "13": {
    id: "13",
    vraag: "Heeft de kern een discusvorm (rond, aan beide zijden bewerkt)?",
    toelichting: "Discuskernen zijn rond en hebben aan beide kanten afslagnegatieven naar het midden gericht.",
    jaResultaat: "kern-diskusvormig",
    neeVolgende: "14"
  },
  "14": {
    id: "14",
    vraag: "Zijn de afslagnegatieven vooral langwerpig (voor klingproductie)?",
    toelichting: "Klingkernen hebben lange, parallelle afslagnegatieven.",
    jaResultaat: "kern-kling",
    neeResultaat: "kern-afslag"
  },

  // Kernwerktuigen pad (vereenvoudigd)
  "20": {
    id: "20",
    vraag: "Is het groter dan 6 cm en aan twee zijden bewerkt (bifaciaal)?",
    toelichting: "Grote bifaciale werktuigen zijn vaak vuistbijlen of hakwerktuigen.",
    jaVolgende: "21",
    neeVolgende: "25"
  },
  "21": {
    id: "21",
    vraag: "Heeft het een symmetrische, druppel- of hartvorm?",
    toelichting: "Vuistbijlen hebben vaak een kenmerkende symmetrische vorm.",
    jaResultaat: "vuistbijl",
    neeVolgende: "22"
  },
  "22": {
    id: "22",
    vraag: "Heeft het een snijdende kant aan één zijde?",
    toelichting: "Choppers en chopping tools hebben een bekapte rand aan één kant.",
    jaResultaat: "chopper-of-chopping-tool",
    neeResultaat: "kernwerktuig-grof"
  },
  "25": {
    id: "25",
    vraag: "Heeft het een scherpe punt?",
    toelichting: "Kleine kernwerktuigen met een punt kunnen boren of priemen zijn.",
    jaResultaat: "boor-of-priem",
    neeResultaat: "kernwerktuig-klein"
  },

  // Afslag/kling pad (vereenvoudigd)
  "40": {
    id: "40",
    vraag: "Is het object minstens 2x zo lang als breed?",
    toelichting: "Een kling is een langwerpige afslag (lengte ≥ 2x breedte).",
    jaVolgende: "50", // Klingen
    neeVolgende: "60"  // Afslagen
  },
  "50": {
    id: "50",
    vraag: "Is de kling verder bewerkt (geretoucheerd)?",
    toelichting: "Retouche zijn kleine afslagjes langs de rand voor het scherpen of vormen van het werktuig.",
    jaVolgende: "51",
    neeResultaat: "kling-onbewerkt"
  },
  "51": {
    id: "51",
    vraag: "Heeft de kling een stompe (afgeknotte) rug?",
    toelichting: "Rugmessen hebben een afgestompte rug om het werktuig vast te kunnen houden.",
    jaResultaat: "rugmes",
    neeVolgende: "52"
  },
  "52": {
    id: "52",
    vraag: "Heeft de kling retouche aan het uiteinde (schrabber)?",
    toelichting: "Klingschrabbers hebben een afgeronde, geretoucheerde kop.",
    jaResultaat: "klingschrabber",
    neeResultaat: "geretoucheerde-kling"
  },
  "60": {
    id: "60",
    vraag: "Is de afslag verder bewerkt (geretoucheerd)?",
    toelichting: "Bewerkte afslagen zijn vaak werktuigen zoals schrabbers of spitsen.",
    jaVolgende: "61",
    neeResultaat: "afslag-onbewerkt"
  },
  "61": {
    id: "61",
    vraag: "Heeft de afslag een ronde, geretoucheerde kop?",
    toelichting: "Dit is typisch voor schrabbers, gebruikt voor het bewerken van huiden.",
    jaResultaat: "schrabber",
    neeVolgende: "62"
  },
  "62": {
    id: "62",
    vraag: "Heeft de afslag een scherpe punt?",
    toelichting: "Spitsen werden gebruikt als projectielpunt of priem.",
    jaResultaat: "spits",
    neeResultaat: "geretoucheerde-afslag"
  },

  // Geslepen artefacten (vereenvoudigd)
  "100": {
    id: "100",
    vraag: "Heeft het de vorm van een bijl (breed snijvlak)?",
    toelichting: "Geslepen bijlen hebben een breed snijvlak aan één kant.",
    jaResultaat: "geslepen-vuurstenen-bijl",
    neeResultaat: "geslepen-vuurstenen-artefact"
  },

  // Doorboorde artefacten (vereenvoudigd)
  "200": {
    id: "200",
    vraag: "Is het een stenen bijl met een gat voor de steel?",
    toelichting: "Hamerbijlen en strijdhamers hebben een doorboring voor bevestiging aan een houten steel.",
    jaResultaat: "hamerbijl",
    neeResultaat: "doorboord-artefact"
  }
};

// Vind afbeeldingen voor een vraag
export function getImagesForQuestion(questionId: string): ImageMetadata[] {
  return imagesMeta.filter((img) => img.question === questionId);
}

// Haal vraag op
export function getQuestion(id: string): QuestionNode | undefined {
  return beslisboom[id];
}

// Verwerk antwoord en bepaal volgende stap
export function processAnswer(questionId: string, answer: 'ja' | 'nee'): {
  isEnd: boolean;
  nextQuestion?: string;
  result?: string;
} {
  const question = beslisboom[questionId];
  if (!question) {
    return { isEnd: true, result: 'onbekend' };
  }

  if (answer === 'ja') {
    if (question.jaResultaat) {
      return { isEnd: true, result: question.jaResultaat };
    }
    if (question.jaVolgende) {
      return { isEnd: false, nextQuestion: question.jaVolgende };
    }
  } else {
    if (question.neeResultaat) {
      return { isEnd: true, result: question.neeResultaat };
    }
    if (question.neeVolgende) {
      return { isEnd: false, nextQuestion: question.neeVolgende };
    }
  }

  return { isEnd: true, result: 'onbepaald' };
}

// Formateer resultaat naam
export function formatTypeName(typeName: string): string {
  const namen: Record<string, string> = {
    'splinter': 'Splinter (afval)',
    'natuursteen-of-knol': 'Natuursteen of knol (geen artefact)',
    'brok-of-vorstsplijting': 'Brok of vorstsplijting',
    'onbepaald-artefact': 'Onbepaald artefact',
    'kern-gelegenheids': 'Gelegenheids-kern',
    'kern-levallois': 'Levallois-kern',
    'kern-diskusvormig': 'Diskusvormige kern',
    'kern-kling': 'Klingkern',
    'kern-afslag': 'Afslagkern',
    'vuistbijl': 'Vuistbijl',
    'chopper-of-chopping-tool': 'Chopper of chopping tool',
    'kernwerktuig-grof': 'Grof kernwerktuig',
    'boor-of-priem': 'Boor of priem',
    'kernwerktuig-klein': 'Klein kernwerktuig',
    'kling-onbewerkt': 'Onbewerkte kling',
    'rugmes': 'Rugmes',
    'klingschrabber': 'Klingschrabber',
    'geretoucheerde-kling': 'Geretoucheerde kling',
    'afslag-onbewerkt': 'Onbewerkte afslag',
    'schrabber': 'Schrabber',
    'spits': 'Spits',
    'geretoucheerde-afslag': 'Geretoucheerde afslag',
    'geslepen-vuurstenen-bijl': 'Geslepen vuurstenen bijl',
    'geslepen-vuurstenen-artefact': 'Geslepen vuurstenen artefact',
    'geslepen-bijl-andere-steensoort': 'Geslepen bijl (andere steensoort)',
    'geslepen-stenen-artefact': 'Geslepen stenen artefact',
    'hamerbijl': 'Hamerbijl of strijdhamer',
    'doorboord-artefact': 'Doorboord artefact'
  };
  return namen[typeName] || typeName.replace(/-/g, ' ');
}
