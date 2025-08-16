-- Initialize the DSA Practice Tracker database schema
-- This script creates the necessary tables and indexes

-- Create enum types
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE "ProgressStatus" AS ENUM ('DONE', 'NOT_DONE');
CREATE TYPE "ChangeType" AS ENUM ('NEW', 'UPDATED', 'DELETED');

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create questions table
CREATE TABLE IF NOT EXISTS "questions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "frequency" INTEGER,
    "acceptanceRate" DOUBLE PRECISION,
    "link" TEXT,
    "topics" TEXT[],
    "companies" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- Create user_progress table
CREATE TABLE IF NOT EXISTS "user_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_DONE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- Create user_notes table
CREATE TABLE IF NOT EXISTS "user_notes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "templateUsed" TEXT,
    "voiceNoteUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notes_pkey" PRIMARY KEY ("id")
);

-- Create change_logs table
CREATE TABLE IF NOT EXISTS "change_logs" (
    "id" TEXT NOT NULL,
    "questionId" TEXT,
    "type" "ChangeType" NOT NULL,
    "changes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_logs_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "user_progress_userId_questionId_key" ON "user_progress"("userId", "questionId");

-- Create foreign key constraints
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_notes" ADD CONSTRAINT "user_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_notes" ADD CONSTRAINT "user_notes_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "change_logs" ADD CONSTRAINT "change_logs_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "questions_difficulty_idx" ON "questions"("difficulty");
CREATE INDEX IF NOT EXISTS "questions_topics_idx" ON "questions" USING GIN("topics");
CREATE INDEX IF NOT EXISTS "questions_companies_idx" ON "questions" USING GIN("companies");
CREATE INDEX IF NOT EXISTS "user_progress_userId_idx" ON "user_progress"("userId");
CREATE INDEX IF NOT EXISTS "user_notes_userId_idx" ON "user_notes"("userId");
CREATE INDEX IF NOT EXISTS "change_logs_createdAt_idx" ON "change_logs"("createdAt" DESC);
