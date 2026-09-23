import os
import hashlib
import pathlib
import json
import urllib.request
from typing import Dict, Any, Optional
from dotenv import load_dotenv

ROOT_DIR = pathlib.Path(__file__).resolve().parents[1]
load_dotenv(dotenv_path=ROOT_DIR / ".env")

IPFS_STORAGE_DIR = pathlib.Path(__file__).resolve().parent / "ipfs_storage"
IPFS_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"


def base58_encode(b: bytes) -> str:
    """Encodes bytes into a Base58 string (Bitcoin / IPFS multihash alphabet)."""
    n = int.from_bytes(b, "big")
    chars = []
    while n > 0:
        n, r = divmod(n, 58)
        chars.append(BASE58_ALPHABET[r])
    for byte in b:
        if byte == 0:
            chars.append(BASE58_ALPHABET[0])
        else:
            break
    return "".join(reversed(chars))


def compute_ipfs_cid(content: bytes) -> str:
    """Computes a deterministic IPFS CIDv0 (Qm... 46-char Base58 SHA-256 multihash)."""
    digest = hashlib.sha256(content).digest()
    multihash = b"\x12\x20" + digest  # 0x12 = sha256 function code, 0x20 = 32-byte length
    return base58_encode(multihash)


def pin_file_to_pinata(file_bytes: bytes, filename: str) -> Optional[str]:
    """Uploads file to Pinata IPFS cloud if credentials exist."""
    pinata_jwt = os.getenv("PINATA_JWT")
    pinata_api_key = os.getenv("PINATA_API_KEY")
    pinata_secret_key = os.getenv("PINATA_SECRET_API_KEY")

    if not pinata_jwt and not (pinata_api_key and pinata_secret_key):
        return None

    try:
        import requests
        url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
        headers = {}
        if pinata_jwt:
            headers["Authorization"] = f"Bearer {pinata_jwt}"
        else:
            headers["pinata_api_key"] = pinata_api_key
            headers["pinata_secret_api_key"] = pinata_secret_key

        files = {"file": (filename, file_bytes)}
        resp = requests.post(url, files=files, headers=headers, timeout=10.0)
        if resp.status_code == 200:
            data = resp.json()
            return data.get("IpfsHash")
    except Exception as e:
        print(f"[ipfs] Pinata pinning warning (falling back to local multihash CID): {e}")

    return None


def pin_document(file_bytes: bytes, filename: str, doc_type: str = "CERTIFICATE") -> Dict[str, Any]:
    """Pins document content to IPFS (via Pinata if configured, else local multihash store).

    Returns metadata dictionary with CID, ipfs_uri, gateway_url, and file details.
    """
    # 1. Try Pinata IPFS pinning
    cid = pin_file_to_pinata(file_bytes, filename)

    # 2. Fall back to standard cryptographic CIDv0 generation
    if not cid:
        cid = compute_ipfs_cid(file_bytes)

    # 3. Cache locally in ipfs_storage for reliable offline access & local gateway serving
    local_file = IPFS_STORAGE_DIR / cid
    if not local_file.exists():
        with open(local_file, "wb") as f:
            f.write(file_bytes)

    # Save metadata
    meta_file = IPFS_STORAGE_DIR / f"{cid}.json"
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump({
            "cid": cid,
            "filename": filename,
            "doc_type": doc_type,
            "size_bytes": len(file_bytes),
        }, f, indent=2)

    ipfs_uri = f"ipfs://{cid}"
    gateway_url = f"https://gateway.pinata.cloud/ipfs/{cid}"
    local_gateway_url = f"http://localhost:8000/ipfs/{cid}"

    return {
        "cid": cid,
        "ipfs_uri": ipfs_uri,
        "gateway_url": gateway_url,
        "local_gateway_url": local_gateway_url,
        "file_name": filename,
        "doc_type": doc_type,
        "size_bytes": len(file_bytes),
    }


def get_pinned_content(cid: str) -> Optional[bytes]:
    """Retrieve locally pinned content for a given CID if available."""
    local_file = IPFS_STORAGE_DIR / cid
    if local_file.exists():
        with open(local_file, "rb") as f:
            return f.read()
    return None
