"""Deployment settings and the HTTP access policy.

Development (default) behaves exactly as before: open CORS, all routes open.
Production (APP_ENV=production) fails closed:
  * CORS only for ALLOWED_ORIGINS (comma-separated) / ALLOWED_ORIGIN_REGEX
  * POST /telemetry and /telemetry/batch require header X-Device-Key == DEVICE_API_KEY
  * destructive routes (system reset / seeding) always require X-Admin-Token == ADMIN_API_TOKEN
  * /demo/* routes are hidden unless DEMO_MODE=true
  * other /admin/* writes require X-Admin-Token unless DEMO_MODE=true (so a supervised public
    demo can use the Admin portal; never leave DEMO_MODE on unattended)
"""
import os
import secrets
from typing import List, Optional

from fastapi.responses import JSONResponse


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


def _env_list(name: str) -> List[str]:
    return [item.strip().rstrip("/") for item in os.getenv(name, "").split(",") if item.strip()]


APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
IS_PRODUCTION = APP_ENV == "production"
DEMO_MODE = _env_bool("DEMO_MODE", default=not IS_PRODUCTION)
ALLOWED_ORIGINS = _env_list("ALLOWED_ORIGINS")
ALLOWED_ORIGIN_REGEX = os.getenv("ALLOWED_ORIGIN_REGEX") or None
ADMIN_API_TOKEN = os.getenv("ADMIN_API_TOKEN") or None
DEVICE_API_KEY = os.getenv("DEVICE_API_KEY") or None

DESTRUCTIVE_ROUTES = {
    ("POST", "/admin/system-reset"),
    ("POST", "/admin/seed-demo-data"),
    ("POST", "/demo/reset"),
    ("POST", "/demo/seed"),
}
DEVICE_ROUTES = {
    ("POST", "/telemetry"),
    ("POST", "/telemetry/batch"),
}
# Writes outside /admin that are still operator-only (expensive or model-mutating)
OPERATOR_ROUTES = {
    ("POST", "/telemetry/evaluate"),
}
WRITE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def cors_kwargs() -> dict:
    """Arguments for CORSMiddleware."""
    if not IS_PRODUCTION:
        return {"allow_origin_regex": r"^https?://.*$", "allow_credentials": True,
                "allow_methods": ["*"], "allow_headers": ["*"]}
    return {"allow_origins": ALLOWED_ORIGINS, "allow_origin_regex": ALLOWED_ORIGIN_REGEX,
            "allow_credentials": True, "allow_methods": ["*"], "allow_headers": ["*"]}


def _token_ok(supplied: Optional[str], expected: Optional[str]) -> bool:
    return bool(expected) and bool(supplied) and secrets.compare_digest(supplied, expected)


def _deny(status: int, detail: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"detail": detail})


def check_access(method: str, path: str, headers) -> Optional[JSONResponse]:
    """Return a denial response, or None when the request may proceed."""
    method = method.upper()
    path = path.rstrip("/") or "/"
    key = (method, path)

    # Device ingestion: enforced whenever a key is configured; mandatory in production.
    if key in DEVICE_ROUTES:
        if DEVICE_API_KEY:
            if not _token_ok(headers.get("x-device-key"), DEVICE_API_KEY):
                return _deny(401, "Missing or invalid X-Device-Key")
        elif IS_PRODUCTION:
            return _deny(503, "Telemetry ingestion disabled: DEVICE_API_KEY is not configured")
        return None

    if not IS_PRODUCTION:
        return None

    admin_ok = _token_ok(headers.get("x-admin-token"), ADMIN_API_TOKEN)

    if key in DESTRUCTIVE_ROUTES or key in OPERATOR_ROUTES:
        return None if admin_ok else _deny(401, "This operation requires X-Admin-Token")

    if path.startswith("/demo/") and not DEMO_MODE:
        return _deny(404, "Not Found")

    if path.startswith("/admin/") and method in WRITE_METHODS and not DEMO_MODE and not admin_ok:
        return _deny(401, "Admin writes require X-Admin-Token (or DEMO_MODE=true)")

    return None


def describe() -> dict:
    """Non-secret summary for /health."""
    return {
        "env": APP_ENV,
        "demo_mode": DEMO_MODE,
        "admin_token_configured": bool(ADMIN_API_TOKEN),
        "device_key_configured": bool(DEVICE_API_KEY),
        "cors_origins": ALLOWED_ORIGINS if IS_PRODUCTION else ["*"],
    }
