import os
import json
import pathlib
from datetime import datetime
from dotenv import load_dotenv
from web3 import Web3

# Load env vars from .env at project root
ROOT_DIR = pathlib.Path(__file__).resolve().parents[1]
load_dotenv(dotenv_path=ROOT_DIR / ".env")

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
account = w3.eth.account.from_key(PRIVATE_KEY)
owner_address = account.address

# Load ABI
ABI_PATH = ROOT_DIR / "contracts" / "artifacts" / "contracts" / "AgriChainCore.sol" / "AgriChainCore.json"
if not ABI_PATH.exists():
    raise RuntimeError(f"ABI file not found at {ABI_PATH}")

with open(ABI_PATH, "r", encoding="utf-8") as f:
    contract_json = json.load(f)
    abi = contract_json["abi"]

contract = w3.eth.contract(address=w3.to_checksum_address(CONTRACT_ADDRESS), abi=abi)


def to_bytes32(batch_id: str | bytes) -> bytes:
    """Normalize a batch ID string or bytes into a 32-byte bytes value."""
    if isinstance(batch_id, bytes):
        if len(batch_id) == 32:
            return batch_id
        return batch_id.ljust(32, b"\0")[:32]
    if isinstance(batch_id, str):
        if batch_id.startswith("0x") and len(batch_id) == 66:
            return bytes.fromhex(batch_id[2:])
        raw = batch_id.encode("utf-8")
        if len(raw) <= 32:
            return raw.ljust(32, b"\0")
        return Web3.keccak(text=batch_id)
    raise ValueError(f"Unsupported batch_id type: {type(batch_id)}")


def _send(method_name: str, *args) -> str:
    """Builds, signs, and sends a transaction calling *method_name* with *args*.

    Returns the transaction hash as a hex string with '0x' prefix.
    """
    func = getattr(contract.functions, method_name)(*args)
    nonce = w3.eth.get_transaction_count(owner_address)
    tx_params = {
        "chainId": w3.eth.chain_id,
        "from": owner_address,
        "nonce": nonce,
        "gasPrice": w3.to_wei("20", "gwei"),
    }

    try:
        estimated_gas = func.estimate_gas({"from": owner_address})
        tx_params["gas"] = int(estimated_gas * 1.2)
    except Exception:
        tx_params["gas"] = 3_000_000

    transaction = func.build_transaction(tx_params)
    signed_tx = w3.eth.account.sign_transaction(transaction, PRIVATE_KEY)
    raw_tx = getattr(signed_tx, "raw_transaction", None) or getattr(signed_tx, "rawTransaction")
    tx_hash = w3.eth.send_raw_transaction(raw_tx)
    w3.eth.wait_for_transaction_receipt(tx_hash)
    return tx_hash.hex()


def register_batch(
    batch_id: str,
    crop_name: str,
    origin_farm: str,
    harvest_date: int | str,
    farmer_address: str | None = None,
) -> str:
    """Registers a new batch on-chain."""
    b32 = to_bytes32(batch_id)
    if isinstance(harvest_date, str):
        try:
            h_int = int(datetime.fromisoformat(harvest_date).timestamp())
        except Exception:
            try:
                h_int = int(harvest_date)
            except Exception:
                h_int = int(datetime.utcnow().timestamp())
    else:
        h_int = int(harvest_date)

    farmer = w3.to_checksum_address(farmer_address) if farmer_address else owner_address
    return _send("registerBatch", b32, crop_name, origin_farm, h_int, farmer)


def transfer_custody(
    batch_id: str,
    to_address: str,
    new_state: int | str,
    price_paise: int,
) -> str:
    """Transfers batch custody on-chain. State enum: 0:REGISTERED, 1:IN_TRANSIT, 2:IN_STORAGE, 3:AT_RETAIL, 4:SOLD."""
    b32 = to_bytes32(batch_id)
    state_map = {
        "REGISTERED": 0,
        "IN_TRANSIT": 1,
        "IN_STORAGE": 2,
        "AT_RETAIL": 3,
        "SOLD": 4,
    }
    if isinstance(new_state, str):
        if new_state.upper() in state_map:
            state_int = state_map[new_state.upper()]
        else:
            state_int = int(new_state)
    else:
        state_int = int(new_state)

    to_addr = w3.to_checksum_address(to_address)
    return _send("transferCustody", b32, to_addr, state_int, int(price_paise))


def record_condition(
    batch_id: str,
    temp_deci_c: int,
    humidity_pct: int,
    breach: bool = False,
) -> str:
    """Records a valid sensor reading on-chain. temp_deci_c is tenths of degree C (e.g. 50 = 5.0 C)."""
    b32 = to_bytes32(batch_id)
    return _send("recordCondition", b32, int(temp_deci_c), int(humidity_pct), bool(breach))


def get_batch(batch_id: str) -> dict:
    """Queries batch state directly from AgriChainCore.batches mapping."""
    b32 = to_bytes32(batch_id)
    result = contract.functions.batches(b32).call()
    return {
        "cropName": result[0],
        "originFarm": result[1],
        "harvestDate": result[2],
        "currentHolder": result[3],
        "state": result[4],
        "exists": result[5],
    }


def get_custody_events(batch_id: str, from_block: int = 0) -> list:
    """Return all CustodyTransferred event logs for batch_id."""
    b32 = to_bytes32(batch_id)
    events = contract.events.CustodyTransferred().get_logs(
        from_block=from_block,
        argument_filters={"batchId": b32},
    )
    return [e["args"] for e in events]


def get_condition_records(batch_id: str, from_block: int = 0) -> list:
    """Return all ConditionRecorded event logs for batch_id."""
    b32 = to_bytes32(batch_id)
    events = contract.events.ConditionRecorded().get_logs(
        from_block=from_block,
        argument_filters={"batchId": b32},
    )
    return [e["args"] for e in events]
