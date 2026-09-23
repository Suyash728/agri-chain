"""
app/routers/health.py
----------------------
Router for the health-check endpoint.

A health check is a lightweight endpoint that external systems
(monitoring tools, load balancers, CI pipelines) use to confirm
that the API is running and reachable.

Current endpoints
-----------------
GET /health
    Returns a simple JSON response confirming the service is alive.
"""

from fastapi import APIRouter

router = APIRouter(
    tags=["Health"],
)


@router.get(
    "/health",
    summary="Health Check",
    description="Confirms that the AI Trust Layer API is running and reachable.",
    status_code=200,
)
def health_check():
    """
    Lightweight liveness probe for the AI Trust Layer service.

    Returns
    -------
    dict
        JSON object with 'status' and a human-readable 'message'.
    """
    return {
        "status": "ok",
        "service": "AgriChain AI Trust Layer",
        "message": "API is running and ready to accept telemetry.",
    }
