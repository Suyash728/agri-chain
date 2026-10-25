import fitz

doc = fitz.open('finalout.pdf')
page9 = doc[8]
print(page9.get_text())
