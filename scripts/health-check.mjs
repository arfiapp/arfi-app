#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

let failed = false;
const envKeys = [
  "NEXT_PUBLIC_KIT_KEY",
  "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"
];

console.log("Arc Swap saglik kontrolu\n");

if (!fs.existsSync("node_modules")) {
  console.log("✗ node_modules yok → npm install");
  failed = true;
} else {
  console.log("✓ node_modules");
}

if (!fs.existsSync(".env.local")) {
  console.log("⚠ .env.local yok → .env.example dosyasindan kopyalayin");
} else {
  console.log("✓ .env.local");
  const env = fs.readFileSync(".env.local", "utf8");
  for (const key of envKeys) {
    const m = env.match(new RegExp(`^${key}=(.+)$`, "m"));
    const val = m?.[1]?.trim() ?? "";
    if (!val) {
      console.log(`⚠ ${key} bos`);
    } else if (key.includes("KIT_KEY") && !val.startsWith("KIT_KEY:")) {
      console.log(`⚠ ${key} formati KIT_KEY:... olmali`);
    } else {
      console.log(`✓ ${key}`);
    }
  }

  const rpc = env.match(/^NEXT_PUBLIC_ARC_RPC=(.+)$/m)?.[1]?.trim() ?? "";
  const chainId = env.match(/^NEXT_PUBLIC_CHAIN_ID=(.+)$/m)?.[1]?.trim() ?? "";
  if (rpc.includes("rpc.arc.network") && !rpc.includes("testnet")) {
    console.log("⚠ NEXT_PUBLIC_ARC_RPC eski/yanlis — https://rpc.testnet.arc.network kullanin");
  } else if (rpc) {
    console.log(`✓ NEXT_PUBLIC_ARC_RPC (${rpc})`);
  }
  if (chainId && chainId !== "5042002") {
    console.log(`⚠ NEXT_PUBLIC_CHAIN_ID=${chainId} — 5042002 olmali`);
  } else if (chainId) {
    console.log("✓ NEXT_PUBLIC_CHAIN_ID=5042002");
  }
}

console.log("\nBaslat: npm run dev:clean");
process.exit(failed ? 1 : 0);
