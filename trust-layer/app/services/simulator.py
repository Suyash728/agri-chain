"""
app/services/simulator.py
-------------------------
Phase 9 — Telemetry Simulator + Fault Injection service.

WHAT THIS MODULE DOES
----------------------
1. Generates realistic, sequential IoT telemetry records mimicking sensors mounted on
   refrigerated vehicles or cold-chain storage nodes.
2. Supports deterministic random generation via seed parameter for reproducible experiments.
3. Provides a clean, named fault injection framework for generating controlled anomaly scenarios:
     - Temperature Spikes (physical plausibility & ML testing)
     - Humidity Spikes (physical plausibility & ML testing)
     - GPS Jumps (movement speed plausibility testing)
     - Timestamp Out-of-Order (chronological & integrity testing)
     - Replay / Duplicate Readings (Phase 6 cryptographic replay testing)
     - Telemetry Gaps (temporal sequence plausibility testing)
     - Combined Faults (multi-evidence aggregation testing)
4. Never bypasses or fabricates trust decisions: outputs pure `TelemetryPayload` instances
   intended to be evaluated through the real AI Trust Layer pipeline.

FAULT SCENARIO REFERENCE
------------------------
| Fault Scenario          | Affected Fields       | Intended Pipeline Test               | Expected Primary Reason Code |
|-------------------------|-----------------------|--------------------------------------|------------------------------|
| TEMPERATURE_SPIKE       | temperature           | Thermal rate plausibility & ML model | TEMPERATURE_RATE_EXCEEDED    |
| HUMIDITY_SPIKE          | humidity              | Humidity rate plausibility & ML model| HUMIDITY_RATE_EXCEEDED       |
| GPS_JUMP                | latitude, longitude   | GPS speed plausibility               | GPS_SPEED_EXCEEDED           |
| TIMESTAMP_OUT_OF_ORDER  | timestamp             | Chronological & sequence integrity   | TIMESTAMP_OUT_OF_ORDER       |
| REPLAY                  | (entire payload)      | SHA-256 fingerprint replay detection | REPLAY_DETECTED              |
| TELEMETRY_GAP           | timestamp             | Temporal continuity plausibility     | TELEMETRY_GAP_EXCEEDED       |
| COMBINED                | multiple              | Multi-evidence aggregation & verdict | Multiple reasons preserved   |
"""

from copy import deepcopy
from datetime import datetime, timedelta, timezone
import math
import random
from typing import Any, Callable, Dict, List, Optional

from app.config import (
    MAX_HUMIDITY_CHANGE_RATE_PER_MIN,
    MAX_PLAUSIBLE_SPEED_KMH,
    MAX_TELEMETRY_GAP_SECONDS,
    MAX_TEMPERATURE_CHANGE_RATE_PER_MIN,
)
from app.schemas.simulation import FaultConfig, FaultType, SimulationConfig
from app.schemas.telemetry import TelemetryPayload


class TelemetrySimulator:
    """
    Service for generating realistic IoT telemetry streams and injecting controlled faults.
    """

    def generate_normal_sequence(self, config: SimulationConfig) -> List[TelemetryPayload]:
        """
        Generate a sequence of physically realistic, chronological telemetry readings.

        Parameters
        ----------
        config : SimulationConfig
            Simulation parameters (readings count, initial state, speed, seed).

        Returns
        -------
        List[TelemetryPayload]
            Chronologically ordered list of valid telemetry readings.
        """
        rng = random.Random(config.random_seed) if config.random_seed is not None else random.Random()

        # Deterministic default baseline timestamp if start_time not specified
        if config.start_time is not None:
            current_time = config.start_time
        elif config.random_seed is not None:
            current_time = datetime(2026, 9, 21, 10, 0, 0, tzinfo=timezone.utc)
        else:
            current_time = datetime.now(timezone.utc)

        current_lat = config.start_lat
        current_lon = config.start_lon
        current_temp = config.start_temp
        current_humidity = config.start_humidity

        readings: List[TelemetryPayload] = []

        # Approx km per degree latitude
        KM_PER_DEG_LAT = 111.0

        for i in range(config.num_readings):
            if i > 0:
                # Advance time by time_step_seconds
                current_time += timedelta(seconds=config.time_step_seconds)

                # Realistic distance traveled in time step
                hours = config.time_step_seconds / 3600.0
                dist_km = config.speed_kmh * hours

                # Slight heading variation (mostly north-east with small jitter)
                lat_delta = (dist_km / KM_PER_DEG_LAT) * (0.8 + rng.uniform(-0.1, 0.1))
                lon_delta = (dist_km / KM_PER_DEG_LAT) * (0.6 + rng.uniform(-0.1, 0.1))
                current_lat = round(current_lat + lat_delta, 6)
                current_lon = round(current_lon + lon_delta, 6)

                # Gentle temperature drift (well below 2.0°C/min threshold)
                temp_jitter = rng.uniform(-0.1, 0.1)
                current_temp = round(current_temp + temp_jitter, 2)

                # Gentle humidity drift (well below 5.0%/min threshold)
                hum_jitter = rng.uniform(-0.2, 0.2)
                current_humidity = round(max(0.0, min(100.0, current_humidity + hum_jitter)), 2)

            reading = TelemetryPayload(
                batch_id=config.batch_id,
                device_id=config.device_id,
                latitude=current_lat,
                longitude=current_lon,
                temperature=current_temp,
                humidity=current_humidity,
                timestamp=current_time,
            )
            readings.append(reading)

        return readings

    def inject_fault(
        self,
        sequence: List[TelemetryPayload],
        fault: FaultConfig,
    ) -> List[TelemetryPayload]:
        """
        Inject a specified fault into an existing telemetry sequence.

        Parameters
        ----------
        sequence : List[TelemetryPayload]
            The baseline telemetry sequence.
        fault : FaultConfig
            The fault configuration defining type, position, and parameters.

        Returns
        -------
        List[TelemetryPayload]
            A new list of telemetry readings with the fault injected.
        """
        if not sequence:
            return []

        # Create a deep copy to ensure baseline is unmodified
        modified = [deepcopy(r) for r in sequence]
        n = len(modified)

        # Determine target injection index (default to last element or middle if last is initial)
        pos = fault.position if fault.position is not None else (n - 1)
        if pos < 0:
            pos = max(0, n + pos)
        pos = min(pos, n - 1)

        # Dispatch based on fault type
        if fault.fault_type == FaultType.TEMPERATURE_SPIKE:
            self._inject_temperature_spike(modified, pos, fault.params)
        elif fault.fault_type == FaultType.HUMIDITY_SPIKE:
            self._inject_humidity_spike(modified, pos, fault.params)
        elif fault.fault_type == FaultType.GPS_JUMP:
            self._inject_gps_jump(modified, pos, fault.params)
        elif fault.fault_type == FaultType.TIMESTAMP_OUT_OF_ORDER:
            self._inject_timestamp_out_of_order(modified, pos, fault.params)
        elif fault.fault_type == FaultType.REPLAY:
            self._inject_replay(modified, pos, fault.params)
        elif fault.fault_type == FaultType.TELEMETRY_GAP:
            self._inject_telemetry_gap(modified, pos, fault.params)
        elif fault.fault_type == FaultType.COMBINED:
            self._inject_combined(modified, pos, fault.params)

        return modified

    def generate_sequence(self, config: SimulationConfig) -> List[TelemetryPayload]:
        """
        Generate a telemetry sequence and apply all configured faults in order.

        Parameters
        ----------
        config : SimulationConfig
            Simulation configuration.

        Returns
        -------
        List[TelemetryPayload]
            The resulting simulated telemetry sequence.
        """
        sequence = self.generate_normal_sequence(config)
        for fault in config.faults:
            sequence = self.inject_fault(sequence, fault)
        return sequence

    # ---------------------------------------------------------------------------
    # Private Fault Mutators
    # ---------------------------------------------------------------------------

    def _inject_temperature_spike(
        self,
        sequence: List[TelemetryPayload],
        pos: int,
        params: Dict[str, Any],
    ) -> None:
        """Inject a sudden temperature change exceeding MAX_TEMPERATURE_CHANGE_RATE_PER_MIN."""
        # Default spike is +15.0°C (far above 2.0°C/min for a 60s step)
        delta = float(params.get("temp_delta", 15.0))
        target = sequence[pos]
        new_temp = round(target.temperature + delta, 2)
        sequence[pos] = target.model_copy(update={"temperature": new_temp})

    def _inject_humidity_spike(
        self,
        sequence: List[TelemetryPayload],
        pos: int,
        params: Dict[str, Any],
    ) -> None:
        """Inject a sudden humidity change exceeding MAX_HUMIDITY_CHANGE_RATE_PER_MIN."""
        # Default spike is +30.0% (far above 5.0%/min for a 60s step)
        delta = float(params.get("humidity_delta", 30.0))
        target = sequence[pos]
        new_humidity = round(max(0.0, min(100.0, target.humidity + delta)), 2)
        sequence[pos] = target.model_copy(update={"humidity": new_humidity})

    def _inject_gps_jump(
        self,
        sequence: List[TelemetryPayload],
        pos: int,
        params: Dict[str, Any],
    ) -> None:
        """Inject an unrealistic coordinate displacement exceeding MAX_PLAUSIBLE_SPEED_KMH."""
        # Default offset is +5.0 degrees latitude (~555 km in 1 min, > 30,000 km/h)
        lat_offset = float(params.get("lat_offset", 5.0))
        lon_offset = float(params.get("lon_offset", 0.0))
        target = sequence[pos]
        new_lat = round(max(-90.0, min(90.0, target.latitude + lat_offset)), 6)
        new_lon = round(max(-180.0, min(180.0, target.longitude + lon_offset)), 6)
        sequence[pos] = target.model_copy(update={"latitude": new_lat, "longitude": new_lon})

    def _inject_timestamp_out_of_order(
        self,
        sequence: List[TelemetryPayload],
        pos: int,
        params: Dict[str, Any],
    ) -> None:
        """Inject a regressive timestamp older than the preceding reading."""
        target = sequence[pos]
        delta_seconds = float(params.get("regress_seconds", 300.0))

        if pos > 0:
            # Set to 5 minutes earlier than previous reading
            new_ts = sequence[pos - 1].timestamp - timedelta(seconds=delta_seconds)
        else:
            # If pos is 0, shift backward from current
            new_ts = target.timestamp - timedelta(seconds=delta_seconds)

        sequence[pos] = target.model_copy(update={"timestamp": new_ts})

    def _inject_replay(
        self,
        sequence: List[TelemetryPayload],
        pos: int,
        params: Dict[str, Any],
    ) -> None:
        """
        Replay an earlier reading exactly so that its canonical SHA-256 hash matches
        the previously seen event.
        """
        if pos <= 0:
            return

        # By default replay the immediately preceding reading, or configured index
        source_idx = int(params.get("replay_source_index", pos - 1))
        source_idx = max(0, min(source_idx, pos - 1))

        # Deep-copy the earlier reading directly into target position
        replayed = deepcopy(sequence[source_idx])
        sequence[pos] = replayed

    def _inject_telemetry_gap(
        self,
        sequence: List[TelemetryPayload],
        pos: int,
        params: Dict[str, Any],
    ) -> None:
        """Inject a large gap in time exceeding MAX_TELEMETRY_GAP_SECONDS."""
        # Default gap is 7200 seconds (2 hours), well beyond 3600 second threshold
        gap_seconds = float(params.get("gap_seconds", 7200.0))
        target = sequence[pos]

        if pos > 0:
            new_ts = sequence[pos - 1].timestamp + timedelta(seconds=gap_seconds)
        else:
            new_ts = target.timestamp + timedelta(seconds=gap_seconds)

        sequence[pos] = target.model_copy(update={"timestamp": new_ts})

    def _inject_combined(
        self,
        sequence: List[TelemetryPayload],
        pos: int,
        params: Dict[str, Any],
    ) -> None:
        """
        Inject multiple faults into the sequence.
        params can contain:
          - sub_faults: List of FaultConfig-compatible dicts
          - or default combined scenario: temperature spike + GPS jump
        """
        sub_faults = params.get("sub_faults")
        if sub_faults and isinstance(sub_faults, list):
            for sf in sub_faults:
                f_type = FaultType(sf.get("fault_type", FaultType.TEMPERATURE_SPIKE))
                f_pos = sf.get("position", pos)
                f_params = sf.get("params", {})
                self.inject_fault(
                    sequence,
                    FaultConfig(fault_type=f_type, position=f_pos, params=f_params),
                )
        else:
            # Default combined: temperature spike + GPS jump at target position
            self._inject_temperature_spike(sequence, pos, params)
            self._inject_gps_jump(sequence, pos, params)


# Singleton simulator instance
telemetry_simulator = TelemetrySimulator()
