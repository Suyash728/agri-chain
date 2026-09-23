import urllib.request
import urllib.error
import json
import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from db import get_connection

def main():
    # 1. Non-SOLD batch should be rejected
    try:
        data = json.dumps({'rating': 5, 'comment': 'Fresh and crispy!', 'freshness_score': 98}).encode()
        req = urllib.request.Request('http://127.0.0.1:8000/batches/BATCH-TASK5-3/reviews', data=data, headers={'Content-Type': 'application/json'})
        urllib.request.urlopen(req)
        print('FAILED: Non-sold batch review was not rejected')
        sys.exit(1)
    except urllib.error.HTTPError as e:
        print('PASS: Non-sold batch rejected:', e.code, e.read().decode())

    # 2. Setup a SOLD batch
    conn = get_connection()
    conn.execute("INSERT OR IGNORE INTO batches (batch_id, crop_name, origin_farm, harvest_date, farmer_name) VALUES ('BATCH-SOLD-TEST', 'Organic Tomatoes', 'Nashik Cluster', '2026-09-23', 'Rahul Patil')")
    conn.execute("INSERT INTO custody_events (batch_id, from_holder, to_holder, state, price_paise) VALUES ('BATCH-SOLD-TEST', 'Pune DarkStore', 'Consumer Home', 'SOLD', 200000)")
    conn.commit()
    conn.close()

    # 3. Submit consumer review
    data = json.dumps({
        'rating': 5,
        'comment': 'Exceptional crispiness and freshness! On-chain cold chain verified.',
        'freshness_score': 98,
        'reviewer_address': '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
    }).encode()
    req = urllib.request.Request('http://127.0.0.1:8000/batches/BATCH-SOLD-TEST/reviews', data=data, headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    rev_resp = json.loads(res.read().decode())
    print('PASS: Review created:', rev_resp)

    # 4. Fetch reviews
    res2 = urllib.request.urlopen('http://127.0.0.1:8000/batches/BATCH-SOLD-TEST/reviews')
    get_resp = json.loads(res2.read().decode())
    print('PASS: Batch reviews retrieved:', get_resp)
    assert get_resp['average_rating'] == 5.0
    assert get_resp['total_reviews'] >= 1
    print('ALL REVIEW CHECKS PASSED!')

if __name__ == '__main__':
    main()
