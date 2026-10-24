#!/usr/bin/env python3
"""
backend/scripts/seed_demo_batch.py
----------------------------------
Utility script to feed the optimal multi-role demonstration dataset across
blockchain and database whenever wanted.
"""

import os
import sys
import pathlib

# Ensure backend root is on sys.path
BACKEND_DIR = pathlib.Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from seeder import seed_optimal_demo_dataset


def main():
    print("==========================================================================")
    print("      AGRICHAIN: FEEDING OPTIMAL MULTI-ROLE DEMONSTRATION DATASET         ")
    print("==========================================================================")
    result = seed_optimal_demo_dataset(reset_first=True)
    print(f"\n[+] Status: {result['status'].upper()}")
    print(f"[+] Message: {result['message']}")
    print(f"[+] Counts: {result['counts']}")
    print("\n[+] Seeded Multi-Role Batches:")
    for b in result["seeded_batches"]:
        print(f"    • {b['batch_id']}: {b['crop']} -> State: {b['state']}")
    print("\nAll 5 personas (Farmer, Logistics, Dark Store, Consumer, Admin) initialized!")


if __name__ == "__main__":
    main()
