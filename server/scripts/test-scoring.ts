/**
 * test-scoring.ts
 * Run with: npx tsx scripts/test-scoring.ts [raceWeekendId]
 *
 * - With no args: runs a unit test against the scoring logic with known fixtures.
 * - With a raceWeekendId: scores that race for real against the DB and prints a
 *   per-user breakdown table. Useful to verify results before committing.
 */

import dotenv from "dotenv";
dotenv.config();

import prisma from "../src/config/database";

// ─── Scoring logic (mirrors scoringService.ts) ────────────────────────────────

const norm = (s: string) => s.trim().toUpperCase();

function calculateBreakdown(
  prediction: Record<string, string>,
  result: Record<string, string>
) {
  const qualiPodium = [norm(result.qualiFirst), norm(result.qualiSecond), norm(result.qualiThird)];
  const racePodium  = [norm(result.raceFirst),  norm(result.raceSecond),  norm(result.raceThird)];

  const podiumScore = (predicted: string, exact: string, podium: string[]) => {
    const n = norm(predicted);
    if (n === norm(exact)) return 3;
    if (podium.includes(n)) return 1;
    return 0;
  };

  return {
    qualiFirst:  podiumScore(prediction.qualiFirst,  result.qualiFirst,  qualiPodium),
    qualiSecond: podiumScore(prediction.qualiSecond, result.qualiSecond, qualiPodium),
    qualiThird:  podiumScore(prediction.qualiThird,  result.qualiThird,  qualiPodium),
    raceFirst:   podiumScore(prediction.raceFirst,   result.raceFirst,   racePodium),
    raceSecond:  podiumScore(prediction.raceSecond,  result.raceSecond,  racePodium),
    raceThird:   podiumScore(prediction.raceThird,   result.raceThird,   racePodium),
    fastestLap:  norm(prediction.fastestLap) === norm(result.fastestLap) ? 2 : 0,
    topTeam:     norm(prediction.topTeam)    === norm(result.topTeam)    ? 1 : 0,
  };
}

function total(b: Record<string, number>) {
  return Object.values(b).reduce((a, c) => a + c, 0);
}

// ─── Unit tests ───────────────────────────────────────────────────────────────

function runUnitTests() {
  let passed = 0;
  let failed = 0;

  function assert(label: string, actual: number, expected: number) {
    if (actual === expected) {
      console.log(`  ✅  ${label}: ${actual}`);
      passed++;
    } else {
      console.error(`  ❌  ${label}: got ${actual}, expected ${expected}`);
      failed++;
    }
  }

  const result = {
    qualiFirst: "VER", qualiSecond: "LEC", qualiThird: "NOR",
    raceFirst: "VER", raceSecond: "PIA", raceThird: "LEC",
    fastestLap: "HAM", topTeam: "McLaren",
  };

  console.log("\n── Test 1: Perfect score ──────────────────────────────────");
  const perfect = calculateBreakdown(result, result);
  assert("qualiFirst (3pts)",  perfect.qualiFirst,  3);
  assert("qualiSecond (3pts)", perfect.qualiSecond, 3);
  assert("qualiThird (3pts)",  perfect.qualiThird,  3);
  assert("raceFirst (3pts)",   perfect.raceFirst,   3);
  assert("raceSecond (3pts)",  perfect.raceSecond,  3);
  assert("raceThird (3pts)",   perfect.raceThird,   3);
  assert("fastestLap (2pts)",  perfect.fastestLap,  2);
  assert("topTeam (1pt)",      perfect.topTeam,     1);
  assert("total (21pts)",      total(perfect),      21);

  console.log("\n── Test 2: All wrong ──────────────────────────────────");
  const wrong = calculateBreakdown(
    { qualiFirst: "HAM", qualiSecond: "RUS", qualiThird: "SAI",
      raceFirst: "ALO", raceSecond: "STR", raceThird: "TSU",
      fastestLap: "BOT", topTeam: "Ferrari" },
    result
  );
  assert("total (0pts)", total(wrong), 0);

  console.log("\n── Test 3: Case insensitive / whitespace ──────────────────");
  const fuzzy = calculateBreakdown(
    { qualiFirst: " ver ", qualiSecond: " lec ", qualiThird: " nor ",
      raceFirst: " ver ", raceSecond: " pia ", raceThird: " lec ",
      fastestLap: " ham ", topTeam: " mclaren " },
    result
  );
  assert("total (21pts, fuzzy)", total(fuzzy), 21);

  console.log("\n── Test 4: Podium-but-wrong-slot (1pt each) ───────────────");
  // Swap NOR/LEC in quali prediction — both are in podium but wrong slot.
  // Swap LEC/VER in race prediction — both are in podium but wrong slot.
  const podiumSwap = calculateBreakdown(
    { qualiFirst: "VER", qualiSecond: "NOR", qualiThird: "LEC",   // NOR→1, LEC→1
      raceFirst: "LEC", raceSecond: "PIA", raceThird: "VER",      // LEC→1, PIA→3, VER→1
      fastestLap: "HAM", topTeam: "Ferrari" },
    result
  );
  // qualiFirst=3, qualiSecond=1, qualiThird=1
  // raceFirst=1, raceSecond=3, raceThird=1, fastestLap=2, topTeam=0 → total=12
  assert("qualiSecond (NOR in podium, wrong slot → 1pt)", podiumSwap.qualiSecond, 1);
  assert("qualiThird  (LEC in podium, wrong slot → 1pt)", podiumSwap.qualiThird,  1);
  assert("raceFirst   (LEC in podium, wrong slot → 1pt)", podiumSwap.raceFirst,   1);
  assert("raceThird   (VER in podium, wrong slot → 1pt)", podiumSwap.raceThird,   1);
  assert("total (12pts, podium-swap)", total(podiumSwap), 12);

  console.log("\n── Test 5: Not-in-podium scores 0 ────────────────────────");
  const noPoints = calculateBreakdown(
    { qualiFirst: "HAM", qualiSecond: "RUS", qualiThird: "SAI",
      raceFirst:  "ALO", raceSecond: "STR", raceThird:  "TSU",
      fastestLap: "BOT", topTeam: "Ferrari" },
    result
  );
  assert("total (0pts, none in podium)", total(noPoints), 0);

  console.log(`\n─────────────────────────────────────────────────────────`);
  console.log(`Unit tests: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

// ─── Live DB scoring preview ──────────────────────────────────────────────────

async function previewRaceScoring(raceWeekendId: string) {
  console.log(`\nFetching data for race: ${raceWeekendId}`);

  const race = await prisma.raceWeekend.findUnique({
    where: { id: raceWeekendId },
    include: { results: true },
  });

  if (!race) {
    console.error("❌  Race weekend not found.");
    process.exit(1);
  }

  console.log(`\n  Race: ${race.raceName} (Round ${race.round})`);
  console.log(`  Status: ${race.status}`);

  if (!race.results) {
    console.error("❌  No results stored for this race yet.");
    process.exit(1);
  }

  const r = race.results;
  console.log(`\n  Official Results:`);
  console.log(`    Quali:  ${r.qualiFirst} | ${r.qualiSecond} | ${r.qualiThird}`);
  console.log(`    Race:   ${r.raceFirst} | ${r.raceSecond} | ${r.raceThird}`);
  console.log(`    FL: ${r.fastestLap}  Top Team: ${r.topTeam}`);

  const predictions = await prisma.prediction.findMany({
    where: { raceWeekendId },
    include: { user: true },
  });

  if (predictions.length === 0) {
    console.log("\n  No predictions found for this race.");
    return;
  }

  // Widen results to plain Record for reuse of calculateBreakdown
  const resultRecord: Record<string, string> = {
    qualiFirst: r.qualiFirst, qualiSecond: r.qualiSecond, qualiThird: r.qualiThird,
    raceFirst: r.raceFirst,   raceSecond: r.raceSecond,   raceThird: r.raceThird,
    fastestLap: r.fastestLap, topTeam: r.topTeam,
  };

  console.log(`\n${"─".repeat(90)}`);
  console.log(
    `  ${"User".padEnd(18)} ${"Q1".padEnd(6)} ${"Q2".padEnd(6)} ${"Q3".padEnd(6)}` +
    ` ${"R1".padEnd(6)} ${"R2".padEnd(6)} ${"R3".padEnd(6)} ${"FL".padEnd(6)} ${"TT".padEnd(6)} ${"PTS"}`
  );
  console.log(`${"─".repeat(90)}`);

  for (const p of predictions) {
    const b = calculateBreakdown(
      {
        qualiFirst: p.qualiFirst, qualiSecond: p.qualiSecond, qualiThird: p.qualiThird,
        raceFirst: p.raceFirst,   raceSecond: p.raceSecond,   raceThird: p.raceThird,
        fastestLap: p.fastestLap, topTeam: p.topTeam,
      },
      resultRecord
    );
    const pts = total(b);
    const mark = (v: number) => (v > 0 ? "✅" : "❌");
    console.log(
      `  ${p.user.username.padEnd(18)} ${mark(b.qualiFirst).padEnd(6)} ${mark(b.qualiSecond).padEnd(6)} ${mark(b.qualiThird).padEnd(6)}` +
      ` ${mark(b.raceFirst).padEnd(6)} ${mark(b.raceSecond).padEnd(6)} ${mark(b.raceThird).padEnd(6)} ${mark(b.fastestLap).padEnd(6)} ${mark(b.topTeam).padEnd(6)} ${pts}`
    );
  }
  console.log(`${"─".repeat(90)}`);
  console.log(`  Total predictions: ${predictions.length}\n`);
}

// ─── Entry point ─────────────────────────────────────────────────────────────

async function main() {
  const raceId = process.argv[2];

  if (!raceId) {
    console.log("Running unit tests (no raceWeekendId provided)…\n");
    runUnitTests();
  } else {
    await previewRaceScoring(raceId);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
