const fs = require("fs");
const path = require("path");

const contracts = ["ProductRegistry", "CustodyTransfer", "ColdChainMonitor", "PolicyConfig"];
const artifactsDir = path.join(__dirname, "..", "artifacts", "contracts");
const outDir = path.join(__dirname, "..", "..", "backend", "modular-abis");

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

for (const name of contracts) {
  const artifactPath = path.join(artifactsDir, `${name}.sol`, `${name}.json`);
  if (fs.existsSync(artifactPath)) {
    const data = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    const abiPath = path.join(outDir, `${name}.json`);
    fs.writeFileSync(abiPath, JSON.stringify(data.abi, null, 2));
    console.log(`[OK] Exported ABI for ${name} -> ${abiPath}`);
  } else {
    console.error(`Artifact missing for ${name} at ${artifactPath}`);
  }
}
