"""
Parser voor het Steentijd Determinatie Algoritme.
Extraheert de beslisboom uit algoritme.txt naar een JSON structuur.
"""

import re
import json

def parse_algoritme(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split op pagina's
    pages = re.split(r'={60}\nPAGINA \d+ van \d+\n={60}', content)

    questions = {}
    results = set()

    for page in pages:
        # Zoek vraagnummer (..1, ..2, ..12a, etc.)
        q_match = re.search(r'\.\.(\d+[a-z]?)\s*\n', page)
        if not q_match:
            continue

        q_id = q_match.group(1)

        # Zoek de vraag (tekst met vraagteken)
        vraag_match = re.search(r'\n([^\n]+\?)\s*\n', page)
        vraag = vraag_match.group(1).strip() if vraag_match else ""

        # Zoek Ja-antwoord en resultaat/link
        ja_matches = re.findall(r'Ja\s+([^\n]+)', page)
        nee_matches = re.findall(r'Nee\s+([^\n]+)', page)

        # Verwerk Ja-antwoorden
        ja_resultaat = None
        ja_link = None
        for ja in ja_matches:
            ja = ja.strip()
            # Check of het een eindresultaat is (bijv. "een splinter", "kern-levallois")
            if ja and not ja.startswith('..'):
                # Clean up result
                result = re.sub(r'\s+', '-', ja.lower())
                result = re.sub(r'[^\w\-]', '', result)
                if result and len(result) > 2:
                    ja_resultaat = result
                    results.add(result)

        # Verwerk Nee-antwoorden
        nee_resultaat = None
        for nee in nee_matches:
            nee = nee.strip()
            if nee and not nee.startswith('..'):
                result = re.sub(r'\s+', '-', nee.lower())
                result = re.sub(r'[^\w\-]', '', result)
                if result and len(result) > 2:
                    nee_resultaat = result
                    results.add(result)

        if vraag or ja_resultaat or nee_resultaat:
            questions[q_id] = {
                "vraag": vraag,
                "ja": ja_resultaat,
                "nee": nee_resultaat
            }

    return questions, sorted(results)


def main():
    print("Parsing algoritme.txt...")
    questions, results = parse_algoritme("algoritme.txt")

    print(f"Gevonden: {len(questions)} vragen")
    print(f"Gevonden: {len(results)} unieke resultaten")

    # Schrijf vragen naar JSON
    with open("beslisboom.json", 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    print("Opgeslagen: beslisboom.json")

    # Schrijf resultaten naar JSON
    with open("artefact_types.json", 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("Opgeslagen: artefact_types.json")

    # Print eerste 10 vragen als voorbeeld
    print("\nVoorbeeld vragen:")
    for i, (q_id, data) in enumerate(list(questions.items())[:10]):
        print(f"  ..{q_id}: {data['vraag'][:60]}...")
        if data['ja']:
            print(f"       Ja → {data['ja']}")
        if data['nee']:
            print(f"       Nee → {data['nee']}")


if __name__ == "__main__":
    main()
