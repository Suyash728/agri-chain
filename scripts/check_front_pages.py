import fitz

doc = fitz.open('finalout.pdf')
for p in range(6):
    print(f"=== PAGE {p+1} ===")
    print(doc[p].get_text())
