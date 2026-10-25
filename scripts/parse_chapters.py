with open("report_full_dump.txt", "r", encoding="utf-8") as f:
    text = f.read()

import re
chapters = re.split(r'\[\d+\] \(normal\) Chapter ', text)
print(f"Found {len(chapters)} chapter blocks")
for idx, ch in enumerate(chapters):
    first_line = ch.strip().split('\n')[0] if ch.strip() else 'EMPTY'
    print(f"Block {idx}: first line = '{first_line[:60]}', length = {len(ch)}")
