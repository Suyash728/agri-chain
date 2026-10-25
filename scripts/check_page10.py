import fitz

doc = fitz.open('finalout.pdf')
page10 = doc[9]
print(page10.get_text())
