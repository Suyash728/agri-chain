import os
import json
import pathlib
from dotenv import load_dotenv
from web3 import Web3
from web3.exceptions import TransactionNotFound
import sqlite3

# Load env vars from .env at project root
load_dotenv(dotenv_path=pathlib.Path(__file__).resolve().parents[1] / ".env")

RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
if not CONTRACT_ADDRESS or not PRIVATE_KEY:
    raise RuntimeError("CONTRACT_ADDRESS and PRIVATE_KEY must be set in .env")

# Web3 setup
w3 = Web3(Web3.HTTPProvider(RPC_URL))
if not w3.is_connected():
    raise RuntimeError(f"Unable to connect to RPC at {RPC_URL}")

# Owner account derived from the private key
owner_address = w3.eth.account.from_key(PRIVATE_KEY).address

# Load ABI
ABI_PATH = pathlib.Path(__file__).resolve().parents[1] / "contracts" / "artifacts" / "contracts" / "AgriChainCore.sol" / "AgriChainCore.json"
with open(ABI_PATH, "r", encoding="utf-8") as f:
    contract_json = json.load(f)
    abi = contract_json["abi"]

contract = w3.eth.contract(address=w3.to_checksum_address(CONTRACT_ADDRESS), abi=abi)

# Helper to send a transaction to the contract

def _send(method_name, *args):
    """Builds and signs a transaction calling *method_name* with *args*.
    Returns the tx hash as a hex string.
    """
    transaction = contract.functions[method_name](*args).buildTransaction(
        {
            "chainId": w3.eth.chain_id,
            "gas": 5_000_000,
            "gasPrice": w3.toWei("20", "gwei"),
            "nonce": w3.eth.get_transaction_count(owner_address),
        }
    )
    signed_tx = w3.eth.account.sign_transaction(transaction, PRIVATE_KEY)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    return tx_hash.hex()

# Public API functions

def register_batch(batch_id, crop_name, origin_farm, harvest_date, farmer):
    """Registers a new batch on‑chain.
    Parameters are expected in the same order as the Solidity function.
    """
    return _send("registerBatch", batch_id, crop_name, origin_farm, harvest_date, farmer)


def transfer_custody(batch_id, to, new_state, price_paise):
    """Transfers the batch to a new holder.
    ``new_state`` must be the enum integer (0‑4).
    """
    return _send("transferCustody", batch_id, to, new_state, price_paise)


def record_condition(batch_id, temp_deci_c, humidity_pct, breach):
    """Records a sensor reading on‑chain.
    *temp_deci_c* is **tenths of a degree** (e.g. 45 for 4.5 °C).
    """
    return _send("recordCondition", batch_id, temp_deci_c, humidity_pct, breach)

# Optional helper – fetch past events for a batch (used by the traceability endpoint)

def get_custody_events(batch_id, from_block=0):
    """Return all CustodyTransferred events for *batch_id* up to the latest block."""
    event_filter = contract.events.CustodyTransferred.createFilter(
        fromBlock=from_block, argument_filters={"batchId": batch_id}
    )
    return event_filter.get_all_entries()


def get_condition_records(batch_id, from_block=0):
    """Return all ConditionRecorded events for *batch_id*."""
    event_filter = contract.events.ConditionRecorded.createFilter(
        fromBlock=from_block, argument_filters={"batchId": batch_id}
    )
    return event_filter.get_all_entries()

# End of chain.py
