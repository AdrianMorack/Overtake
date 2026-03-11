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
  [key: string]: number;
}

/**
 * Scoring rules:
 *
 * Qualifying Top 3:  Exact position = 3pts | In podium, wrong slot = 1pt
 * Race Top 3:        Exact position = 3pts | In podium, wrong slot = 1pt
 * Fastest Lap:       Correct = 2pts
 * Top Team:          Correct = 1pt
 *
 * Maximum per race: 3×3 + 3×3 + 2 + 1 = 21 points
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
