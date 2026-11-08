from routers.common import router as common_router
from routers.telemetry import router as telemetry_router
from routers.batches import router as batches_router
from routers.farmer import router as farmer_router
from routers.logistics import router as logistics_router
from routers.darkstore import router as darkstore_router
from routers.consumer import router as consumer_router
from routers.admin import router as admin_router
from routers.demo import router as demo_router

__all__ = [
    "common_router",
    "telemetry_router",
    "batches_router",
    "farmer_router",
    "logistics_router",
    "darkstore_router",
    "consumer_router",
    "admin_router",
    "demo_router",
]
