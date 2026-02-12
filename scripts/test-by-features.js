#!/usr/bin/env node
/**
 * Test-by-features: run the test suite and report how to use the features master list.
 * Usage:
 *   node scripts/test-by-features.js           → run all tests, then print guide
 *   node scripts/test-by-features.js --list    → list feature IDs and their test files (no test run)
 *   node scripts/test-by-features.js <ID>      → run only tests mapped to feature ID (e.g. LOC-001)
 */

import { readFileSync } from "fs";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const mapPath = join(root, "docs/features-test-map.json");

function loadMap() {
  try {
    const raw = readFileSync(mapPath, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Could not read docs/features-test-map.json:", e.message);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const listOnly = args.includes("--list");
const featureId = args.find((a) => !a.startsWith("--") && /^[A-Z]+-[0-9]+$/.test(a));

if (listOnly) {
  const map = loadMap();
  const featureToTests = map.featureToTests || {};
  console.log("Feature ID → Test file(s)\n");
  for (const [id, entries] of Object.entries(featureToTests)) {
    const files = [...new Set((entries || []).map((e) => e.file))];
    console.log(`${id}: ${files.join(", ")}`);
  }
  console.log("\nFull list: docs/features-master-list.md");
  process.exit(0);
}

if (featureId) {
  const map = loadMap();
  const entries = (map.featureToTests || {})[featureId];
  if (!entries || entries.length === 0) {
    console.error(`No test mapping for feature ${featureId}. See docs/features-test-map.json`);
    process.exit(1);
  }
  const uniqueFiles = [...new Set(entries.map((e) => e.file))];
  const result = spawnSync("npx", ["vitest", "run", ...uniqueFiles], {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });
  process.exit(result.status ?? 1);
}

// Default: run full suite
const result = spawnSync("npm", ["test"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

if (result.status === 0) {
  console.log("\n--- Feature test guide ---");
  console.log("Expected outputs for every feature: docs/features-master-list.md");
  console.log("Feature → test mapping: docs/features-test-map.json");
  console.log("List mapped features: node scripts/test-by-features.js --list");
  console.log("Run tests for one feature: node scripts/test-by-features.js <ID> (e.g. LOC-001)");
}

process.exit(result.status ?? 1);
