#!/usr/bin/env node
/**
 * sync-server-version.mjs — keep server.json version in lockstep with package.json.
 *
 * server.json is the MCP registry manifest. Its `version` (root) and
 * `packages[].version` must match package.json `version`, otherwise the
 * registry entry advertises a stale release. server.json is NOT in the npm
 * tarball (package.json `files[]` excludes it), so drift only affects the
 * MCP registry — but we keep it consistent at the source.
 *
 * Modes:
 *   (default)   Rewrite server.json to match package.json. Exits 0.
 *   --check     Verify only; exit 1 with a diff message if drift is found.
 *               Used by CI / the test job to gate publish on consistency.
 *
 * Usage:
 *   node scripts/sync-server-version.mjs          # fix
 *   node scripts/sync-server-version.mjs --check  # verify (CI)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkgPath = join(repoRoot, 'package.json');
const serverPath = join(repoRoot, 'server.json');

const checkOnly = process.argv.includes('--check');

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const targetVersion = pkg.version;
if (!targetVersion) {
  console.error('[sync-server-version] package.json has no version field');
  process.exit(2);
}

const serverRaw = readFileSync(serverPath, 'utf8');
const server = JSON.parse(serverRaw);

const drift = [];
if (server.version !== targetVersion) {
  drift.push(`  root version: server.json=${server.version} package.json=${targetVersion}`);
}
if (Array.isArray(server.packages)) {
  server.packages.forEach((p, i) => {
    if (p.version !== targetVersion) {
      drift.push(`  packages[${i}].version: server.json=${p.version} package.json=${targetVersion}`);
    }
  });
}

if (drift.length === 0) {
  console.log(`[sync-server-version] OK — server.json matches package.json (${targetVersion})`);
  process.exit(0);
}

if (checkOnly) {
  console.error('[sync-server-version] DRIFT — server.json out of sync with package.json:');
  console.error(drift.join('\n'));
  console.error('\nRun: node scripts/sync-server-version.mjs');
  process.exit(1);
}

// Fix mode: rewrite preserving original formatting (2-space indent + trailing newline).
server.version = targetVersion;
if (Array.isArray(server.packages)) {
  for (const p of server.packages) p.version = targetVersion;
}
writeFileSync(serverPath, JSON.stringify(server, null, 2) + '\n');
console.log(`[sync-server-version] synced server.json to ${targetVersion}`);
