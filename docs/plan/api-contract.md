# API Contract

All API endpoints are assumed to be **role‑based** and are exposed by the FastAPI back‑end.  The contract between the front‑end and the API is frozen and must not change once Track D starts building UI.  Fields are in camelCase for consistency across the stack.

## 1. Ingestion API

```
POST /ingest

Request Body:
{
  "batchId": "string",          // globally unique
  "sensorId": "string",          // device identifier
  "timestamp": "ISO8601",        // UTC
  "lat": number,
  "lng": number,
  "temperature": number,
  "humidity": number
}

Response:
{
  "eventId": "string",          // internal DB ID
  "status": "validated" | "anomalous"
}
```

## 2. AI Trust API

```
POST /trust

Request Body: same as /ingest

Response:
{
  "eventId": "string",
  "valid": true | false,
  "anomalyScore": number|null,
  "detectedType": "spike" | "dropout" | null
}
```

## 3. Oracle Writer API

```
POST /oracle/validate

Body: {
  "eventId": "string"
}

Response: {
  "txHash": "string",
  "contractAddress": "string"
}
```

## 4. Query API

```
GET /batch/{batchId}

Response:
{
  "batchId": "string",
  "status": "InTransit" | "InStorage" | "Sold",
  "temperatures": [number],
  "locations": [{"lat":number,"lng":number,"ts":string}],
  "oracleEvents": ["string"],
  "lastModified": "ISO8601"
}
```

### Header‑based auth

All endpoints require `Authorization: Bearer <JWT>` issued by the Auth service (Supabase / Auth0).  JWT claims include the user role (`admin`, `farmer`, `logistics`, `retailer`, `consumer`).

*End of contract.*
