"""
Extraheert alle afbeeldingen uit de PDF's met pagina-context.
Maakt ook een mapping van pagina naar vraagnummer.
"""

import fitz  # PyMuPDF
import os
import json
import re


def extract_all_images(pdf_path, output_dir, min_size=3000):
    """Extraheer alle afbeeldingen uit PDF met metadata."""
    doc = fitz.open(pdf_path)
    os.makedirs(output_dir, exist_ok=True)

    metadata = []
    count = 0
    skipped = 0

    for page_num in range(len(doc)):
        page = doc[page_num]
        images = page.get_images()

        # Haal ook tekst op voor context
        text = page.get_text()

        # Zoek vraagnummer in tekst
        q_match = re.search(r'\.\.(\d+[a-z]?)', text)
        question_id = q_match.group(1) if q_match else None

        for img_index, img in enumerate(images):
            xref = img[0]
            try:
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                width = base_image.get("width", 0)
                height = base_image.get("height", 0)

                # Skip kleine afbeeldingen (icons, buttons)
                if len(image_bytes) < min_size:
                    skipped += 1
                    continue

                filename = f"p{page_num+1:03d}_img{img_index+1}.{image_ext}"
                filepath = os.path.join(output_dir, filename)

                with open(filepath, "wb") as f:
                    f.write(image_bytes)

                metadata.append({
                    "file": filename,
                    "page": page_num + 1,
                    "question": question_id,
                    "size_kb": len(image_bytes) // 1024,
                    "width": width,
                    "height": height
                })
                count += 1

            except Exception as e:
                print(f"  Fout bij pagina {page_num+1}, img {img_index+1}: {e}")

        # Progress elke 50 pagina's
        if (page_num + 1) % 50 == 0:
            print(f"  Verwerkt: {page_num+1}/{len(doc)} pagina's, {count} afbeeldingen")

    doc.close()

    # Schrijf metadata
    meta_file = os.path.join(output_dir, "_metadata.json")
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print(f"  Totaal: {count} afbeeldingen, {skipped} overgeslagen (te klein)")
    return metadata


def create_page_question_mapping(txt_path):
    """Maak mapping van pagina naar vraagnummer."""
    mapping = {}

    with open(txt_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Split op pagina markers
    pages = re.split(r'={60}\nPAGINA (\d+) van \d+\n={60}', content)

    for i in range(1, len(pages), 2):
        page_num = int(pages[i])
        page_content = pages[i + 1] if i + 1 < len(pages) else ""

        # Zoek vraagnummer
        q_match = re.search(r'\.\.(\d+[a-z]?)', page_content)
        if q_match:
            mapping[page_num] = q_match.group(1)

    return mapping


def main():
    print("=" * 60)
    print("AFBEELDINGEN EXTRACTIE - HYBRIDE AANPAK")
    print("=" * 60)

    # Algoritme PDF
    print("\n[1/2] Algoritme PDF...")
    alg_images = extract_all_images(
        "7-Algoritme-versie-1.0-GSMversie.pdf",
        "images_algoritme",
        min_size=3000
    )

    # Handleiding PDF
    print("\n[2/2] Handleiding PDF...")
    hand_images = extract_all_images(
        "5-Handleiding-versie-1.0-digitale-versie.pdf",
        "images_handleiding",
        min_size=3000
    )

    # Maak pagina-vraag mapping
    print("\n[3/3] Pagina-vraag mapping...")
    alg_mapping = create_page_question_mapping("algoritme.txt")
    with open("pagina_vraag_mapping.json", "w", encoding="utf-8") as f:
        json.dump(alg_mapping, f, ensure_ascii=False, indent=2)
    print(f"  Mapping: {len(alg_mapping)} pagina's gekoppeld aan vragen")

    # Samenvatting
    print("\n" + "=" * 60)
    print("SAMENVATTING")
    print("=" * 60)
    print(f"Algoritme afbeeldingen:  {len(alg_images)}")
    print(f"Handleiding afbeeldingen: {len(hand_images)}")
    print(f"Totaal afbeeldingen:     {len(alg_images) + len(hand_images)}")

    # Bereken totale grootte
    alg_size = sum(img["size_kb"] for img in alg_images)
    hand_size = sum(img["size_kb"] for img in hand_images)
    print(f"Totale grootte:          {(alg_size + hand_size) / 1024:.1f} MB")


if __name__ == "__main__":
    main()
