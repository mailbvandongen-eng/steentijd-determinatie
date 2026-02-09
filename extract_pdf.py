"""
PDF Tekst Extractie Script
Converteert grote PDF's naar leesbare tekstbestanden.
"""

import os
from PyPDF2 import PdfReader

def extract_pdf_to_text(pdf_path, output_path):
    """Extraheert tekst uit een PDF en slaat op als .txt bestand."""
    print(f"Verwerken: {pdf_path}")

    try:
        reader = PdfReader(pdf_path)
        total_pages = len(reader.pages)
        print(f"  Aantal pagina's: {total_pages}")

        with open(output_path, 'w', encoding='utf-8') as f:
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    f.write(f"\n\n{'='*60}\n")
                    f.write(f"PAGINA {i+1} van {total_pages}\n")
                    f.write(f"{'='*60}\n\n")
                    f.write(text)

                # Progress indicator elke 50 pagina's
                if (i + 1) % 50 == 0:
                    print(f"  Verwerkt: {i+1}/{total_pages} pagina's")

        print(f"  Opgeslagen: {output_path}")
        return True

    except Exception as e:
        print(f"  FOUT: {e}")
        return False

def main():
    # Definieer de PDF's
    pdfs = [
        ("5-Handleiding-versie-1.0-digitale-versie.pdf", "handleiding.txt"),
        ("7-Algoritme-versie-1.0-GSMversie.pdf", "algoritme.txt"),
    ]

    script_dir = os.path.dirname(os.path.abspath(__file__))

    print("PDF Tekst Extractie")
    print("=" * 40)

    for pdf_name, txt_name in pdfs:
        pdf_path = os.path.join(script_dir, pdf_name)
        txt_path = os.path.join(script_dir, txt_name)

        if os.path.exists(pdf_path):
            extract_pdf_to_text(pdf_path, txt_path)
        else:
            print(f"Niet gevonden: {pdf_name}")

    print("\nKlaar!")

if __name__ == "__main__":
    main()
