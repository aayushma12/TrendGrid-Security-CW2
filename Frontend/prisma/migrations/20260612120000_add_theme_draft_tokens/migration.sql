-- Add draft token storage for true draft vs publish separation
ALTER TABLE "Theme" ADD COLUMN "draftTokens" JSONB;
