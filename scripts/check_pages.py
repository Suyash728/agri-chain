import fitz

doc = fitz.open('finalout.pdf')
for pno in range(15, 25):
    page = doc[pno]
    text = page.get_text()
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    caps = [l for l in lines if 'figure' in l.lower() or 'table' in l.lower() or 'chapter' in l.lower() or '4.' in l or '3.' in l]
    print(f"=== Page {pno+1} ===")
    for c in caps:
        print("  ", c)
