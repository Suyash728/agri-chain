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

if not PRIVATE_KEY:
    raise RuntimeError("PRIVATE_KEY must be set in .env")

# Web3 setup
w3 = Web3(Web3.HTTPProvider(RPC_URL))
if not w3.is_connected():
    print(f"[chain] Warning: Unable to connect to RPC at {RPC_URL}. Local Hardhat node may be offline.")

# Owner account derived from the private key
account = w3.eth.account.from_key(PRIVATE_KEY)
owner_address = account.address


def load_abi(contract_name: str) -> list | None:
    """Loads ABI from backend/modular-abis, contracts/artifacts, or returns None."""
    mod_path = ROOT_DIR / "backend" / "modular-abis" / f"{contract_name}.json"
    if mod_path.exists():
        with open(mod_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else data.get("abi", data)

    art_path = ROOT_DIR / "contracts" / "artifacts" / "contracts" / f"{contract_name}.sol" / f"{contract_name}.json"
    if art_path.exists():
        with open(art_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("abi", data)

    return None


# Load Modular Contract Deployments
MODULAR_DEPLOYMENTS_PATH = ROOT_DIR / "backend" / "modular-deployments.json"
AMOY_DEPLOYMENTS_PATH = ROOT_DIR / "contracts" / "amoy-deployments.json"

modular_deployments = {}
if MODULAR_DEPLOYMENTS_PATH.exists():
    try:
        with open(MODULAR_DEPLOYMENTS_PATH, "r", encoding="utf-8") as f:
            modular_deployments = json.load(f)
    except Exception as e:
        print(f"[chain] Warning reading {MODULAR_DEPLOYMENTS_PATH}: {e}")
elif AMOY_DEPLOYMENTS_PATH.exists():
    try:
        with open(AMOY_DEPLOYMENTS_PATH, "r", encoding="utf-8") as f:
            modular_deployments = json.load(f)
    except Exception as e:
        print(f"[chain] Warning reading {AMOY_DEPLOYMENTS_PATH}: {e}")

deployed_contracts = modular_deployments.get("contracts", {})

product_registry_addr = os.getenv("PRODUCT_REGISTRY_ADDRESS") or deployed_contracts.get("ProductRegistry")
custody_transfer_addr = os.getenv("CUSTODY_TRANSFER_ADDRESS") or deployed_contracts.get("CustodyTransfer")
cold_chain_monitor_addr = os.getenv("COLD_CHAIN_MONITOR_ADDRESS") or deployed_contracts.get("ColdChainMonitor")
policy_config_addr = os.getenv("POLICY_CONFIG_ADDRESS") or deployed_contracts.get("PolicyConfig")

product_registry_contract = None
custody_transfer_contract = None
cold_chain_monitor_contract = None
policy_config_contract = None

if product_registry_addr:
    abi = load_abi("ProductRegistry")
    if abi:
        product_registry_contract = w3.eth.contract(address=w3.to_checksum_address(product_registry_addr), abi=abi)

if custody_transfer_addr:
    abi = load_abi("CustodyTransfer")
    if abi:
        custody_transfer_contract = w3.eth.contract(address=w3.to_checksum_address(custody_transfer_addr), abi=abi)

if cold_chain_monitor_addr:
    abi = load_abi("ColdChainMonitor")
    if abi:
        cold_chain_monitor_contract = w3.eth.contract(address=w3.to_checksum_address(cold_chain_monitor_addr), abi=abi)

if policy_config_addr:
    abi = load_abi("PolicyConfig")
    if abi:
        policy_config_contract = w3.eth.contract(address=w3.to_checksum_address(policy_config_addr), abi=abi)

# Legacy Monolithic Contract Fallback
legacy_contract = None
if CONTRACT_ADDRESS:
    legacy_abi = load_abi("AgriChainCore")
    if legacy_abi:
        try:
            legacy_contract = w3.eth.contract(address=w3.to_checksum_address(CONTRACT_ADDRESS), abi=legacy_abi)
        except Exception as e:
            print(f"[chain] Legacy contract load warning: {e}")

# Backward-compatibility alias
contract = product_registry_contract or legacy_contract


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


def _send_tx(target_contract, method_name: str, *args) -> str:
    """Builds, signs, and sends a transaction calling *method_name* on *target_contract*.

    Returns the transaction hash as a hex string with '0x' prefix.
    """
    func = getattr(target_contract.functions, method_name)(*args)
    nonce = w3.eth.get_transaction_count(owner_address)
    tx_params = {
        "chainId": w3.eth.chain_id,
        "from": owner_address,
        "nonce": nonce,
        "gasPrice": w3.to_wei("20", "gwei"),
    }

    try:
        estimated_gas = func.estimate_gas({"from": owner_address})
        tx_params["gas"] = int(estimated_gas * 1.25)
    except Exception:
        tx_params["gas"] = 3_000_000

    transaction = func.build_transaction(tx_params)
    signed_tx = w3.eth.account.sign_transaction(transaction, PRIVATE_KEY)
    raw_tx = getattr(signed_tx, "raw_transaction", None) or getattr(signed_tx, "rawTransaction")
    tx_hash = w3.eth.send_raw_transaction(raw_tx)
    w3.eth.wait_for_transaction_receipt(tx_hash)
    return tx_hash.hex()


def _send(method_name: str, *args) -> str:
    """Backwards-compatible _send routing to primary contract or legacy contract."""
    target = contract or legacy_contract
    if not target:
        raise RuntimeError("No contract configured for _send")
    return _send_tx(target, method_name, *args)


def register_batch(
    batch_id: str,
    crop_name: str,
    origin_farm: str,
    harvest_date: int | str,
    farmer_address: str | None = None,
) -> str:
    """Registers a new batch on-chain (using ProductRegistry and CustodyTransfer, or legacy fallback)."""
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

    if product_registry_contract:
        tx_hash = _send_tx(product_registry_contract, "registerBatch", b32, crop_name, origin_farm, h_int, farmer)
        if custody_transfer_contract:
            try:
                c_rec = custody_transfer_contract.functions.getCustody(b32).call()
                if not c_rec[3]:
                    _send_tx(custody_transfer_contract, "initializeCustody", b32, farmer)
            except Exception as e:
                print(f"[chain] initializeCustody warning: {e}")
        return tx_hash
    elif legacy_contract:
        return _send_tx(legacy_contract, "registerBatch", b32, crop_name, origin_farm, h_int, farmer)
    else:
        raise RuntimeError("No contract available to register_batch")


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

    if custody_transfer_contract:
        try:
            c_rec = custody_transfer_contract.functions.getCustody(b32).call()
            if not c_rec[3]:
                _send_tx(custody_transfer_contract, "initializeCustody", b32, owner_address)
        except Exception:
            pass
        return _send_tx(custody_transfer_contract, "transferCustody", b32, to_addr, state_int, int(price_paise))
    elif legacy_contract:
        return _send_tx(legacy_contract, "transferCustody", b32, to_addr, state_int, int(price_paise))
    else:
        raise RuntimeError("No contract available to transfer_custody")


def record_condition(
    batch_id: str,
    temp_deci_c: int,
    humidity_pct: int,
    breach: bool = False,
) -> str:
    """Records a valid sensor reading on-chain. temp_deci_c is tenths of degree C (e.g. 50 = 5.0 C)."""
    b32 = to_bytes32(batch_id)
    if cold_chain_monitor_contract:
        return _send_tx(cold_chain_monitor_contract, "recordCondition", b32, int(temp_deci_c), int(humidity_pct), bool(breach))
    elif legacy_contract:
        return _send_tx(legacy_contract, "recordCondition", b32, int(temp_deci_c), int(humidity_pct), bool(breach))
    else:
        raise RuntimeError("No contract available to record_condition")


def record_conditions_batch(
    batch_ids: list,
    temps_deci_c: list,
    hums_pct: list,
    breaches: list,
) -> str:
    """Batches multiple condition readings into a single on-chain transaction for gas efficiency."""
    if cold_chain_monitor_contract:
        b32_list = [to_bytes32(b) for b in batch_ids]
        t_list = [int(t) for t in temps_deci_c]
        h_list = [int(h) for h in hums_pct]
        br_list = [bool(br) for br in breaches]
        return _send_tx(cold_chain_monitor_contract, "recordConditionsBatch", b32_list, t_list, h_list, br_list)
    else:
        last_tx = None
        for b, t, h, br in zip(batch_ids, temps_deci_c, hums_pct, breaches):
            last_tx = record_condition(b, t, h, br)
        return last_tx


def get_batch(batch_id: str) -> dict:
    """Queries batch state from ProductRegistry + CustodyTransfer, falling back to AgriChainCore."""
    b32 = to_bytes32(batch_id)

    if product_registry_contract:
        try:
            result = product_registry_contract.functions.getBatch(b32).call()
            if result[4]:  # exists
                current_holder = result[3]
                state = 0
                if custody_transfer_contract:
                    try:
                        ct = custody_transfer_contract.functions.getCustody(b32).call()
                        if ct[3]:
                            current_holder = ct[0]
                            state = ct[1]
                    except Exception:
                        pass
                return {
                    "cropName": result[0],
                    "originFarm": result[1],
                    "harvestDate": result[2],
                    "currentHolder": current_holder,
                    "state": state,
                    "exists": result[4],
                }
        except Exception as e:
            print(f"[chain] getBatch modular query warning: {e}")

    if legacy_contract:
        result = legacy_contract.functions.batches(b32).call()
        return {
            "cropName": result[0],
            "originFarm": result[1],
            "harvestDate": result[2],
            "currentHolder": result[3],
            "state": result[4],
            "exists": result[5],
        }

    raise RuntimeError(f"Batch {batch_id} not found on-chain")


def get_custody_events(batch_id: str, from_block: int = 0) -> list:
    """Return all CustodyTransferred event logs for batch_id from CustodyTransfer (or AgriChainCore)."""
    b32 = to_bytes32(batch_id)
    events = []

    if custody_transfer_contract:
        try:
            logs = custody_transfer_contract.events.CustodyTransferred().get_logs(
                from_block=from_block,
                argument_filters={"batchId": b32},
            )
            events.extend([e["args"] for e in logs])
        except Exception as e:
            print(f"[chain] CustodyTransferred modular event error: {e}")

    if not events and legacy_contract:
        try:
            logs = legacy_contract.events.CustodyTransferred().get_logs(
                from_block=from_block,
                argument_filters={"batchId": b32},
            )
            events.extend([e["args"] for e in logs])
        except Exception as e:
            print(f"[chain] CustodyTransferred legacy event error: {e}")

    return events


def get_condition_records(batch_id: str, from_block: int = 0) -> list:
    """Return all condition records for batch_id from ColdChainMonitor (or AgriChainCore)."""
    b32 = to_bytes32(batch_id)
    records = []

    if cold_chain_monitor_contract:
        try:
            stored = cold_chain_monitor_contract.functions.getConditionRecords(b32).call()
            for r in stored:
                records.append({
                    "batchId": b32,
                    "tempDeciC": r[0],
                    "humidityPct": r[1],
                    "breach": r[2],
                    "timestamp": r[3],
                })
            if records:
                return records
        except Exception as e:
            print(f"[chain] getConditionRecords storage query note: {e}")

        try:
            logs = cold_chain_monitor_contract.events.ConditionRecorded().get_logs(
                from_block=from_block,
                argument_filters={"batchId": b32},
            )
            records.extend([e["args"] for e in logs])
            if records:
                return records
        except Exception as e:
            print(f"[chain] ConditionRecorded modular event error: {e}")

    if not records and legacy_contract:
        try:
            logs = legacy_contract.events.ConditionRecorded().get_logs(
                from_block=from_block,
                argument_filters={"batchId": b32},
            )
            records.extend([e["args"] for e in logs])
        except Exception as e:
            print(f"[chain] ConditionRecorded legacy event error: {e}")

    return records


def set_batch_document(batch_id: str, doc_type: str, ipfs_cid: str) -> str:
    """Anchors an IPFS document CID on-chain in ProductRegistry."""
    b32 = to_bytes32(batch_id)
    if product_registry_contract:
        return _send_tx(product_registry_contract, "setBatchDocument", b32, doc_type, ipfs_cid)
    raise RuntimeError("ProductRegistry contract not configured for set_batch_document")


def get_batch_documents_onchain(batch_id: str) -> list:
    """Queries on-chain document records from ProductRegistry."""
    b32 = to_bytes32(batch_id)
    if product_registry_contract:
        try:
            records = product_registry_contract.functions.getBatchDocuments(b32).call()
            return [
                {"docType": r[0], "ipfsCid": r[1], "timestamp": r[2]}
                for r in records
            ]
        except Exception as e:
            print(f"[chain] getBatchDocuments warning: {e}")
            return []
    return []


ROLE_IDENTIFIERS = {
    "DEFAULT_ADMIN_ROLE": b"\x00" * 32,
    "FARMER_ROLE": Web3.keccak(text="FARMER_ROLE"),
    "LOGISTICS_ROLE": Web3.keccak(text="LOGISTICS_ROLE"),
    "RETAILER_ROLE": Web3.keccak(text="RETAILER_ROLE"),
    "ORACLE_ROLE": Web3.keccak(text="ORACLE_ROLE"),
}


def grant_role(role_name: str, account_address: str) -> dict:
    """Grants a role to an Ethereum address on relevant modular contracts."""
    role_key = role_name.upper()
    if not role_key.endswith("_ROLE") and role_key != "DEFAULT_ADMIN_ROLE":
        role_key = f"{role_key}_ROLE"

    role_bytes = ROLE_IDENTIFIERS.get(role_key)
    if not role_bytes:
        raise ValueError(f"Unknown role: {role_name}")

    addr = w3.to_checksum_address(account_address)
    tx_hashes = {}

    target_contracts = []
    if role_key in ("DEFAULT_ADMIN_ROLE", "FARMER_ROLE"):
        if product_registry_contract:
            target_contracts.append(("ProductRegistry", product_registry_contract))
        if custody_transfer_contract:
            target_contracts.append(("CustodyTransfer", custody_transfer_contract))
    elif role_key == "LOGISTICS_ROLE":
        if custody_transfer_contract:
            target_contracts.append(("CustodyTransfer", custody_transfer_contract))
    elif role_key == "RETAILER_ROLE":
        if custody_transfer_contract:
            target_contracts.append(("CustodyTransfer", custody_transfer_contract))
    elif role_key == "ORACLE_ROLE":
        if cold_chain_monitor_contract:
            target_contracts.append(("ColdChainMonitor", cold_chain_monitor_contract))

    for name, c in target_contracts:
        tx_hash = _send_tx(c, "grantRole", role_bytes, addr)
        tx_hashes[name] = tx_hash

    return {
        "role": role_key,
        "address": addr,
        "transactions": tx_hashes,
        "success": True,
    }


def check_role(role_name: str, account_address: str) -> dict:
    """Checks whether an address possesses a given role across modular contracts."""
    role_key = role_name.upper()
    if not role_key.endswith("_ROLE") and role_key != "DEFAULT_ADMIN_ROLE":
        role_key = f"{role_key}_ROLE"

    role_bytes = ROLE_IDENTIFIERS.get(role_key)
    if not role_bytes:
        raise ValueError(f"Unknown role: {role_name}")

    addr = w3.to_checksum_address(account_address)
    results = {}
    if product_registry_contract:
        try:
            results["ProductRegistry"] = product_registry_contract.functions.hasRole(role_bytes, addr).call()
        except Exception:
            pass
    if custody_transfer_contract:
        try:
            results["CustodyTransfer"] = custody_transfer_contract.functions.hasRole(role_bytes, addr).call()
        except Exception:
            pass
    if cold_chain_monitor_contract:
        try:
            results["ColdChainMonitor"] = cold_chain_monitor_contract.functions.hasRole(role_bytes, addr).call()
        except Exception:
            pass

    return {
        "role": role_key,
        "address": addr,
        "has_role": any(results.values()) if results else False,
        "contract_details": results,
    }

