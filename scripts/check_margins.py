import fitz

doc = fitz.open('finalout.pdf')
page = doc[12]  # Chapter 1 page
print("Page rect:", page.rect)
blocks = page.get_text("blocks")
min_x = min(b[0] for b in blocks if len(b[4].strip()) > 10)
max_x = max(b[2] for b in blocks if len(b[4].strip()) > 10)
min_y = min(b[1] for b in blocks if len(b[4].strip()) > 10)
max_y = max(b[3] for b in blocks if len(b[4].strip()) > 10)
print(f"Text area: x in [{min_x:.1f}, {max_x:.1f}] (width={max_x-min_x:.1f}), y in [{min_y:.1f}, {max_y:.1f}]")
print(f"Left margin: {min_x/72:.2f} in, Right margin: {(page.rect.width - max_x)/72:.2f} in")
print(f"Top margin: {min_y/72:.2f} in, Bottom margin: {(page.rect.height - max_y)/72:.2f} in")
