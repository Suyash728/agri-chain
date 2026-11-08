from typing import Optional, List, Union, Dict, Any
from pydantic import BaseModel

class TelemetryRequest(BaseModel):
    batch_id: str
    crop_name: Optional[str] = None
    temp_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    device_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    timestamp: Optional[str] = None
    nonce: Optional[int] = None
    freshness_voc_ppm: Optional[float] = None
    tamper_status: Optional[str] = None


class TelemetryResponse(BaseModel):
    verdict: str
    reason: Optional[str] = None
    tx_hash: Optional[str] = None
    reading_id: int
    event_hash: Optional[str] = None
    disposition: Optional[str] = None
    reason_codes: Optional[List[str]] = None
    anomaly_score: Optional[float] = None


class TelemetryBatchRequest(BaseModel):
    readings: List[TelemetryRequest]


class TelemetryBatchResponse(BaseModel):
    total_received: int
    valid_count: int
    quarantined_count: int
    tx_hash: Optional[str] = None
    results: List[TelemetryResponse]


class SpoilageIncidentRequest(BaseModel):
    batch_id: str
    crop_name: str
    stage: str  # "IN_TRANSIT", "IN_STORAGE", "FARM", "RETAIL"
    failure_type: str  # "REEFER_COOLING_FAILURE", "THERMAL_BREACH", "EXPIRED_SHELF_LIFE", "HUMIDITY_SPIKE_SPOILAGE", "CONTAMINATION"
    severity: str  # "CRITICAL", "HIGH", "MEDIUM"
    loss_goods_kg: float
    price_per_kg_inr: float
    custodian_at_fault: str
    details: str
    status: Optional[str] = "CONFIRMED_LOSS"


class SpoilageIncidentItem(BaseModel):
    incident_id: str
    batch_id: str
    crop_name: str
    stage: str
    failure_type: str
    severity: str
    loss_goods_kg: float
    price_per_kg_inr: float
    total_loss_paise: int
    total_loss_inr: float
    custodian_at_fault: str
    details: str
    status: str
    created_at: str


class SpoilageSummaryResponse(BaseModel):
    total_incidents: int
    total_loss_goods_kg: float
    total_loss_money_inr: float
    incidents: List[SpoilageIncidentItem]


class CreateBatchRequest(BaseModel):
    batch_id: str
    crop_name: str
    origin_farm: str
    harvest_date: str
    farmer_name: str
    farmer_address: Optional[str] = None
    category: Optional[str] = None
    quantity_tonnes: Optional[float] = None
    price_inr: Optional[float] = None


class CreateBatchResponse(BaseModel):
    batch_id: str
    crop_name: str
    origin_farm: str
    harvest_date: str
    farmer_name: str
    tx_hash: str


class CustodyTransferRequest(BaseModel):
    to_holder: str
    to_address: Optional[str] = None
    state: str  # e.g. "IN_TRANSIT", "IN_STORAGE", "AT_RETAIL", "SOLD"
    price_paise: int


class CustodyTransferResponse(BaseModel):
    batch_id: str
    from_holder: Optional[str]
    to_holder: str
    state: str
    price_paise: int
    tx_hash: str


class BatchDocumentResponse(BaseModel):
    id: int
    batch_id: str
    doc_type: str
    ipfs_cid: str
    file_name: str
    uploaded_at: str
    gateway_url: str
    tx_hash: Optional[str] = None


class DarkStoreReceiveRequest(BaseModel):
    batch_id: str
    price_paise: Optional[int] = 140000
    holder_name: Optional[str] = "Pune Fresh DarkStore Hub"


class DarkStoreCheckoutRequest(BaseModel):
    batch_id: str
    price_paise: Optional[int] = 200000
    consumer_name: Optional[str] = "Customer Home Delivery"


class ReviewCreateRequest(BaseModel):
    rating: int  # 1-5
    comment: Optional[str] = ""
    freshness_score: Optional[int] = 95
    reviewer_address: Optional[str] = None


class RoleGrantRequest(BaseModel):
    address: str
    role: str  # FARMER_ROLE, LOGISTICS_ROLE, RETAILER_ROLE, ORACLE_ROLE


class DarkStoreFefoRequest(BaseModel):
    store_id: Optional[str] = "DS-402"
    reallocate_bins: Optional[bool] = True


class DarkStoreExpiryActionRequest(BaseModel):
    batch_id: str
    action_type: str
    discount_pct: Optional[int] = 20


class CreateUserRequest(BaseModel):
    name: str
    email: str
    role: str  # 'farmer', 'logistics', 'darkstore', 'consumer', 'admin'
    address: Optional[str] = None
    phone: Optional[str] = None
    username: Optional[str] = None
    grant_onchain: bool = True


class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None  # 'ACTIVE', 'INACTIVE'
    address: Optional[str] = None


class AuthLoginRequest(BaseModel):
    username_or_email: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None


class ContractPauseRequest(BaseModel):
    contract: str  # "ProductRegistry" | "CustodyTransfer" | "ColdChainMonitor"


class ConsumerOrderItem(BaseModel):
    id: Optional[Union[str, int]] = None
    name: str
    weight: Optional[str] = "1 kg"
    price: float
    quantity: int = 1
    image: Optional[str] = None
    batchId: Optional[str] = None


class ConsumerCheckoutPayload(BaseModel):
    items: List[ConsumerOrderItem]
    delivery_address: Optional[str] = "Nashik, Maharashtra"
    applied_coupon: Optional[str] = ""
    total_amount: Optional[float] = None


class DemoScenarioRunRequest(BaseModel):
    scenario: str
    crop_name: Optional[str] = None
    farmer_name: Optional[str] = None
    origin_farm: Optional[str] = None
    quantity_kg: Optional[float] = None


class DemoIotInjectRequest(BaseModel):
    batch_id: str
    temperature: float
    humidity: float
    speed_kmh: Optional[float] = 45.0
    latitude: Optional[float] = 18.5204
    longitude: Optional[float] = 73.8567
    device_id: Optional[str] = "ESP32-DEMO-NODE-01"
    simulate_replay: Optional[bool] = False


class DemoProduceCreateRequest(BaseModel):
    crop_name: str
    quantity_kg: float
    origin_farm: str
    farmer_name: str
    category: Optional[str] = "vegetables"
    price_per_kg: Optional[float] = 40.0


class DemoCustodyAdvanceRequest(BaseModel):
    batch_id: str
    next_state: str
    holder_name: Optional[str] = None
    price_paise: Optional[int] = None


class DemoGodModeTourStepRequest(BaseModel):
    batch_id: Optional[str] = None
    step: int
    crop_name: Optional[str] = "Vine-Ripened Cluster Tomatoes"
    farmer_name: Optional[str] = "Rahul Patil"
    carrier_name: Optional[str] = "Safexpress Cold Chain Logistics"
    darkstore_name: Optional[str] = "Pune Fresh DarkStore Hub"


