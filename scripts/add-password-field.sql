-- Add password field to users table for credentials authentication
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" TEXT;

-- Create index for email lookups during authentication
CREATE INDEX IF NOT EXISTS "users_email_password_idx" ON "users"("email") WHERE "password" IS NOT NULL;
