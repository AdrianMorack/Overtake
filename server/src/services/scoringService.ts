import prisma from "../config/database";

interface PointBreakdown {
  qualiFirst: number;
  qualiSecond: number;
  qualiThird: number;
  raceFirst: number;
  raceSecond: number;
  raceThird: number;
  fastestLap: number;
  topTeam: number;
}

/**
 * Scoring rules:
 *
 * Qualifying Top 3:  1st correct = 3pts, 2nd correct = 2pts, 3rd correct = 1pt
 * Race Top 3:        1st correct = 3pts, 2nd correct = 2pts, 3rd correct = 1pt
 * Fastest Lap:       Correct = 2pts
 * Top Team:          Correct = 1pt
 *
 * Maximum per race: 3 + 2 + 1 + 3 + 2 + 1 + 2 + 1 = 15 points
 */
function calculateBreakdown(
  prediction: {
    qualiFirst: string; qualiSecond: string; qualiThird: string;
    raceFirst: string; raceSecond: string; raceThird: string;
    fastestLap: string; topTeam: string;
  },
  result: {
    qualiFirst: string; qualiSecond: string; qualiThird: string;
    raceFirst: string; raceSecond: string; raceThird: string;
    fastestLap: string; topTeam: string;
  }
): PointBreakdown {
  const norm = (s: string) => s.trim().toUpperCase();

  return {
    qualiFirst:  norm(prediction.qualiFirst)  === norm(result.qualiFirst) ? 3 : 0,
    qualiSecond: norm(prediction.qualiSecond) === norm(result.qualiSecond) ? 2 : 0,
    qualiThird:  norm(prediction.qualiThird)  === norm(result.qualiThird) ? 1 : 0,
    raceFirst:   norm(prediction.raceFirst)   === norm(result.raceFirst) ? 3 : 0,
    raceSecond:  norm(prediction.raceSecond)  === norm(result.raceSecond) ? 2 : 0,
    raceThird:   norm(prediction.raceThird)   === norm(result.raceThird) ? 1 : 0,
    fastestLap:  norm(prediction.fastestLap)  === norm(result.fastestLap) ? 2 : 0,
    topTeam:     norm(prediction.topTeam)     === norm(result.topTeam) ? 1 : 0,
  };
}

/**
 * Score all predictions for a given race weekend.
 * Called after official results are stored.
 */
export async function scoreRace(raceWeekendId: string): Promise<number> {
  const result = await prisma.raceResult.findUnique({
    where: { raceWeekendId },
  });
  if (!result) throw new Error("No results available for this race");

  const predictions = await prisma.prediction.findMany({
    where: { raceWeekendId },
  });

  let scored = 0;

  for (const prediction of predictions) {
    const breakdown = calculateBreakdown(prediction, result);
    const totalPoints = Object.values(breakdown).reduce((a, b) => a + b, 0);

    await prisma.prediction.update({
      where: { id: prediction.id },
      data: { totalPoints, breakdown },
    });
    scored++;
  }

  // Mark race as completed
  await prisma.raceWeekend.update({
    where: { id: raceWeekendId },
    data: { status: "COMPLETED" },
  });

  console.log(`[Scoring] Scored ${scored} predictions for race ${raceWeekendId}`);
  return scored;
}
