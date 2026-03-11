/**
 * db-dump.ts
 * Exports all key tables to JSON and writes them under server/backups/
 * Run with: npx tsx scripts/db-dump.ts
 *
 * Output: server/backups/dump-<ISO-timestamp>/
 *   users.json
 *   grids.json
 *   gridMemberships.json
 *   gridUserStats.json
 *   raceWeekends.json
 *   predictions.json
 *   raceResults.json
 *   drivers.json
 *   teams.json
 *
 * The backups/ directory is kept in .gitignore so credentials
 * and PII from the DB stay off version control.
 */

import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import prisma from "../src/config/database";

const BACKUPS_DIR = path.resolve(__dirname, "../backups");

async function dump() {
  // Create timestamped directory
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(BACKUPS_DIR, `dump-${ts}`);
  fs.mkdirSync(dir, { recursive: true });

  console.log(`\nDumping database → ${dir}\n`);

  const write = (name: string, data: unknown[]) => {
    const file = path.join(dir, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
    console.log(`  ✅  ${name}.json  (${data.length} rows)`);
  };

  // Fetch all tables (fine for dev/small DBs; for large DBs add pagination)
  const [
    users,
    grids,
    gridMemberships,
    gridUserStats,
    raceWeekends,
    predictions,
    raceResults,
    drivers,
    teams,
  ] = await Promise.all([
    prisma.user.findMany({
      // Omit password hash and refresh tokens from dump
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.grid.findMany(),
    prisma.gridMembership.findMany(),
    prisma.gridUserStats.findMany(),
    prisma.raceWeekend.findMany(),
    prisma.prediction.findMany(),
    prisma.raceResult.findMany(),
    prisma.driver.findMany(),
    prisma.team.findMany(),
  ]);

  write("users",          users);
  write("grids",          grids);
  write("gridMemberships", gridMemberships);
  write("gridUserStats",  gridUserStats);
  write("raceWeekends",   raceWeekends);
  write("predictions",    predictions);
  write("raceResults",    raceResults);
  write("drivers",        drivers);
  write("teams",          teams);

  // Write a manifest
  const manifest = {
    dumped_at: new Date().toISOString(),
    tables: {
      users: users.length,
      grids: grids.length,
      gridMemberships: gridMemberships.length,
      gridUserStats: gridUserStats.length,
      raceWeekends: raceWeekends.length,
      predictions: predictions.length,
      raceResults: raceResults.length,
      drivers: drivers.length,
      teams: teams.length,
    },
  };
  const manifestFile = path.join(dir, "manifest.json");
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`\n  📋  manifest.json  written`);

  const total = Object.values(manifest.tables).reduce((a, c) => a + c, 0);
  console.log(`\nDone. ${total} total rows dumped to:\n  ${dir}\n`);

  // List (and optionally prune) old dumps — keep the 10 most recent
  const existing = fs
    .readdirSync(BACKUPS_DIR)
    .filter((f) => f.startsWith("dump-"))
    .sort()
    .reverse();
  if (existing.length > 10) {
    const toDelete = existing.slice(10);
    for (const old of toDelete) {
      fs.rmSync(path.join(BACKUPS_DIR, old), { recursive: true, force: true });
      console.log(`  🗑️   Pruned old dump: ${old}`);
    }
  }
}

async function main() {
  await dump();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Dump failed:", e.message ?? e);
  prisma.$disconnect();
  process.exit(1);
});
