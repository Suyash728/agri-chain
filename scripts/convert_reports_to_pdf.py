# scripts/convert_reports_to_pdf.py
import os
import sys
import time

docx_path = os.path.abspath("BE_GRP_08_FINAL_REPORT_2026.docx")
pdf_path = os.path.abspath("BE_GRP_08_FINAL_REPORT_2026.docx.pdf")

docx_path2 = os.path.abspath("Final_BE_Report_AgriChain.docx")
pdf_path2 = os.path.abspath("Final_BE_Report_AgriChain.pdf")

print(f"Converting {docx_path} -> {pdf_path}...")
start = time.time()
from docx2pdf import convert
convert(docx_path, pdf_path)
print(f"[OK] Converted in {time.time() - start:.2f}s. Size: {os.path.getsize(pdf_path)} bytes.")

print(f"Converting {docx_path2} -> {pdf_path2}...")
start2 = time.time()
convert(docx_path2, pdf_path2)
print(f"[OK] Converted in {time.time() - start2:.2f}s. Size: {os.path.getsize(pdf_path2)} bytes.")
