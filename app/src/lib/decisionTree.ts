import type { DecisionTree, ImageMetadata } from '../types';

// Import beslisboom data
import beslisboomData from '../data/beslisboom.json';
import imageMetadata from '../data/images_metadata.json';
import pageMapping from '../data/pagina_vraag_mapping.json';

export const decisionTree: DecisionTree = beslisboomData as DecisionTree;
export const imagesMeta: ImageMetadata[] = imageMetadata as ImageMetadata[];
export const pageToQuestion: Record<string, string> = pageMapping as Record<string, string>;

// Vind afbeeldingen voor een vraag
export function getImagesForQuestion(questionId: string): ImageMetadata[] {
  return imagesMeta.filter((img) => img.question === questionId);
}

// Vind de eerste vraag (start van beslisboom)
export function getFirstQuestion(): string {
  return '1';
}

// Bepaal of een antwoord een eindresultaat is of een verwijzing naar volgende vraag
export function isEndResult(answer: string | null): boolean {
  if (!answer) return false;
  // Als het antwoord een vraagnummer is, is het geen eindresultaat
  const isQuestionRef = /^\d+[a-z]?$/.test(answer) || answer.includes('..') || answer.includes('terug');
  return !isQuestionRef;
}

// Parse een antwoord om de volgende vraag of het eindresultaat te krijgen
export function parseAnswer(answer: string | null): { isEnd: boolean; value: string | null } {
  if (!answer) return { isEnd: false, value: null };

  // Clean up het antwoord
  const cleaned = answer.toLowerCase().replace(/\s+/g, '-');

  // Check of het een navigatie-antwoord is
  if (cleaned.includes('terug') || cleaned.includes('artefactgroepen') || cleaned.includes('start')) {
    return { isEnd: false, value: null };
  }

  // Check of het een vraagnummer referentie is
  const questionMatch = cleaned.match(/^(\d+[a-z]?)$/);
  if (questionMatch) {
    return { isEnd: false, value: questionMatch[1] };
  }

  // Anders is het een eindresultaat
  return { isEnd: true, value: answer };
}

// Formateer een type naam voor weergave
export function formatTypeName(typeName: string): string {
  return typeName
    .replace(/--+/g, '-')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
