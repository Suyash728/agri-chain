with open("report_full_dump.txt", "r", encoding="utf-8") as f:
    text = f.read()

import re
chapters = re.split(r'\[\d+\] \(normal\) Chapter ', text)

def save_block(idx, name):
    with open(f"scripts/block_{idx}_{name}.txt", "w", encoding="utf-8") as out:
        out.write(chapters[idx])
    print(f"Saved block {idx} ({name}): {len(chapters[idx])} chars")

save_block(1, "ch1")
save_block(2, "ch2")
save_block(3, "ch3")
save_block(4, "ch4")
save_block(5, "ch5")
save_block(6, "ch6_app_ref")
