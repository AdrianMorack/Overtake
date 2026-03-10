-- CreateEnum
CREATE TYPE "RaceStatus" AS ENUM ('UPCOMING', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grids" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" CHAR(6) NOT NULL,
    "owner_id" TEXT NOT NULL,
    "season" INTEGER NOT NULL DEFAULT 2025,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grid_memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "grid_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grid_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "external_id" INTEGER,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "team_id" TEXT,
    "headshot_url" TEXT,
    "season" INTEGER NOT NULL DEFAULT 2025,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "external_id" INTEGER,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "season" INTEGER NOT NULL DEFAULT 2025,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "race_weekends" (
    "id" TEXT NOT NULL,
    "external_id" INTEGER,
    "quali_session_key" INTEGER,
    "season" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "race_name" TEXT NOT NULL,
    "circuit_name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "race_date" TIMESTAMP(3) NOT NULL,
    "qualifying_date" TIMESTAMP(3),
    "predictions_lock" TIMESTAMP(3) NOT NULL,
    "status" "RaceStatus" NOT NULL DEFAULT 'UPCOMING',

    CONSTRAINT "race_weekends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "race_results" (
    "id" TEXT NOT NULL,
    "race_weekend_id" TEXT NOT NULL,
    "quali_first" TEXT NOT NULL,
    "quali_second" TEXT NOT NULL,
    "quali_third" TEXT NOT NULL,
    "race_first" TEXT NOT NULL,
    "race_second" TEXT NOT NULL,
    "race_third" TEXT NOT NULL,
    "fastest_lap" TEXT NOT NULL,
    "top_team" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "race_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "race_weekend_id" TEXT NOT NULL,
    "grid_id" TEXT NOT NULL,
    "quali_first" TEXT NOT NULL,
    "quali_second" TEXT NOT NULL,
    "quali_third" TEXT NOT NULL,
    "race_first" TEXT NOT NULL,
    "race_second" TEXT NOT NULL,
    "race_third" TEXT NOT NULL,
    "fastest_lap" TEXT NOT NULL,
    "top_team" TEXT NOT NULL,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "breakdown" JSONB,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "grids_code_key" ON "grids"("code");

-- CreateIndex
CREATE UNIQUE INDEX "grid_memberships_user_id_grid_id_key" ON "grid_memberships"("user_id", "grid_id");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_external_id_key" ON "drivers"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "teams_external_id_key" ON "teams"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "race_weekends_external_id_key" ON "race_weekends"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "race_weekends_season_round_key" ON "race_weekends"("season", "round");

-- CreateIndex
CREATE UNIQUE INDEX "race_results_race_weekend_id_key" ON "race_results"("race_weekend_id");

-- CreateIndex
CREATE INDEX "predictions_grid_id_idx" ON "predictions"("grid_id");

-- CreateIndex
CREATE UNIQUE INDEX "predictions_user_id_race_weekend_id_grid_id_key" ON "predictions"("user_id", "race_weekend_id", "grid_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grid_memberships" ADD CONSTRAINT "grid_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grid_memberships" ADD CONSTRAINT "grid_memberships_grid_id_fkey" FOREIGN KEY ("grid_id") REFERENCES "grids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_results" ADD CONSTRAINT "race_results_race_weekend_id_fkey" FOREIGN KEY ("race_weekend_id") REFERENCES "race_weekends"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_race_weekend_id_fkey" FOREIGN KEY ("race_weekend_id") REFERENCES "race_weekends"("id") ON DELETE CASCADE ON UPDATE CASCADE;
