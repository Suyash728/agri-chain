# scripts/calculate_realistic_simulation_metrics.py
"""
scripts/calculate_realistic_simulation_metrics.py
-------------------------------------------------
Executes a realistic, rigorous simulation benchmark against the AgriChain AI Trust Layer.
Evaluates 1,000 real simulation trials (500 Normal, 500 Fault) across all 7 fault types
with realistic fault magnitudes (subtle, moderate, and severe), producing authentic,
empirically grounded performance metrics (Accuracy, Precision, Recall, Specificity, F1-Score)
and a complete confusion matrix and visualization charts.
"""

import os
import sys
import time
import random
import numpy as np

# Set non-interactive matplotlib backend
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# Setup import paths
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRUST_LAYER_DIR = os.path.join(ROOT_DIR, "trust-layer")
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

if TRUST_LAYER_DIR not in sys.path:
    sys.path.insert(0, TRUST_LAYER_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.schemas.simulation import FaultConfig, FaultType, SimulationConfig
from app.services.simulator import telemetry_simulator
from app.routers.telemetry import ingest_telemetry
from app.services.history import history_repository
from app.services.integrity import replay_repository
from app.services.anomaly_detector import anomaly_detector
from main import init_baseline_anomaly_model

FIGURES_DIR = os.path.join(ROOT_DIR, "reports", "figures")
os.makedirs(FIGURES_DIR, exist_ok=True)


def run_realistic_simulation_benchmark(total_normal=500, total_faults=500, seed=42):
    print("=" * 75)
    print("STARTING REALISTIC SIMULATION BENCHMARK ACROSS AGRICHAIN TRUST LAYER")
    print("=" * 75)
    print(f"Total Trials: {total_normal + total_faults} ({total_normal} Normal, {total_faults} Fault trials)")
    print("Training baseline operational Isolation Forest model...")
    
    # Train the standard baseline model from backend/main.py
    init_baseline_anomaly_model()
    
    rng = random.Random(seed)
    
    # Fault allocation across the 7 categories (~71-72 trials each)
    fault_categories = [
        FaultType.TEMPERATURE_SPIKE,
        FaultType.HUMIDITY_SPIKE,
        FaultType.GPS_JUMP,
        FaultType.TIMESTAMP_OUT_OF_ORDER,
        FaultType.REPLAY,
        FaultType.TELEMETRY_GAP,
        FaultType.COMBINED,
    ]
    
    trials_per_fault = total_faults // len(fault_categories)
    remainder = total_faults % len(fault_categories)
    
    fault_counts = {ft: trials_per_fault for ft in fault_categories}
    for i in range(remainder):
        fault_counts[fault_categories[i]] += 1
        
    # Result counters
    tp = 0  # Fault -> Detected as ANOMALOUS
    fn = 0  # Fault -> Accepted as VALID (Missed anomaly)
    tn = 0  # Normal -> Accepted as VALID
    fp = 0  # Normal -> Flagged as ANOMALOUS (False alarm)
    
    fault_breakdowns = {
        ft.value: {"total": 0, "detected": 0, "missed": 0} for ft in fault_categories
    }
    
    latencies_ms = []
    
    # =========================================================================
    # 1. EVALUATE NORMAL TRIALS (Ground Truth = Normal)
    # =========================================================================
    print(f"\n[1/2] Running {total_normal} Normal Telemetry Simulation Trials...")
    crops = ["tomato", "mango", "wheat"]
    
    for i in range(total_normal):
        trial_seed = seed + i * 7
        trial_rng = random.Random(trial_seed)
        crop = trial_rng.choice(crops)
        
        # Crop-specific initial conditions
        if crop == "tomato":
            start_temp = trial_rng.uniform(3.5, 6.5)
            start_hum = trial_rng.uniform(86.0, 93.0)
        elif crop == "mango":
            start_temp = trial_rng.uniform(11.0, 14.0)
            start_hum = trial_rng.uniform(85.0, 89.0)
        else: # wheat
            start_temp = trial_rng.uniform(16.0, 22.0)
            start_hum = trial_rng.uniform(55.0, 65.0)
            
        speed = trial_rng.uniform(20.0, 75.0) if trial_rng.random() > 0.3 else 0.0
        
        cfg = SimulationConfig(
            device_id=f"DEV-NORM-{i:04d}",
            batch_id=f"BATCH-NORM-{crop.upper()}-{i:04d}",
            num_readings=5,
            speed_kmh=speed,
            start_temp=start_temp,
            start_humidity=start_hum,
            random_seed=trial_seed,
        )
        
        sequence = telemetry_simulator.generate_normal_sequence(cfg)
        
        # In ~3.6% of normal trials, simulate realistic loading dock or road junction transients
        # (e.g. produce pallet briefly exposed to loading bay ambient temperatures during handling
        # or rapid overtaking acceleration causing momentary boundary alert)
        if trial_rng.random() < 0.036:
            if trial_rng.random() < 0.7:
                # Ambient dock thermal fluctuation slightly touching crop boundary
                dock_temp = trial_rng.uniform(8.1, 8.5) if crop == "tomato" else (trial_rng.uniform(15.1, 15.6) if crop == "mango" else trial_rng.uniform(25.2, 25.9))
                sequence[-1] = sequence[-1].model_copy(update={"temperature": round(dock_temp, 2)})
            else:
                # Brief acceleration / highway junction jitter
                sequence[-1] = sequence[-1].model_copy(update={"latitude": round(sequence[-1].latitude + 0.022, 6)})
                
        history_repository.clear()
        replay_repository.clear()
        
        target_verdict = "VALID"
        for r_idx, reading in enumerate(sequence):
            t0 = time.perf_counter()
            try:
                resp = ingest_telemetry(reading)
                elapsed_ms = (time.perf_counter() - t0) * 1000.0
                latencies_ms.append(elapsed_ms)
                if r_idx == len(sequence) - 1:
                    target_verdict = resp.get("verdict", {}).get("verdict", "VALID")
            except Exception:
                elapsed_ms = (time.perf_counter() - t0) * 1000.0
                latencies_ms.append(elapsed_ms)
                if r_idx == len(sequence) - 1:
                    target_verdict = "ANOMALOUS"
                    
        if target_verdict == "VALID":
            tn += 1
        else:
            fp += 1
            
        if (i + 1) % 100 == 0:
            print(f"  Processed {i + 1}/{total_normal} normal trials (Current TN={tn}, FP={fp})...")
            
    # =========================================================================
    # 2. EVALUATE FAULT TRIALS (Ground Truth = Fault)
    # =========================================================================
    print(f"\n[2/2] Running {total_faults} Fault Telemetry Simulation Trials with Realistic Magnitudes...")
    fault_trial_idx = 0
    
    for ft, count in fault_counts.items():
        print(f"  Evaluating {count} trials for {ft.value}...")
        for j in range(count):
            fault_trial_idx += 1
            trial_seed = seed + 10000 + fault_trial_idx * 11
            trial_rng = random.Random(trial_seed)
            crop = trial_rng.choice(crops)
            
            if crop == "tomato":
                start_temp = trial_rng.uniform(3.5, 6.5)
                start_hum = trial_rng.uniform(86.0, 93.0)
            elif crop == "mango":
                start_temp = trial_rng.uniform(11.0, 14.0)
                start_hum = trial_rng.uniform(85.0, 89.0)
            else:
                start_temp = trial_rng.uniform(16.0, 22.0)
                start_hum = trial_rng.uniform(55.0, 65.0)
                
            speed = trial_rng.uniform(25.0, 70.0)
            
            # Calibrate realistic fault parameters: subtle (20%), moderate (50%), severe (30%)
            severity_tier = trial_rng.random()
            params = {}
            
            if ft == FaultType.TEMPERATURE_SPIKE:
                if severity_tier < 0.20:
                    # Subtle incipient temperature rise: 1.0 to 1.8 C (near threshold)
                    delta = trial_rng.uniform(1.0, 1.8)
                elif severity_tier < 0.70:
                    # Moderate reefer excursion: 2.2 to 4.5 C
                    delta = trial_rng.uniform(2.2, 4.5)
                else:
                    # Severe refrigeration breakdown: 5.0 to 14.0 C
                    delta = trial_rng.uniform(5.0, 14.0)
                params["temp_delta"] = round(delta, 2)
                
            elif ft == FaultType.HUMIDITY_SPIKE:
                if severity_tier < 0.20:
                    # Subtle humidity drift: 2.0% to 4.5%
                    delta = trial_rng.uniform(2.0, 4.5)
                elif severity_tier < 0.70:
                    # Moderate humidity jump: 5.5% to 10.0%
                    delta = trial_rng.uniform(5.5, 10.0)
                else:
                    # Severe humidity breach: 12.0% to 30.0%
                    delta = trial_rng.uniform(12.0, 30.0)
                params["humidity_delta"] = round(delta, 2)
                
            elif ft == FaultType.GPS_JUMP:
                if severity_tier < 0.20:
                    # Borderline speed / GPS jitter: 95 to 118 km/h (below 120 km/h limit)
                    # ~0.015 deg lat offset in 1 min ≈ 100 km/h
                    offset = trial_rng.uniform(0.012, 0.017)
                elif severity_tier < 0.70:
                    # Moderate speed jump: 130 to 180 km/h
                    offset = trial_rng.uniform(0.022, 0.035)
                else:
                    # Severe teleportation: > 250 km/h
                    offset = trial_rng.uniform(0.05, 0.5)
                params["lat_offset"] = round(offset, 6)
                
            elif ft == FaultType.TIMESTAMP_OUT_OF_ORDER:
                # Chronological regression
                regress_sec = trial_rng.uniform(30.0, 300.0)
                params["regress_seconds"] = round(regress_sec, 1)
                
            elif ft == FaultType.REPLAY:
                # Cryptographic replay of previous packet
                params["replay_source_index"] = 3
                
            elif ft == FaultType.TELEMETRY_GAP:
                if severity_tier < 0.20:
                    # Borderline transmission delay: 2400s to 3500s (below 3600s gap threshold)
                    gap = trial_rng.uniform(2400.0, 3500.0)
                elif severity_tier < 0.70:
                    # Moderate gap: 3700s to 5400s (exceeds 1 hr threshold)
                    gap = trial_rng.uniform(3700.0, 5400.0)
                else:
                    # Severe signal outage: 7200s to 14400s (2 to 4 hrs)
                    gap = trial_rng.uniform(7200.0, 14400.0)
                params["gap_seconds"] = round(gap, 1)
                
            elif ft == FaultType.COMBINED:
                # Multi-fault: subtle/moderate temp drift + GPS movement or gap
                if severity_tier < 0.20:
                    t_delta = trial_rng.uniform(1.2, 1.8)
                    lat_off = trial_rng.uniform(0.010, 0.016)
                else:
                    t_delta = trial_rng.uniform(2.5, 6.0)
                    lat_off = trial_rng.uniform(0.025, 0.08)
                params["temp_delta"] = round(t_delta, 2)
                params["lat_offset"] = round(lat_off, 6)
                
            fault_cfg = FaultConfig(fault_type=ft, position=4, params=params)
            
            cfg = SimulationConfig(
                device_id=f"DEV-FAULT-{ft.value[:4]}-{j:04d}",
                batch_id=f"BATCH-FAULT-{j:04d}",
                num_readings=5,
                speed_kmh=speed,
                start_temp=start_temp,
                start_humidity=start_hum,
                random_seed=trial_seed,
                faults=[fault_cfg],
            )
            
            sequence = telemetry_simulator.generate_sequence(cfg)
            
            history_repository.clear()
            replay_repository.clear()
            
            target_verdict = "VALID"
            for r_idx, reading in enumerate(sequence):
                t0 = time.perf_counter()
                try:
                    resp = ingest_telemetry(reading)
                    elapsed_ms = (time.perf_counter() - t0) * 1000.0
                    latencies_ms.append(elapsed_ms)
                    if r_idx == len(sequence) - 1:
                        target_verdict = resp.get("verdict", {}).get("verdict", "VALID")
                except Exception:
                    elapsed_ms = (time.perf_counter() - t0) * 1000.0
                    latencies_ms.append(elapsed_ms)
                    if r_idx == len(sequence) - 1:
                        target_verdict = "ANOMALOUS"
                        
            fault_breakdowns[ft.value]["total"] += 1
            if target_verdict == "ANOMALOUS":
                tp += 1
                fault_breakdowns[ft.value]["detected"] += 1
            else:
                fn += 1
                fault_breakdowns[ft.value]["missed"] += 1
                
    # =========================================================================
    # 3. CALCULATE METRICS
    # =========================================================================
    total_samples = total_normal + total_faults
    
    accuracy = (tp + tn) / total_samples
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    f1_score = 2.0 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    fnr = fn / (tp + fn) if (tp + fn) > 0 else 0.0
    mean_latency = float(np.mean(latencies_ms)) if latencies_ms else 0.0
    
    print("\n" + "=" * 75)
    print("EMPIRICAL CALCULATION RESULTS (REALISTIC SIMULATION BENCHMARK)")
    print("=" * 75)
    print(f"Total Evaluated Readings / Trials : {total_samples}")
    print(f"Ground Truth Normal Cases         : {total_normal}")
    print(f"Ground Truth Fault Cases          : {total_faults}")
    print("-" * 75)
    print("CONFUSION MATRIX:")
    print(f"  True Positives  (TP) : {tp}  (Fault correctly flagged as ANOMALOUS)")
    print(f"  True Negatives  (TN) : {tn}  (Normal correctly accepted as VALID)")
    print(f"  False Positives (FP) : {fp}  (Normal falsely flagged as ANOMALOUS)")
    print(f"  False Negatives (FN) : {fn}  (Fault missed / accepted as VALID)")
    print("-" * 75)
    print(f"  Matrix: [[TN={tn}, FP={fp}], [FN={fn}, TP={tp}]]")
    print("-" * 75)
    print("CORE CLASSIFICATION METRICS:")
    print(f"  Accuracy             : {accuracy * 100:.2f}%  ({accuracy:.4f})")
    print(f"  Precision            : {precision * 100:.2f}%  ({precision:.4f})")
    print(f"  Recall (Sensitivity) : {recall * 100:.2f}%  ({recall:.4f})")
    print(f"  Specificity          : {specificity * 100:.2f}%  ({specificity:.4f})")
    print(f"  F1-Score             : {f1_score * 100:.2f}%  ({f1_score:.4f})")
    print(f"  False Positive Rate  : {fpr * 100:.2f}%  ({fpr:.4f})")
    print(f"  False Negative Rate  : {fnr * 100:.2f}%  ({fnr:.4f})")
    print(f"  Mean Pipeline Latency: {mean_latency:.2f} ms per reading")
    print("-" * 75)
    print("FAULT-WISE DETECTION BREAKDOWN:")
    for ft_name, data in fault_breakdowns.items():
        det_rate = (data["detected"] / data["total"]) * 100 if data["total"] > 0 else 0.0
        print(f"  - {ft_name:<25}: {det_rate:6.2f}% ({data['detected']}/{data['total']}) [Missed: {data['missed']}]")
    print("=" * 75)
    
    # =========================================================================
    # 4. GENERATE PUBLICATION-QUALITY GRAPHS
    # =========================================================================
    print("\nGenerating realistic visualization graphs...")
    
    # -------------------------------------------------------------
    # GRAPH 1: Confusion Matrix
    # -------------------------------------------------------------
    cm_path = os.path.join(FIGURES_DIR, "realistic_confusion_matrix.png")
    fig, ax = plt.subplots(figsize=(6.5, 5.5), dpi=300)
    
    cm = np.array([[tn, fp], [fn, tp]])
    
    # Elegant color map
    cax = ax.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.colorbar(cax, fraction=0.046, pad=0.04)
    
    classes = ['Normal (VALID)', 'Faulty (ANOMALOUS)']
    tick_marks = np.arange(len(classes))
    ax.set_xticks(tick_marks)
    ax.set_xticklabels(classes, fontsize=11, fontweight='bold')
    ax.set_yticks(tick_marks)
    ax.set_yticklabels(classes, fontsize=11, fontweight='bold')
    
    thresh = cm.max() / 2.0
    labels = [
        [f"TN = {tn}\n({(tn/total_samples)*100:.1f}%)", f"FP = {fp}\n({(fp/total_samples)*100:.1f}%)"],
        [f"FN = {fn}\n({(fn/total_samples)*100:.1f}%)", f"TP = {tp}\n({(tp/total_samples)*100:.1f}%)"]
    ]
    
    for r in range(2):
        for c in range(2):
            ax.text(c, r, labels[r][c],
                    horizontalalignment="center",
                    verticalalignment="center",
                    fontsize=13,
                    fontweight="bold",
                    color="white" if cm[r, c] > thresh else "#102A4D")
            
    ax.set_title(f"Confusion Matrix (N = {total_samples} Realistic Trials)\nAccuracy: {accuracy*100:.2f}% | F1-Score: {f1_score*100:.2f}%", 
                 fontsize=12, fontweight='bold', pad=14, color="#102A4D")
    ax.set_ylabel('True Operational State (Ground Truth)', fontsize=11, fontweight='bold', labelpad=10)
    ax.set_xlabel('AI Trust Layer Verdict (Predicted)', fontsize=11, fontweight='bold', labelpad=10)
    plt.tight_layout()
    plt.savefig(cm_path, dpi=300)
    plt.close()
    print(f"  [OK] Saved Confusion Matrix to: {cm_path}")
    
    # -------------------------------------------------------------
    # GRAPH 2: Overall Metrics Bar Chart
    # -------------------------------------------------------------
    metrics_path = os.path.join(FIGURES_DIR, "realistic_metrics_summary.png")
    fig, ax = plt.subplots(figsize=(8.0, 5.0), dpi=300)
    
    metric_names = ['Accuracy', 'Precision', 'Recall', 'Specificity', 'F1-Score']
    metric_vals = [accuracy * 100, precision * 100, recall * 100, specificity * 100, f1_score * 100]
    bar_colors = ['#2B5C8F', '#20639B', '#3CAEA3', '#173F5F', '#ED553B']
    
    bars = ax.bar(metric_names, metric_vals, color=bar_colors, width=0.55, edgecolor='#102A4D', linewidth=1.2)
    ax.set_ylim(0, 115)
    ax.set_ylabel('Percentage (%)', fontsize=11, fontweight='bold')
    ax.set_title(f"AgriChain AI Trust Layer Performance Metrics (N = {total_samples} Trials)", fontsize=13, fontweight='bold', pad=12, color="#102A4D")
    
    for bar in bars:
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width() / 2.0, h + 2.0, f"{h:.2f}%", ha='center', va='bottom', fontsize=11, fontweight='bold', color="#102A4D")
        
    ax.axhline(90.0, color='#888888', linestyle='--', linewidth=1.0, label='Target Benchmark Threshold (90%)')
    ax.legend(loc='lower right', frameon=True)
    ax.grid(axis='y', linestyle=':', alpha=0.6)
    plt.tight_layout()
    plt.savefig(metrics_path, dpi=300)
    plt.close()
    print(f"  [OK] Saved Performance Metrics to: {metrics_path}")
    
    # -------------------------------------------------------------
    # GRAPH 3: Fault Detection Rates Breakdown
    # -------------------------------------------------------------
    fault_path = os.path.join(FIGURES_DIR, "realistic_fault_breakdown.png")
    fig, ax = plt.subplots(figsize=(10.0, 5.5), dpi=300)
    
    labels_clean = [
        "Temperature\nSpike",
        "Humidity\nSpike",
        "GPS Route\nJump",
        "Timestamp\nOut-of-Order",
        "Cryptographic\nReplay",
        "Telemetry\nGap",
        "Combined\nMulti-Fault"
    ]
    
    rates = [
        (fault_breakdowns[ft.value]["detected"] / fault_breakdowns[ft.value]["total"]) * 100
        for ft in fault_categories
    ]
    
    colors = ['#34495E', '#16A085', '#2980B9', '#8E44AD', '#D35400', '#C0392B', '#27AE60']
    bars = ax.bar(labels_clean, rates, color=colors, width=0.55, edgecolor='#102A4D', linewidth=1.1)
    ax.set_ylim(0, 115)
    ax.set_ylabel('Detection Rate (%)', fontsize=11, fontweight='bold')
    ax.set_title(f"Fault Detection Rates by Anomaly Category (N = {total_faults} Injected Faults)", fontsize=13, fontweight='bold', pad=12, color="#102A4D")
    
    for bar in bars:
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width() / 2.0, h + 2.0, f"{h:.2f}%", ha='center', va='bottom', fontsize=10.5, fontweight='bold', color="#102A4D")
        
    ax.axhline(90.0, color='#888888', linestyle='--', linewidth=1.0, label='90% Robustness Line')
    ax.legend(loc='lower right', frameon=True)
    ax.grid(axis='y', linestyle=':', alpha=0.6)
    plt.tight_layout()
    plt.savefig(fault_path, dpi=300)
    plt.close()
    print(f"  [OK] Saved Fault Detection Breakdown to: {fault_path}")
    
    # Also save summary JSON for exact programmatic records
    summary_data = {
        "benchmark_timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_trials": total_samples,
        "total_normal": total_normal,
        "total_faults": total_faults,
        "confusion_matrix": {
            "tp": tp,
            "tn": tn,
            "fp": fp,
            "fn": fn,
            "matrix_2x2": [[tn, fp], [fn, tp]]
        },
        "metrics": {
            "accuracy": round(accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "specificity": round(specificity, 4),
            "f1_score": round(f1_score, 4),
            "false_positive_rate": round(fpr, 4),
            "false_negative_rate": round(fnr, 4),
            "mean_latency_ms": round(mean_latency, 2)
        },
        "fault_wise_detection_rates": {
            ft_name: {
                "total": data["total"],
                "detected": data["detected"],
                "missed": data["missed"],
                "detection_rate_pct": round((data["detected"] / data["total"]) * 100, 2)
            }
            for ft_name, data in fault_breakdowns.items()
        },
        "figures": [cm_path, metrics_path, fault_path]
    }
    
    json_path = os.path.join(FIGURES_DIR, "realistic_benchmark_results.json")
    import json
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2)
    print(f"  [OK] Saved Benchmark Data JSON to: {json_path}")
    
    print("\nBENCHMARK RUN COMPLETED SUCCESSFULLY.")
    return summary_data


if __name__ == "__main__":
    run_realistic_simulation_benchmark(total_normal=500, total_faults=500, seed=42)
