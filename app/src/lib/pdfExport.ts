// PDF Export voor determinatie resultaten
import { jsPDF } from 'jspdf';
import type { DeterminationSession } from '../types';
import { formatTypeName } from './decisionTree';

export async function exportToPdf(session: DeterminationSession): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Titel
  doc.setFontSize(24);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text('Steentijd Determinatie', margin, y);
  y += 15;

  // Type artefact
  const typeName = session.result ? formatTypeName(session.result.type) : 'Onbekend';
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text(typeName, margin, y);
  y += 10;

  // Periode en betrouwbaarheid
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);

  if (session.result?.period && session.result.period !== 'Onbekend') {
    doc.text(`Periode: ${session.result.period}`, margin, y);
    y += 6;
  }

  if (session.result?.confidence) {
    doc.text(`Betrouwbaarheid: ${session.result.confidence}`, margin, y);
    y += 6;
  }

  y += 5;

  // Kenmerken
  if (session.result?.characteristics && session.result.characteristics.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Kenmerken:', margin, y);
    y += 7;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    for (const char of session.result.characteristics) {
      const lines = doc.splitTextToSize(`• ${char}`, pageWidth - margin * 2);
      for (const line of lines) {
        doc.text(line, margin + 5, y);
        y += 5;
      }
    }
    y += 5;
  }

  // Afbeelding(en) toevoegen
  const images = session.input.images || [];
  if (images.length > 0 || session.input.thumbnail) {
    const imagesToUse = images.length > 0 ? images : [{ thumbnail: session.input.thumbnail }];
    const maxImgWidth = (pageWidth - margin * 2 - 10) / 2; // 2 naast elkaar
    const maxImgHeight = 60;
    let imgX = margin;
    let rowStartY = y;

    for (let i = 0; i < Math.min(imagesToUse.length, 4); i++) {
      const img = imagesToUse[i];
      const src = img.thumbnail;
      if (!src) continue;

      try {
        // Check of we naar nieuwe rij moeten
        if (i > 0 && i % 2 === 0) {
          imgX = margin;
          y = rowStartY + maxImgHeight + 5;
          rowStartY = y;
        }

        doc.addImage(src, 'JPEG', imgX, y, maxImgWidth, maxImgHeight);
        imgX += maxImgWidth + 10;
      } catch (err) {
        console.warn('Kon afbeelding niet toevoegen aan PDF:', err);
      }
    }
    y = rowStartY + maxImgHeight + 10;
  }

  // Volledige analyse (als er ruimte is)
  if (session.result?.fullAnalysis && y < 220) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Analyse:', margin, y);
    y += 5;

    doc.setFontSize(9);
    const lines = doc.splitTextToSize(session.result.fullAnalysis, pageWidth - margin * 2);
    const maxLines = Math.floor((280 - y) / 4);
    for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
      doc.text(lines[i], margin, y);
      y += 4;
    }
    if (lines.length > maxLines) {
      doc.text('...', margin, y);
      y += 4;
    }
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const date = new Date().toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Gedetermineerd met Steentijd app • ${date}`, margin, 285);

  // Download
  const filename = `steentijd-${typeName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
  doc.save(filename);
}
