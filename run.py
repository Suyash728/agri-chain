#!/usr/bin/env python3
"""
AgriChain Full-Stack System Unified Launcher (Cross-Platform: Linux, macOS, Windows)
------------------------------------------------------------------------------------
Starts the complete 5-tier AgriChain architecture with a single command:
  1. Hardhat Local Blockchain Node (Port 8545)
  2. Modular Smart Contract Deployment & Policy Seeding
  3. FastAPI REST Backend & AI Trust Layer (Port 8000)
  4. Optimal Multi-Role Demonstration Dataset Seeder
  5. Vite + React 18 Multi-Role Web Application (Port 3000)
  6. Auto-opens default web browser to the application

Usage:
  python run.py                   # Standard run
  python run.py --no-browser      # Do not open browser automatically
  python run.py --simulator       # Also start IoT telemetry simulator in background
  python run.py --no-seed         # Skip demo data seeding on startup
"""

import sys
import os
import time
import socket
import signal
import shutil
import urllib.request
import urllib.error
import json
import argparse
import webbrowser
import subprocess
import threading
from pathlib import Path

# ANSI Terminal Styling
class Colors:
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    RESET = '\033[0m'

if sys.platform == "win32":
    # Enable ANSI escape sequences on Windows 10/11
    try:
        import ctypes
        kernel32 = ctypes.windll.kernel32
        kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent
CONTRACTS_DIR = ROOT_DIR / "contracts"
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
LOGS_DIR = ROOT_DIR / "logs"

# Global process tracking for clean shutdown
processes = {}
shutdown_initiated = False

def print_banner():
    banner = f"""
{Colors.CYAN}{Colors.BOLD}==============================================================================
   🌾  AgriChain: Decentralized Food Supply Chain & Pre-Chain AI Trust  🌾
=============================================================================={Colors.RESET}
   {Colors.DIM}Targeting Local Development & Demonstration Environment{Colors.RESET}
"""
    print(banner)

def find_python_executable():
    """Locate the active virtual environment Python or fallback to system Python."""
    if sys.platform == "win32":
        venv_py = ROOT_DIR / ".venv" / "Scripts" / "python.exe"
        if not venv_py.exists():
            venv_py = ROOT_DIR / "venv" / "Scripts" / "python.exe"
    else:
        venv_py = ROOT_DIR / ".venv" / "bin" / "python"
        if not venv_py.exists():
            venv_py = ROOT_DIR / "venv" / "bin" / "python"

    if venv_py.exists():
        return str(venv_py)
    return sys.executable

def find_cli_tool(name):
    """Find CLI tools (npx, npm) handling Windows .cmd extensions."""
    path = shutil.which(name)
    if path:
        return path
    if sys.platform == "win32":
        path = shutil.which(f"{name}.cmd")
        if path:
            return path
    return name

def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0

def kill_port(port: int):
    """Attempt to terminate any process listening on a port."""
    if sys.platform == "win32":
        try:
            out = subprocess.check_output(f"netstat -ano | findstr :{port}", shell=True, text=True)
            for line in out.strip().split("\n"):
                parts = line.split()
                if len(parts) >= 5 and "LISTENING" in line:
                    pid = parts[-1]
                    subprocess.run(f"taskkill /F /PID {pid}", shell=True, capture_output=True)
        except Exception:
            pass
    else:
        try:
            subprocess.run(f"fuser -k {port}/tcp", shell=True, capture_output=True)
        except Exception:
            pass

def wait_for_http(url: str, timeout: float = 20.0, method: str = "GET", post_data: dict = None) -> bool:
    """Poll an HTTP/RPC endpoint until it returns a successful response."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            data_bytes = json.dumps(post_data).encode("utf-8") if post_data else None
            headers = {"Content-Type": "application/json"} if post_data else {}
            req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
            with urllib.request.urlopen(req, timeout=1.0) as resp:
                if resp.status in (200, 204):
                    return True
        except Exception:
            time.sleep(0.4)
    return False

def terminate_process(proc, name="Service"):
    """Cross-platform safe termination of child process trees."""
    if not proc or proc.poll() is not None:
        return
    try:
        if sys.platform == "win32":
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
        else:
            os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
            time.sleep(0.2)
            if proc.poll() is None:
                os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
    except Exception:
        try:
            proc.terminate()
        except Exception:
            pass

def cleanup_all():
    """Shutdown all running child services cleanly."""
    global shutdown_initiated
    if shutdown_initiated:
        return
    shutdown_initiated = True

    print(f"\n{Colors.YELLOW}🛑 Shutting down AgriChain services cleanly...{Colors.RESET}")
    for name, proc in list(processes.items()):
        print(f"   Stopping {name} (PID: {proc.pid})...")
        terminate_process(proc, name)

    # Double-check ports release
    time.sleep(0.5)
    print(f"{Colors.GREEN}✅ All services stopped. Goodbye!{Colors.RESET}\n")

def signal_handler(sig, frame):
    cleanup_all()
    sys.exit(0)

def main():
    parser = argparse.ArgumentParser(description="AgriChain Full-Stack Runner")
    parser.add_argument("--no-browser", action="store_true", help="Do not open web browser automatically")
    parser.add_argument("--no-seed", action="store_true", help="Skip demo dataset seeding on startup")
    parser.add_argument("--simulator", action="store_true", help="Also launch IoT hardware telemetry simulator")
    parser.add_argument("--kill-ports", action="store_true", help="Force-kill any processes occupying ports 8545, 8000, 3000")
    args = parser.parse_args()

    # Register exit handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    print_banner()

    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    python_bin = find_python_executable()
    npx_bin = find_cli_tool("npx")
    npm_bin = find_cli_tool("npm")

    print(f"{Colors.BOLD}🔍 Pre-Flight Environment Inspection:{Colors.RESET}")
    print(f"   • Python Runtime : {Colors.CYAN}{python_bin}{Colors.RESET}")
    print(f"   • Node Package   : {Colors.CYAN}{npx_bin}{Colors.RESET} / {Colors.CYAN}{npm_bin}{Colors.RESET}")
    print(f"   • Root Directory : {Colors.DIM}{ROOT_DIR}{Colors.RESET}")

    # Check dependencies existence
    if not (FRONTEND_DIR / "node_modules").exists():
        print(f"\n{Colors.YELLOW}⚠️  Warning: frontend/node_modules not found. Running 'npm install' in frontend/...{Colors.RESET}")
        subprocess.run([npm_bin, "install"], cwd=str(FRONTEND_DIR), check=True)

    if not (CONTRACTS_DIR / "node_modules").exists():
        print(f"\n{Colors.YELLOW}⚠️  Warning: contracts/node_modules not found. Running 'npm install' in contracts/...{Colors.RESET}")
        subprocess.run([npm_bin, "install"], cwd=str(CONTRACTS_DIR), check=True)

    # Port checks
    ports_to_check = [(8545, "Hardhat Blockchain Node"), (8000, "FastAPI Backend"), (3000, "Vite Frontend")]
    for port, service_name in ports_to_check:
        if is_port_in_use(port):
            if args.kill_ports:
                print(f"{Colors.YELLOW}⚡ Port {port} ({service_name}) is occupied. Force-clearing...{Colors.RESET}")
                kill_port(port)
                time.sleep(0.5)
            else:
                print(f"\n{Colors.RED}❌ Error: Port {port} ({service_name}) is already in use!{Colors.RESET}")
                print(f"   Run with {Colors.BOLD}--kill-ports{Colors.RESET} or stop the conflicting process first.")
                sys.exit(1)

    print(f"\n{Colors.BOLD}🚀 Launching AgriChain Subsystems:{Colors.RESET}")

    # =========================================================================
    # Step 1: Start Hardhat Local Blockchain Node (Port 8545)
    # =========================================================================
    print(f"\n1. {Colors.CYAN}Starting Hardhat Local Blockchain Node (Port 8545)...{Colors.RESET}")
    hardhat_log = open(LOGS_DIR / "hardhat.log", "w", encoding="utf-8")
    
    popen_kwargs = {"cwd": str(CONTRACTS_DIR), "stdout": hardhat_log, "stderr": hardhat_log}
    if sys.platform != "win32":
        popen_kwargs["preexec_fn"] = os.setsid
    else:
        popen_kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP

    proc_hardhat = subprocess.Popen([npx_bin, "hardhat", "node"], **popen_kwargs)
    processes["Hardhat Blockchain Node"] = proc_hardhat

    # Poll Hardhat RPC readiness
    rpc_ready = wait_for_http(
        "http://127.0.0.1:8545",
        timeout=15.0,
        method="POST",
        post_data={"jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 1}
    )
    if not rpc_ready:
        print(f"{Colors.RED}❌ Failed to connect to Hardhat local node within 15s. Check logs/hardhat.log{Colors.RESET}")
        cleanup_all()
        sys.exit(1)
    print(f"   {Colors.GREEN}✔ Hardhat RPC is online (http://127.0.0.1:8545){Colors.RESET}")

    # =========================================================================
    # Step 2: Deploy Modular Smart Contracts
    # =========================================================================
    print(f"\n2. {Colors.CYAN}Deploying Modular Smart Contracts to Local Node...{Colors.RESET}")
    deploy_cmd = [npx_bin, "hardhat", "run", "scripts/deploy_amoy.cjs", "--network", "localhost"]
    dep_res = subprocess.run(deploy_cmd, cwd=str(CONTRACTS_DIR), capture_output=True, text=True)
    if dep_res.returncode != 0:
        print(f"{Colors.RED}❌ Contract deployment failed:{Colors.RESET}\n{dep_res.stderr or dep_res.stdout}")
        cleanup_all()
        sys.exit(1)
    print(f"   {Colors.GREEN}✔ Deployed: ProductRegistry, CustodyTransfer, ColdChainMonitor, PolicyConfig{Colors.RESET}")
    print(f"   {Colors.GREEN}✔ Granted supply chain roles & seeded initial crop policies{Colors.RESET}")

    # =========================================================================
    # Step 3: Start FastAPI Backend & AI Trust Layer (Port 8000)
    # =========================================================================
    print(f"\n3. {Colors.CYAN}Starting FastAPI REST Backend & AI Trust Layer (Port 8000)...{Colors.RESET}")
    backend_log = open(LOGS_DIR / "backend.log", "w", encoding="utf-8")
    
    popen_kwargs_backend = {"cwd": str(BACKEND_DIR), "stdout": backend_log, "stderr": backend_log}
    if sys.platform != "win32":
        popen_kwargs_backend["preexec_fn"] = os.setsid
    else:
        popen_kwargs_backend["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP

    backend_cmd = [python_bin, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
    proc_backend = subprocess.Popen(backend_cmd, **popen_kwargs_backend)
    processes["FastAPI Backend"] = proc_backend

    backend_ready = wait_for_http("http://127.0.0.1:8000/docs", timeout=15.0)
    if not backend_ready:
        print(f"{Colors.RED}❌ Failed to start FastAPI backend within 15s. Check logs/backend.log{Colors.RESET}")
        cleanup_all()
        sys.exit(1)
    print(f"   {Colors.GREEN}✔ FastAPI & AI Trust Layer online (http://localhost:8000){Colors.RESET}")

    # =========================================================================
    # Step 4: Seed Demo Dataset
    # =========================================================================
    if not args.no_seed:
        print(f"\n4. {Colors.CYAN}Seeding Optimal Demonstration Dataset Across Roles...{Colors.RESET}")
        try:
            req = urllib.request.Request("http://127.0.0.1:8000/admin/seed-demo-data", data=b"{}", headers={"Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req, timeout=10.0) as resp:
                seed_data = json.loads(resp.read().decode("utf-8"))
                batches_count = seed_data.get("batches_seeded", 11)
                print(f"   {Colors.GREEN}✔ Seeded {batches_count} produce batches, condition events & custody trails{Colors.RESET}")
        except Exception as e:
            print(f"   {Colors.YELLOW}⚠️  Demo seeding notice: {e} (Continuing with live database){Colors.RESET}")

    # =========================================================================
    # Step 5: Start Vite + React 18 Frontend (Port 3000)
    # =========================================================================
    print(f"\n5. {Colors.CYAN}Starting Vite + React 18 Web Client (Port 3000)...{Colors.RESET}")
    frontend_log = open(LOGS_DIR / "frontend.log", "w", encoding="utf-8")
    
    popen_kwargs_frontend = {"cwd": str(FRONTEND_DIR), "stdout": frontend_log, "stderr": frontend_log}
    if sys.platform != "win32":
        popen_kwargs_frontend["preexec_fn"] = os.setsid
    else:
        popen_kwargs_frontend["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP

    frontend_cmd = [npm_bin, "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
    proc_frontend = subprocess.Popen(frontend_cmd, **popen_kwargs_frontend)
    processes["Vite Frontend"] = proc_frontend

    frontend_ready = wait_for_http("http://localhost:3000", timeout=20.0)
    if frontend_ready:
        print(f"   {Colors.GREEN}✔ Web application ready at http://localhost:3000{Colors.RESET}")
    else:
        print(f"   {Colors.YELLOW}⏳ Frontend warming up... (Check logs/frontend.log){Colors.RESET}")

    # Optional simulator
    if args.simulator:
        print(f"\n6. {Colors.CYAN}Launching IoT Telemetry Simulator in background...{Colors.RESET}")
        sim_log = open(LOGS_DIR / "simulator.log", "w", encoding="utf-8")
        sim_kwargs = {"cwd": str(ROOT_DIR), "stdout": sim_log, "stderr": sim_log}
        if sys.platform != "win32":
            sim_kwargs["preexec_fn"] = os.setsid
        else:
            sim_kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
        proc_sim = subprocess.Popen([python_bin, "hardware/simulate_esp32.py", "--mode", "demo"], **sim_kwargs)
        processes["IoT Simulator"] = proc_sim
        print(f"   {Colors.GREEN}✔ IoT Telemetry streaming to /telemetry{Colors.RESET}")

    # =========================================================================
    # Ready Dashboard & Summary
    # =========================================================================
    print(f"""
{Colors.GREEN}{Colors.BOLD}==============================================================================
   🎉  ALL AGRICHAIN SUBSYSTEMS ARE ACTIVE & RUNNING CONCURRENTLY!
=============================================================================={Colors.RESET}
   {Colors.BOLD}Core Service Endpoints:{Colors.RESET}
   • 🌐 Web Application      : {Colors.CYAN}{Colors.BOLD}http://localhost:3000{Colors.RESET}
   • ⚡ REST API & AI Gate    : {Colors.CYAN}http://localhost:8000{Colors.RESET} (Docs: {Colors.DIM}http://localhost:8000/docs{Colors.RESET})
   • ⛓️  Hardhat Local Node    : {Colors.CYAN}http://127.0.0.1:8545{Colors.RESET} (Chain ID: 31337)

   {Colors.BOLD}Role Portals (Accessible via Top Navigation or Role Switcher):{Colors.RESET}
   • 🌾 {Colors.BOLD}Farmer Portal{Colors.RESET}        : http://localhost:3000  (Produce batch registration & AI trust)
   • 🚚 {Colors.BOLD}Logistics Partner{Colors.RESET}    : http://localhost:3000  (Cold-chain telematics & dispatch)
   • 🏬 {Colors.BOLD}Dark Store GRN{Colors.RESET}       : http://localhost:3000  (AI Trust inbound receiving gate)
   • 🛒 {Colors.BOLD}Consumer Provenance{Colors.RESET} : http://localhost:3000  (QR journey lookup & price trail)
   • 🛡️  {Colors.BOLD}Master Admin{Colors.RESET}        : http://localhost:3000  (Circuit breaker & IsoLog audit)
   • 👁️  {Colors.BOLD}Omniscient God Mode{Colors.RESET} : http://localhost:3000  (Full supply chain showcase)

   {Colors.BOLD}Interactive Controls:{Colors.RESET}
   • Press {Colors.RED}{Colors.BOLD}[Ctrl+C]{Colors.RESET} to stop all services cleanly.
   • Background service logs are written to {Colors.DIM}{LOGS_DIR}/{Colors.RESET}
""")

    if not args.no_browser:
        time.sleep(0.5)
        webbrowser.open("http://localhost:3000")

    # Monitor loop
    try:
        while True:
            # Check if any process died unexpectedly
            for name, proc in list(processes.items()):
                if proc.poll() is not None:
                    print(f"\n{Colors.RED}⚠️  Alert: {name} terminated unexpectedly with code {proc.returncode}!{Colors.RESET}")
                    cleanup_all()
                    sys.exit(1)
            time.sleep(1.0)
    except KeyboardInterrupt:
        cleanup_all()

if __name__ == "__main__":
    main()
