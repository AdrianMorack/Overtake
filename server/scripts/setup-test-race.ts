/**
 * setup-test-race.ts
 * Creates (or refreshes) a test RaceWeekend in the DB that the live SSE
 * stream will treat as currently active.
 *
 * Run with: npx tsx scripts/setup-test-race.ts [--grid <gridId>]
 *
 * What it does:
 *   1. Upserts a RaceWeekend (season=9999, round=1, externalId=9999, raceDate=NOW)
 *   2. If --grid <gridId> is passed, lists that grid's members and optionally
 *      seeds starter predictions for them so the leaderboard has data to show.
 *   3. Prints the raceWeekendId and the URL to navigate to on the site.
 */

import dotenv from "dotenv";
dotenv.config();

import prisma from "../src/config/database";

const SESSION_KEY = 9999;

async function main() {
  const args     = process.argv.slice(2);
  const gridIdx  = args.indexOf("--grid");
  const gridId   = gridIdx !== -1 ? args[gridIdx + 1] : undefined;

  // ─── 1. Upsert the test race weekend ──────────────────────────────────────
  const now       = new Date();
  const lockTime  = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24h ago

  const raceWeekend = await prisma.raceWeekend.upsert({
    where:  { externalId: SESSION_KEY },
    update: {
      // Refresh raceDate to "now" so the 4-hour live window stays open
      raceDate: now,
      status:   "IN_PROGRESS",
    },
    create: {
      externalId:      SESSION_KEY,
      qualiSessionKey: SESSION_KEY,
      season:          9999,
      round:           1,
      raceName:        "Test Race (Mock)",
      circuitName:     "Overtake Test Circuit",
      country:         "Testonia",
      raceDate:        now,
      qualifyingDate:  new Date(now.getTime() - 90 * 60 * 1000), // 90min ago
      predictionsLock: lockTime,
      status:          "IN_PROGRESS",
    },
  });

  console.log("\n────────────────────────────────────────────────────");
  console.log(`  ✅  Test race weekend ready`);
  console.log(`  ID:   ${raceWeekend.id}`);
  console.log(`  Name: ${raceWeekend.raceName}`);
  console.log(`  Date: ${raceWeekend.raceDate.toISOString()}`);
  console.log("────────────────────────────────────────────────────\n");

  // ─── 2. Grid info + optional prediction seeding ───────────────────────────
  if (gridId) {
    const grid = await prisma.grid.findUnique({
      where: { id: gridId },
      include: { memberships: { include: { user: true } } },
    });

    if (!grid) {
      console.error(`  ❌  Grid "${gridId}" not found.`);
    } else {
      console.log(`  Grid: ${grid.name} (${grid.memberships.length} members)`);

      // Seed a minimal prediction for any member who doesn't have one yet
      // Uses mock drivers that match the mock-fastf1.ts roster
      const MOCK_PREDICTIONS = {
        qualiFirst:  "VER",
        qualiSecond: "NOR",
        qualiThird:  "LEC",
        raceFirst:   "VER",
        raceSecond:  "NOR",
        raceThird:   "LEC",
        fastestLap:  "HAM",
        topTeam:     "Red Bull Racing",
      };

      let seeded = 0;
      for (const m of grid.memberships) {
        const existing = await prisma.prediction.findFirst({
          where: { raceWeekendId: raceWeekend.id, userId: m.userId, gridId },
        });
        if (!existing) {
          await prisma.prediction.create({
            data: {
              raceWeekendId: raceWeekend.id,
              userId:        m.userId,
              gridId,
              ...MOCK_PREDICTIONS,
              totalPoints:   0,
            },
          });
          seeded++;
          console.log(`  + Seeded prediction for ${m.user.username}`);
        } else {
          console.log(`  • ${m.user.username} already has a prediction`);
        }
      }
      if (seeded > 0) console.log(`\n  Seeded ${seeded} placeholder prediction(s).`);
      console.log(`  (Predictions use default picks — edit in the UI for real testing)\n`);
    }
  }

  // ─── 3. Print navigation instructions ─────────────────────────────────────
  const clientPort = process.env.CLIENT_PORT ?? "3000";
  const liveUrl    = gridId
    ? `http://localhost:${clientPort}/grids/${gridId}/live/${raceWeekend.id}`
    : `http://localhost:${clientPort}/grids/<your-gridId>/live/${raceWeekend.id}`;

  console.log("  Next steps:");
  console.log("  ┌─ Terminal 1 ─────────────────────────────────────────────┐");
  console.log("  │  npx tsx scripts/mock-fastf1.ts                           │");
  console.log("  └───────────────────────────────────────────────────────────┘");
  console.log("  ┌─ Terminal 2 ─────────────────────────────────────────────┐");
  console.log("  │  FASTF1_BASE_URL=http://localhost:8199 npm run dev        │");
  console.log("  └───────────────────────────────────────────────────────────┘");
  console.log("  ┌─ Browser ─────────────────────────────────────────────────┐");
  console.log(`  │  Live race:  ${liveUrl}`);
  console.log(`  │  Dashboard:  http://localhost:8199/mock/dashboard`);
  console.log("  └───────────────────────────────────────────────────────────┘\n");

  await prisma.$disconnect();
}

main().catch(e => {
  console.error("❌", e.message ?? e);
  prisma.$disconnect();
  process.exit(1);
});
