import fitz  # pymupdf

doc = fitz.open('finalout.pdf')
print("Total pages in finalout.pdf:", len(doc))

with open('finalout_pdf_summary.txt', 'w', encoding='utf-8') as out:
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        images = page.get_images()
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        header = f"=== Page {page_num+1} (Images: {len(images)}) ==="
        out.write(header + "\n")
        # Find any Figure or Table captions
        captions = [l for l in lines if l.lower().startswith('figure') or l.lower().startswith('table')]
        if captions:
            out.write("  CAPTIONS: " + " | ".join(captions) + "\n")
        # Sample text lines
        out.write("  FIRST 3 LINES: " + " /// ".join(lines[:3]) + "\n")
        out.write("  LAST 2 LINES: " + " /// ".join(lines[-2:]) + "\n\n")

print("Saved summary to finalout_pdf_summary.txt")
