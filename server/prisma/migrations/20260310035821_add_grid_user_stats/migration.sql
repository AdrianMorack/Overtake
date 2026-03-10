-- CreateTable
CREATE TABLE "grid_user_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "grid_id" TEXT NOT NULL,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "races_played" INTEGER NOT NULL DEFAULT 0,
    "best_finish" INTEGER,
    "average_points" DOUBLE PRECISION,
    "perfect_scores" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grid_user_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grid_user_stats_grid_id_idx" ON "grid_user_stats"("grid_id");

-- CreateIndex
CREATE INDEX "grid_user_stats_grid_id_total_points_idx" ON "grid_user_stats"("grid_id", "total_points");

-- CreateIndex
CREATE UNIQUE INDEX "grid_user_stats_user_id_grid_id_key" ON "grid_user_stats"("user_id", "grid_id");
