import sqlite3

conn = sqlite3.connect('backend/agrichain.db')
cur = conn.cursor()
cur.execute('SELECT verdict, COUNT(*) FROM readings GROUP BY verdict')
print("Verdicts in readings:", cur.fetchall())

cur.execute('SELECT COUNT(*) FROM readings')
total = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM readings WHERE verdict = 'VALID'")
valids = cur.fetchone()[0]
print("Total:", total, "Valids:", valids, "Percentage:", (valids / total * 100) if total else 0)

cur.execute('SELECT COUNT(*) FROM quarantine')
q_count = cur.fetchone()[0]
print("Quarantine count:", q_count)
