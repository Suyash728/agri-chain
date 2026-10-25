with open("report_full_dump.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()
print(f"Total lines in report_full_dump.txt: {len(lines)}")
for i in range(0, min(100, len(lines)), 10):
    print(f"Line {i}: {lines[i][:80]}")
