import docx

def inspect(filename):
    print("=" * 40)
    print("Inspecting:", filename)
    doc = docx.Document(filename)
    for i, p in enumerate(doc.paragraphs):
        print(f"P{i}: '{p.text}' | align: {p.alignment} | runs: {[r.text for r in p.runs]}")
    for ti, t in enumerate(doc.tables):
        print(f"Table {ti}: {len(t.rows)} rows, {len(t.columns)} cols")
        for ri, r in enumerate(t.rows):
            print(f"  R{ri}: {[c.text.strip() for c in r.cells]}")

inspect("1. Cover Page.docx")
inspect("2. Title Page.docx")
inspect("3. Abstract, Acknowledgement, Project Profile.docx")
inspect("4. Index.docx")
